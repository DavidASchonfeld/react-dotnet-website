using System.Text.Json;
using Microsoft.EntityFrameworkCore;

public class MediaApiRefService : IMediaApiRefService
{
    private readonly AppDbContext _context;
    private readonly ExternalMediaApiAdapterFactory _adapterFactory;
    private readonly IApiUsageService _apiUsageService;
    private readonly ICacheItemService _cacheItemService;
    private readonly IImageCacheService _imageCacheService;

    public MediaApiRefService(AppDbContext context, ExternalMediaApiAdapterFactory adapterFactory, IApiUsageService apiUsageService, ICacheItemService cacheItemService, IImageCacheService imageCacheService)
    {
        _context = context;
        _adapterFactory = adapterFactory;
        _apiUsageService = apiUsageService;
        _cacheItemService = cacheItemService;
        _imageCacheService = imageCacheService;
    }


    public async Task<ServiceResult<MediaApiRefDetailDto>> GetDetailByDbIdAsync(int mediaApiRefId, string requesterUserId, bool bypassCache = false)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaApiRefDetailDto>.Unauthorized();

        var mediaApiRef = await _context.MediaApiRefs
            .Include(r => r.ApiSource)
            .Include(r => r.MediaType)
            .FirstOrDefaultAsync(r => r.Id == mediaApiRefId);

        if (mediaApiRef == null) return ServiceResult<MediaApiRefDetailDto>.NotFound();

        var effectiveBypass = bypassCache && PermissionHelper.IsAdministrator(requesterUser);

        // Check CacheItem(GetById) for a fresh detail response before calling external API
        var queryParams = BuildGetByIdParams(mediaApiRef.ExternalId, mediaApiRef.ApiSource.ApiName);
        var cachedItem = effectiveBypass ? null : await _cacheItemService.GetFreshAsync(
            mediaApiRef.ApiSource.ApiName, "GetById", mediaApiRef.MediaType.Name, queryParams);

        if (cachedItem != null)
        {
            // Detail fields sourced from CacheItem.ResponseJson, not MediaApiRef columns
            var cachedDetails = JsonSerializer.Deserialize<ExternalApiSearchResult>(cachedItem.ResponseJson);
            if (cachedDetails?.Poster != null) PrewarmPoster(cachedDetails.Poster);
            return ServiceResult<MediaApiRefDetailDto>.OkFromCache(
                ToDetailDto(mediaApiRef, cachedDetails, requesterUser), cachedItem.CreatedAt);
        }

        // Cache miss — if the API is disabled, return what we have from the DB without calling the adapter
        if (mediaApiRef.ApiSource.IsDisabledByAdmin)
            return ServiceResult<MediaApiRefDetailDto>.Ok(
                ToDetailDto(mediaApiRef, null, requesterUser, isApiDisabled: true));

        // Cache miss — fetch from external API and store in CacheItem
        var adapter = _adapterFactory.GetAdapter(mediaApiRef.ApiSource.ApiName);
        if (adapter != null)
        {
            var detailedResult = await adapter.GetByExternalIdAsync(mediaApiRef.ExternalId);
            if (detailedResult != null)
            {
                // Validate image URLs before caching or persisting — null out any that are unreachable
                var thumbnailTask = detailedResult.ThumbnailUrl != null
                    ? _imageCacheService.IsImageReachableAsync(detailedResult.ThumbnailUrl)
                    : Task.FromResult(true);
                var posterTask = detailedResult.Poster != null
                    ? _imageCacheService.IsImageReachableAsync(detailedResult.Poster)
                    : Task.FromResult(true);
                await Task.WhenAll(thumbnailTask, posterTask);
                if (!thumbnailTask.Result) detailedResult.ThumbnailUrl = null;
                if (!posterTask.Result) detailedResult.Poster = null;

                // Store raw API response in CacheItem; update staleness timestamp and PosterUrl on MediaApiRef
                var responseJson = JsonSerializer.Serialize(detailedResult);
                await _cacheItemService.UpsertAsync(
                    mediaApiRef.ApiSource.ApiName, "GetById", mediaApiRef.MediaType.Name,
                    queryParams, responseJson, AppConstants.CacheItemGetByIdTtlDays);

                mediaApiRef.DetailsFetchedAt = DateTime.UtcNow;
                // Store a poster-api:// pseudo-URL when the feature is enabled; otherwise store the real CDN URL.
                if (mediaApiRef.ApiSource.UsePosterApi && adapter.BuildPosterFetchUrl(mediaApiRef.ExternalId) != null)
                    mediaApiRef.PosterUrl = $"poster-api://{mediaApiRef.ApiSource.ApiName}/{mediaApiRef.ExternalId}";
                else if (detailedResult.Poster != null)
                    mediaApiRef.PosterUrl = detailedResult.Poster;
                await _context.SaveChangesAsync();
                await _apiUsageService.TrackRequestAsync(mediaApiRef.ApiSource.ApiName);
                if (detailedResult.Poster != null) PrewarmPoster(detailedResult.Poster);

                return ServiceResult<MediaApiRefDetailDto>.Ok(ToDetailDto(mediaApiRef, detailedResult, requesterUser));
            }
        }

        return ServiceResult<MediaApiRefDetailDto>.Ok(ToDetailDto(mediaApiRef, null, requesterUser));
    }


    public async Task<ServiceResult<List<ExternalApiSearchResult>>> SearchThirdPartyApiAsync(string query, int limit, int mediaTypeId, string requesterUserId, int page = 1, string? subtype = null, bool bypassCache = false)
    {
        if (query.Length < AppConstants.SearchMinQueryLength)
            return ServiceResult<List<ExternalApiSearchResult>>.BadRequest("Search query must be at least 2 characters.");

        limit = Math.Min(limit, AppConstants.SearchResultMaxLimit);

        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<List<ExternalApiSearchResult>>.Unauthorized();

        var activeSource = await _context.ExternalApiSources
            .Include(s => s.MediaType)
            .FirstOrDefaultAsync(s => s.MediaTypeId == mediaTypeId && s.IsActive);

        if (activeSource == null)
            return ServiceResult<List<ExternalApiSearchResult>>.NotFound("No active API source found for this media type.");

        if (activeSource.IsDisabledByAdmin)
            return ServiceResult<List<ExternalApiSearchResult>>.ServiceUnavailable(
                $"The {activeSource.ApiName} API is temporarily disabled for all users.");

        var adapter = _adapterFactory.GetAdapter(activeSource.ApiName);
        if (adapter == null)
            return ServiceResult<List<ExternalApiSearchResult>>.NotImplemented($"No adapter implemented for API '{activeSource.ApiName}'.");

        var effectiveBypass = bypassCache && PermissionHelper.IsAdministrator(requesterUser);

        // CacheItem lookup: query_type="Search" with normalized query params
        var normalizedQuery = query.Trim().ToLower();
        var queryParams = new SortedDictionary<string, string?>
        {
            ["page"] = page.ToString(),
            ["search_query"] = normalizedQuery,
            ["subtype"] = subtype,
        };

        var cachedItem = effectiveBypass ? null : await _cacheItemService.GetFreshAsync(
            activeSource.ApiName, "Search", activeSource.MediaType.Name, queryParams);

        if (cachedItem != null)
        {
            var cachedResults = JsonSerializer.Deserialize<List<ExternalApiSearchResult>>(cachedItem.ResponseJson)!;
            PrewarmThumbnails(cachedResults);
            return ServiceResult<List<ExternalApiSearchResult>>.OkFromCache(cachedResults, cachedItem.CreatedAt);
        }

        // Cache miss — call external API and store result
        var results = await adapter.SearchAsync(query, limit, page, subtype);
        await _apiUsageService.TrackRequestAsync(activeSource.ApiName);

        // Validate thumbnail URLs before caching — null out any that are unreachable
        await Task.WhenAll(results.Select(async r =>
        {
            if (r.ThumbnailUrl != null && !await _imageCacheService.IsImageReachableAsync(r.ThumbnailUrl))
                r.ThumbnailUrl = null;
        }));

        var responseJson = JsonSerializer.Serialize(results);
        await _cacheItemService.UpsertAsync(
            activeSource.ApiName, "Search", activeSource.MediaType.Name,
            queryParams, responseJson, AppConstants.CacheItemSearchTtlDays);

        PrewarmThumbnails(results);
        return ServiceResult<List<ExternalApiSearchResult>>.Ok(results);
    }


    public async Task<ServiceResult<ExternalApiSearchResult>> FetchRawItemFromExternalApiAsync(string externalItemId, int externalApiSourceId, string requesterUserId, bool bypassCache = false)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<ExternalApiSearchResult>.Unauthorized();

        var source = await _context.ExternalApiSources
            .Include(s => s.MediaType)
            .FirstOrDefaultAsync(s => s.Id == externalApiSourceId);

        if (source == null)
            return ServiceResult<ExternalApiSearchResult>.NotFound("External API source not found.");

        if (source.IsDisabledByAdmin)
            return ServiceResult<ExternalApiSearchResult>.ServiceUnavailable(
                $"The {source.ApiName} API is temporarily disabled for all users.");

        var adapter = _adapterFactory.GetAdapter(source.ApiName);
        if (adapter == null)
            return ServiceResult<ExternalApiSearchResult>.NotImplemented($"No adapter implemented for API '{source.ApiName}'.");

        var effectiveBypass = bypassCache && PermissionHelper.IsAdministrator(requesterUser);

        // Caching is active only when both the global master switch AND the per-source flag are true.
        var globalSettings = await _context.AppGlobalSettings.FindAsync(1);
        var cachingEnabled = (globalSettings?.UseNonSearchQueryCache ?? true) && source.UseNonSearchQueryCache;

        if (cachingEnabled && !effectiveBypass)
        {
            // CacheItem lookup: query_type="GetById"
            var queryParams = BuildGetByIdParams(externalItemId, source.ApiName);
            var cachedItem = await _cacheItemService.GetFreshAsync(
                source.ApiName, "GetById", source.MediaType.Name, queryParams);

            if (cachedItem != null)
            {
                var cachedResult = JsonSerializer.Deserialize<ExternalApiSearchResult>(cachedItem.ResponseJson)!;
                return ServiceResult<ExternalApiSearchResult>.OkFromCache(cachedResult, cachedItem.CreatedAt);
            }
        }

        // Cache miss (or caching disabled) — call the external API
        var result = await adapter.GetByExternalIdAsync(externalItemId);
        if (result == null)
            return ServiceResult<ExternalApiSearchResult>.NotFound("Item not found in the external API.");

        await _apiUsageService.TrackRequestAsync(source.ApiName);

        if (cachingEnabled)
        {
            var queryParams = BuildGetByIdParams(externalItemId, source.ApiName);
            var responseJson = JsonSerializer.Serialize(result);
            await _cacheItemService.UpsertAsync(
                source.ApiName, "GetById", source.MediaType.Name,
                queryParams, responseJson, AppConstants.CacheItemGetByIdTtlDays);
        }

        return ServiceResult<ExternalApiSearchResult>.Ok(result);
    }


    public async Task<ServiceResult<MediaApiRefDetailDto>> GetDetailByExternalKeyAsync(string apiName, string externalId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaApiRefDetailDto>.Unauthorized();

        // Resolve ExternalApiSource by name (case-insensitive)
        var source = await _context.ExternalApiSources
            .Include(s => s.MediaType)
            .FirstOrDefaultAsync(s => s.ApiName.ToLower() == apiName.ToLower());
        if (source == null)
            return ServiceResult<MediaApiRefDetailDto>.NotFound("API source not found.");

        // Check if a DB record already exists for this external item
        var existing = await _context.MediaApiRefs
            .FirstOrDefaultAsync(r => r.ExternalApiSourceId == source.Id && r.ExternalId == externalId);

        if (existing != null)
            return await GetDetailByDbIdAsync(existing.Id, requesterUserId);

        // Not in DB — fetch from external API (with caching)
        var externalResult = await FetchRawItemFromExternalApiAsync(externalId, source.Id, requesterUserId);
        if (!externalResult.IsSuccess)
            return new ServiceResult<MediaApiRefDetailDto>
            {
                IsSuccess = false,
                ErrorMessage = externalResult.ErrorMessage,
                StatusCode = externalResult.StatusCode
            };

        // Build a partial DetailDto with Id = 0 to signal "not yet persisted"
        var ext = externalResult.Data!;
        var dto = new MediaApiRefDetailDto
        {
            Id = 0,
            Name = ext.Name,
            MediaTypeId = source.MediaTypeId,
            ExternalApiSourceId = source.Id,
            ApiSourceName = source.ApiName,
            ExternalId = ext.ExternalId,
            CreatorName = ext.CreatorName,
            PublishedDate = ext.PublishedDate,
            ThumbnailUrl = ext.ThumbnailUrl,
            Poster = ext.Poster,
            BigPosterUrl = source.UsePosterApi &&
                           _adapterFactory.GetAdapter(source.ApiName)?.BuildPosterFetchUrl(ext.ExternalId) != null
                ? $"poster-api://{source.ApiName}/{ext.ExternalId}"
                : null,
            Plot = ext.Plot,
            Runtime = ext.Runtime,
            Country = ext.Country,
            Genres = ext.Genres,
            Rated = ext.Rated,
            ApiHomepageUrl = ExternalApiRegistry.Apis.TryGetValue(source.ApiName, out var metadata) ? metadata.HomepageUrl : null,
        };
        return externalResult.CacheMetadata != null
            // Allows being able to return a CacheMetadata with a NULL CachedAt value.
            // This is helpful in case something weird happens to my cache in my database and causes
            // a cache item to still exist but have an empty/null CachedAt value.
            // This is helpful to return for the front-end administrator users to know about
            ? ServiceResult<MediaApiRefDetailDto>.OkFromCache(dto, externalResult.CacheMetadata.CachedAt)
            : ServiceResult<MediaApiRefDetailDto>.Ok(dto);
    }


    public async Task<ServiceResult<MediaApiRefDetailDto>> GetOrCreateMediaApiRefAsync(FindOrCreateMediaApiRefDto dto, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaApiRefDetailDto>.Unauthorized();

        var apiSource = await _context.ExternalApiSources.FindAsync(dto.ExternalApiSourceId);
        if (apiSource == null)
            return ServiceResult<MediaApiRefDetailDto>.NotFound("External API source not found.");

        // Idempotent upsert: return existing record if (ExternalApiSourceId, ExternalId) already exists
        var existing = await _context.MediaApiRefs
            .Include(r => r.ApiSource)
            .Include(r => r.MediaType)
            .FirstOrDefaultAsync(r =>
                r.ExternalApiSourceId == dto.ExternalApiSourceId &&
                r.ExternalId == dto.ExternalId);

        if (existing != null)
        {
            // Update ThumbnailUrl if not yet stored (e.g. record was created before this field existed)
            if (existing.ThumbnailUrl == null && dto.ThumbnailUrl != null)
            {
                existing.ThumbnailUrl = dto.ThumbnailUrl;
                await _context.SaveChangesAsync();
            }
            return ServiceResult<MediaApiRefDetailDto>.Ok(ToDetailDto(existing, null, requesterUser));
        }

        var newRef = new MediaApiRef
        {
            Name = dto.Name,
            MediaTypeId = dto.MediaTypeId,
            CreatorName = dto.CreatorName,
            PublishedDate = dto.PublishedDate,
            ExternalApiSourceId = dto.ExternalApiSourceId,
            ExternalId = dto.ExternalId,
            ThumbnailUrl = dto.ThumbnailUrl,
            DateAdded = DateTime.UtcNow
        };

        _context.MediaApiRefs.Add(newRef);
        await _context.SaveChangesAsync();

        newRef = await _context.MediaApiRefs
            .Include(r => r.ApiSource)
            .Include(r => r.MediaType)
            .FirstAsync(r => r.Id == newRef.Id);

        return ServiceResult<MediaApiRefDetailDto>.Ok(ToDetailDto(newRef, null, requesterUser));
    }


    public async Task<ServiceResult<List<MediaListSummaryDto>>> GetListsContainingRefAsync(int mediaApiRefId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<List<MediaListSummaryDto>>.Unauthorized();

        var allMatchingLists = await _context.MediaLists
            .Include(l => l.ItemLinks)
            .Where(l => l.ItemLinks.Any(link => link.MediaApiRefId == mediaApiRefId))
            .ToListAsync();

        var visibleLists = allMatchingLists
            .Where(l => PermissionHelper.CanSeeList(requesterUser, l))
            .Select(l => new MediaListSummaryDto
            {
                Id = l.Id,
                Name = l.Name,
                SubmittedById = l.SubmittedById,
                Description = l.Description,
                VisibilityStatus = l.VisibilityStatus,
                ItemCount = l.ItemLinks.Count,
                CanEdit = PermissionHelper.CanModifyOrDeleteList(requesterUser, l)
            })
            .ToList();

        return ServiceResult<List<MediaListSummaryDto>>.Ok(visibleLists);
    }


    public async Task<ServiceResult<List<CustomTagSummaryDto>>> GetTagsForRefAsync(int mediaApiRefId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<List<CustomTagSummaryDto>>.Unauthorized();

        var tags = await _context.LinkCustomTagToMediaApiRefTable
            .Include(l => l.CustomTag)
            .Where(l =>
                l.MediaApiRefId == mediaApiRefId &&
                (l.CustomTag.CreatedById == requesterUserId ||
                 l.CustomTag.VisibilityStatus == VisibilityStatus.Public))
            .Select(l => new CustomTagSummaryDto
            {
                Id = l.CustomTag.Id,
                Name = l.CustomTag.Name,
                VisibilityStatus = l.CustomTag.VisibilityStatus,
                CreatedById = l.CustomTag.CreatedById
            })
            .ToListAsync();

        return ServiceResult<List<CustomTagSummaryDto>>.Ok(tags);
    }


    // Fire-and-forget: pre-warm ImageCache for all thumbnail URLs in search results.
    // Called in both cache-hit and fresh-fetch paths since image TTL is independent of query cache TTL.
    private void PrewarmThumbnails(IEnumerable<ExternalApiSearchResult> results)
    {
        var urls = results.Select(r => r.ThumbnailUrl).Where(u => u != null).ToList();
        if (urls.Count == 0) return;
        _ = Task.WhenAll(urls.Select(url => Task.Run(async () =>
        {
            try { await _imageCacheService.GetOrFetchImageAsync(url!); }
            catch { /* best-effort; don't fail the search if an image fetch fails */ }
        })));
    }

    // Fire-and-forget: pre-warm ImageCache for a single full-size poster URL from a detail fetch.
    private void PrewarmPoster(string posterUrl) =>
        _ = Task.Run(async () =>
        {
            try { await _imageCacheService.GetOrFetchImageAsync(posterUrl); }
            catch { /* best-effort */ }
        });


    // Shared query params builder for GetById lookups — used across search, detail, and refresh flows
    private static SortedDictionary<string, string?> BuildGetByIdParams(string externalId, string apiSource) =>
        new SortedDictionary<string, string?>
        {
            ["api_source"] = apiSource,
            ["media_id"] = externalId,
        };

    // Detail fields sourced from CacheItem.ResponseJson, not MediaApiRef columns.
    // AdminInfo is only populated for administrators — non-admins receive null.
    // isApiDisabled: set when the API source is disabled by admin and the cache was empty.
    private static MediaApiRefDetailDto ToDetailDto(MediaApiRef r, ExternalApiSearchResult? details, AppUser? requesterUser, bool isApiDisabled = false) => new()
    {
        Id = r.Id,
        Name = r.Name,
        MediaTypeId = r.MediaTypeId,
        CreatorName = r.CreatorName,
        PublishedDate = r.PublishedDate,
        ExternalApiSourceId = r.ExternalApiSourceId,
        ApiSourceName = r.ApiSource.ApiName,
        ExternalId = r.ExternalId,
        ApiHomepageUrl = ExternalApiRegistry.Apis.TryGetValue(r.ApiSource.ApiName, out var metadata) ? metadata.HomepageUrl : null,
        AdminInfo = requesterUser != null && PermissionHelper.IsAdministrator(requesterUser) ? new MediaApiRefAdminInfoDto
        {
            DateAdded = r.DateAdded,
            DetailsFetchedAt = r.DetailsFetchedAt,
            IsStale = r.DetailsFetchedAt.HasValue &&
                      (DateTime.UtcNow - r.DetailsFetchedAt.Value).TotalDays > AppConstants.DetailsStaleDays,
        } : null,
        IsApiDisabled = isApiDisabled,
        ThumbnailUrl = r.ThumbnailUrl,
        // BigPosterUrl is set when PosterUrl holds a pseudo-URL; null means no high-res poster is available.
        BigPosterUrl = r.ApiSource.UsePosterApi
            ? $"poster-api://{r.ApiSource.ApiName}/{r.ExternalId}"
            : null,
        // Poster is always a real CDN URL — skip PosterUrl when it's a pseudo-URL.
        Poster = details?.Poster ?? (r.PosterUrl?.StartsWith("poster-api://") == true ? null : r.PosterUrl),
        Plot = details?.Plot,
        Runtime = details?.Runtime,
        Country = details?.Country ?? r.Country,
        Genres = details?.Genres,
        Rated = details?.Rated,
    };
}

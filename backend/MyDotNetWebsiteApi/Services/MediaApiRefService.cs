using System.Text.Json;
using Microsoft.EntityFrameworkCore;

public class MediaApiRefService : IMediaApiRefService
{
    private readonly AppDbContext _context;
    private readonly ExternalMediaApiAdapterFactory _adapterFactory;
    private readonly IApiUsageService _apiUsageService;

    public MediaApiRefService(AppDbContext context, ExternalMediaApiAdapterFactory adapterFactory, IApiUsageService apiUsageService)
    {
        _context = context;
        _adapterFactory = adapterFactory;
        _apiUsageService = apiUsageService;
    }


    public async Task<ServiceResult<MediaApiRefDetailDto>> GetMediaApiRefDetailAsync(int mediaApiRefId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaApiRefDetailDto>.Unauthorized();

        var mediaApiRef = await _context.MediaApiRefs
            .Include(r => r.ApiSource)
            .FirstOrDefaultAsync(r => r.Id == mediaApiRefId);

        if (mediaApiRef == null) return ServiceResult<MediaApiRefDetailDto>.NotFound();

        return ServiceResult<MediaApiRefDetailDto>.Ok(ToDetailDto(mediaApiRef));
    }


    public async Task<ServiceResult<List<ExternalApiSearchResult>>> SearchExternalApiAsync(string query, int limit, int mediaTypeId, string requesterUserId, int page = 1, string? subtype = null)
    {
        if (query.Length < AppConstants.SearchMinQueryLength)
            return ServiceResult<List<ExternalApiSearchResult>>.BadRequest("Search query must be at least 2 characters.");

        limit = Math.Min(limit, AppConstants.SearchResultMaxLimit);

        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<List<ExternalApiSearchResult>>.Unauthorized();

        // Get the active API source for this media type
        var activeSource = await _context.ExternalApiSources
            .FirstOrDefaultAsync(s => s.MediaTypeId == mediaTypeId && s.IsActive);

        if (activeSource == null)
            return ServiceResult<List<ExternalApiSearchResult>>.NotFound("No active API source found for this media type.");

        if (activeSource.IsDisabledByAdmin)
            return ServiceResult<List<ExternalApiSearchResult>>.ServiceUnavailable(
                $"The {activeSource.ApiName} API is temporarily disabled for all users.");

        var adapter = _adapterFactory.GetAdapter(activeSource.ApiName);
        if (adapter == null)
            return ServiceResult<List<ExternalApiSearchResult>>.NotImplemented($"No adapter implemented for API '{activeSource.ApiName}'.");

        // Check cache before hitting the external API
        var normalizedQuery = query.Trim().ToLower();
        var staleThreshold = DateTime.UtcNow.AddDays(-AppConstants.SearchCacheStaleDays);

        var cachedEntry = await _context.SearchQueryCaches
            .Where(c => c.NormalizedQuery == normalizedQuery
                     && c.ExternalApiSourceId == activeSource.Id
                     && c.Page == page
                     && c.Subtype == subtype
                     && c.CachedAt >= staleThreshold)
            .FirstOrDefaultAsync();

        if (cachedEntry != null)
        {
            var cachedResults = JsonSerializer.Deserialize<List<ExternalApiSearchResult>>(cachedEntry.ResultsJson)!;
            return ServiceResult<List<ExternalApiSearchResult>>.OkFromCache(cachedResults, cachedEntry.CachedAt);
        }

        // Cache miss — call the external API and store the result
        var results = await adapter.SearchAsync(query, limit, page, subtype);
        await _apiUsageService.TrackRequestAsync(activeSource.ApiName);

        var resultsJson = JsonSerializer.Serialize(results);
        var existingEntry = await _context.SearchQueryCaches
            .FirstOrDefaultAsync(c => c.NormalizedQuery == normalizedQuery
                                   && c.ExternalApiSourceId == activeSource.Id
                                   && c.Page == page
                                   && c.Subtype == subtype);

        if (existingEntry != null)
        {
            existingEntry.ResultsJson = resultsJson;
            existingEntry.CachedAt = DateTime.UtcNow;
        }
        else
        {
            _context.SearchQueryCaches.Add(new SearchQueryCache
            {
                NormalizedQuery = normalizedQuery,
                ExternalApiSourceId = activeSource.Id,
                Page = page,
                Subtype = subtype,
                ResultsJson = resultsJson,
                CachedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return ServiceResult<List<ExternalApiSearchResult>>.Ok(results);
    }


    public async Task<ServiceResult<ExternalApiSearchResult>> GetExternalApiItemAsync(string externalItemId, int externalApiSourceId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<ExternalApiSearchResult>.Unauthorized();

        var source = await _context.ExternalApiSources.FindAsync(externalApiSourceId);
        if (source == null)
            return ServiceResult<ExternalApiSearchResult>.NotFound("External API source not found.");

        if (source.IsDisabledByAdmin)
            return ServiceResult<ExternalApiSearchResult>.ServiceUnavailable(
                $"The {source.ApiName} API is temporarily disabled for all users.");

        var adapter = _adapterFactory.GetAdapter(source.ApiName);
        if (adapter == null)
            return ServiceResult<ExternalApiSearchResult>.NotImplemented($"No adapter implemented for API '{source.ApiName}'.");

        // Caching is active only when both the global master switch AND the per-source flag are true.
        var globalSettings = await _context.AppGlobalSettings.FindAsync(1);
        var cachingEnabled = (globalSettings?.UseNonSearchQueryCache ?? true) && source.UseNonSearchQueryCache;

        if (cachingEnabled)
        {
            var staleThreshold = DateTime.UtcNow.AddDays(-AppConstants.NonSearchCacheStaleDays);
            var cachedEntry = await _context.NonSearchQueryCaches
                .Where(c => c.ExternalItemId == externalItemId
                         && c.ExternalApiSourceId == externalApiSourceId
                         && c.CachedAt >= staleThreshold)
                .FirstOrDefaultAsync();

            if (cachedEntry != null)
            {
                var cachedResult = JsonSerializer.Deserialize<ExternalApiSearchResult>(cachedEntry.ResultsJson)!;
                return ServiceResult<ExternalApiSearchResult>.OkFromCache(cachedResult, cachedEntry.CachedAt);
            }
        }

        // Cache miss (or caching disabled) — call the external API.
        var result = await adapter.GetByExternalIdAsync(externalItemId);
        if (result == null)
            return ServiceResult<ExternalApiSearchResult>.NotFound("Item not found in the external API.");

        await _apiUsageService.TrackRequestAsync(source.ApiName);

        if (cachingEnabled)
        {
            var resultJson = JsonSerializer.Serialize(result);

            // Upsert: update the existing entry if present, otherwise insert a new one.
            var existingEntry = await _context.NonSearchQueryCaches
                .FirstOrDefaultAsync(c => c.ExternalItemId == externalItemId
                                       && c.ExternalApiSourceId == externalApiSourceId);

            if (existingEntry != null)
            {
                existingEntry.ResultsJson = resultJson;
                existingEntry.CachedAt = DateTime.UtcNow;
            }
            else
            {
                _context.NonSearchQueryCaches.Add(new NonSearchQueryCache
                {
                    ExternalItemId      = externalItemId,
                    ExternalApiSourceId = externalApiSourceId,
                    ResultsJson         = resultJson,
                    CachedAt            = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
        }

        return ServiceResult<ExternalApiSearchResult>.Ok(result);
    }


    public async Task<ServiceResult<MediaApiRefDetailDto>> FindOrCreateAsync(FindOrCreateMediaApiRefDto dto, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaApiRefDetailDto>.Unauthorized();

        // Check if the ExternalApiSource exists
        var apiSource = await _context.ExternalApiSources.FindAsync(dto.ExternalApiSourceId);
        if (apiSource == null)
            return ServiceResult<MediaApiRefDetailDto>.NotFound("External API source not found.");

        // Find existing record by the unique (ExternalApiSourceId, ExternalId) key
        var existing = await _context.MediaApiRefs
            .Include(r => r.ApiSource)
            .FirstOrDefaultAsync(r =>
                r.ExternalApiSourceId == dto.ExternalApiSourceId &&
                r.ExternalId == dto.ExternalId);

        if (existing != null)
            return ServiceResult<MediaApiRefDetailDto>.Ok(ToDetailDto(existing));

        // Create new record
        var newRef = new MediaApiRef
        {
            Name = dto.Name,
            MediaTypeId = dto.MediaTypeId,
            CreatorName = dto.CreatorName,
            PublishedDate = dto.PublishedDate,
            ExternalApiSourceId = dto.ExternalApiSourceId,
            ExternalId = dto.ExternalId,
            DateAdded = DateTime.UtcNow
        };

        _context.MediaApiRefs.Add(newRef);
        await _context.SaveChangesAsync();

        // Reload with includes to populate ApiSource navigation property
        newRef = await _context.MediaApiRefs
            .Include(r => r.ApiSource)
            .FirstAsync(r => r.Id == newRef.Id);

        return ServiceResult<MediaApiRefDetailDto>.Ok(ToDetailDto(newRef));
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

        // Return tags that the requester created OR that are public
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


    // Private helper
    private static MediaApiRefDetailDto ToDetailDto(MediaApiRef r) => new()
    {
        Id = r.Id,
        Name = r.Name,
        MediaTypeId = r.MediaTypeId,
        CreatorName = r.CreatorName,
        PublishedDate = r.PublishedDate,
        ExternalApiSourceId = r.ExternalApiSourceId,
        ApiSourceName = r.ApiSource.ApiName,
        ExternalId = r.ExternalId,
        DateAdded = r.DateAdded,
        ApiHomepageUrl = ExternalApiRegistry.Apis.TryGetValue(r.ApiSource.ApiName, out var metadata) ? metadata.HomepageUrl : null
    };
}

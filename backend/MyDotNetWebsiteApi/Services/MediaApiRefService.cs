using Microsoft.EntityFrameworkCore;

public class MediaApiRefService : IMediaApiRefService
{
    private readonly AppDbContext _context;
    private readonly ExternalMediaApiAdapterFactory _adapterFactory;

    public MediaApiRefService(AppDbContext context, ExternalMediaApiAdapterFactory adapterFactory)
    {
        _context = context;
        _adapterFactory = adapterFactory;
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


    public async Task<ServiceResult<List<ExternalApiSearchResult>>> SearchExternalApiAsync(string query, int limit, int mediaTypeId, string requesterUserId, int page = 1)
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

        var adapter = _adapterFactory.GetAdapter(activeSource.ApiName);
        if (adapter == null)
            return ServiceResult<List<ExternalApiSearchResult>>.NotImplemented($"No adapter implemented for API '{activeSource.ApiName}'.");

        var results = await adapter.SearchAsync(query, limit, page);
        return ServiceResult<List<ExternalApiSearchResult>>.Ok(results);
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
        DateAdded = r.DateAdded
    };
}

using Microsoft.EntityFrameworkCore;

public class CustomTagService : ICustomTagService
{
    private readonly AppDbContext _context;

    public CustomTagService(AppDbContext context)
    {
        _context = context;
    }


    public async Task<ServiceResult<PaginatedResultDto<CustomTagSummaryDto>>> GetMyTagsAsync(string requesterUserId, int page, int pageSize)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<PaginatedResultDto<CustomTagSummaryDto>>.Unauthorized();

        var query = _context.CustomTags
            .Where(t => t.CreatedById == requesterUserId || t.VisibilityStatus == VisibilityStatus.Public)
            .OrderBy(t => t.Name);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new CustomTagSummaryDto
            {
                Id = t.Id,
                Name = t.Name,
                VisibilityStatus = t.VisibilityStatus,
                CreatedById = t.CreatedById
            })
            .ToListAsync();

        return ServiceResult<PaginatedResultDto<CustomTagSummaryDto>>.Ok(new PaginatedResultDto<CustomTagSummaryDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }


    public async Task<ServiceResult<CustomTagSummaryDto>> CreateTagAsync(CreateCustomTagDto dto, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<CustomTagSummaryDto>.Unauthorized();

        var newTag = new CustomTag
        {
            Name = dto.Name,
            VisibilityStatus = dto.VisibilityStatus,
            CreatedById = requesterUserId,
            DateCreated = DateTime.UtcNow
        };

        _context.CustomTags.Add(newTag);
        await _context.SaveChangesAsync();

        return ServiceResult<CustomTagSummaryDto>.Ok(ToSummaryDto(newTag));
    }


    public async Task<ServiceResult<CustomTagSummaryDto>> UpdateTagAsync(int tagId, UpdateCustomTagDto dto, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<CustomTagSummaryDto>.Unauthorized();

        var tag = await _context.CustomTags.FindAsync(tagId);
        if (tag == null) return ServiceResult<CustomTagSummaryDto>.NotFound();

        if (tag.CreatedById != requesterUserId && !PermissionHelper.IsModeratorOrAdmin(requesterUser))
            return ServiceResult<CustomTagSummaryDto>.Forbidden();

        if (dto.Name != null) tag.Name = dto.Name;
        if (dto.VisibilityStatus != null) tag.VisibilityStatus = dto.VisibilityStatus.Value;

        await _context.SaveChangesAsync();
        return ServiceResult<CustomTagSummaryDto>.Ok(ToSummaryDto(tag));
    }


    public async Task<ServiceResult<bool>> DeleteTagAsync(int tagId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<bool>.Unauthorized();

        var tag = await _context.CustomTags.FindAsync(tagId);
        if (tag == null) return ServiceResult<bool>.NotFound();

        if (tag.CreatedById != requesterUserId && !PermissionHelper.IsModeratorOrAdmin(requesterUser))
            return ServiceResult<bool>.Forbidden();

        _context.CustomTags.Remove(tag);
        await _context.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }


    public async Task<ServiceResult<List<CustomTagSummaryDto>>> SearchTagsAsync(string query, int limit, string requesterUserId)
    {
        if (query.Length < AppConstants.SearchMinQueryLength)
            return ServiceResult<List<CustomTagSummaryDto>>.BadRequest("Search query must be at least 2 characters.");

        limit = Math.Min(limit, AppConstants.SearchResultMaxLimit);

        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<List<CustomTagSummaryDto>>.Unauthorized();

        var queryLower = query.ToLower();
        var tags = await _context.CustomTags
            .Where(t =>
                t.Name.ToLower().Contains(queryLower) &&
                (t.CreatedById == requesterUserId || t.VisibilityStatus == VisibilityStatus.Public))
            .OrderBy(t => t.Name)
            .Take(limit)
            .Select(t => new CustomTagSummaryDto
            {
                Id = t.Id,
                Name = t.Name,
                VisibilityStatus = t.VisibilityStatus,
                CreatedById = t.CreatedById
            })
            .ToListAsync();

        return ServiceResult<List<CustomTagSummaryDto>>.Ok(tags);
    }


    public async Task<ServiceResult<bool>> AddTagToMediaApiRefAsync(int tagId, int mediaApiRefId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<bool>.Unauthorized();

        var tag = await _context.CustomTags.FindAsync(tagId);
        if (tag == null) return ServiceResult<bool>.NotFound("Tag not found.");

        // Only the tag's creator can apply it (private tags) or anyone (public tags)
        if (tag.VisibilityStatus == VisibilityStatus.Private && tag.CreatedById != requesterUserId)
            return ServiceResult<bool>.Forbidden();

        var mediaApiRef = await _context.MediaApiRefs.FindAsync(mediaApiRefId);
        if (mediaApiRef == null) return ServiceResult<bool>.NotFound("MediaApiRef not found.");

        bool alreadyTagged = await _context.LinkCustomTagToMediaApiRefTable
            .AnyAsync(l => l.CustomTagId == tagId && l.MediaApiRefId == mediaApiRefId);

        if (alreadyTagged)
            return ServiceResult<bool>.Conflict("This tag is already applied to this item.");

        _context.LinkCustomTagToMediaApiRefTable.Add(new LinkCustomTagToMediaApiRef
        {
            CustomTagId = tagId,
            MediaApiRefId = mediaApiRefId,
            AddedById = requesterUserId,
            DateAdded = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }


    public async Task<ServiceResult<bool>> RemoveTagFromMediaApiRefAsync(int tagId, int mediaApiRefId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<bool>.Unauthorized();

        var linkRow = await _context.LinkCustomTagToMediaApiRefTable
            .FirstOrDefaultAsync(l => l.CustomTagId == tagId && l.MediaApiRefId == mediaApiRefId);

        if (linkRow == null)
            return ServiceResult<bool>.NotFound("This tag is not applied to this item.");

        // Requester must be the one who added the tag, or the tag owner, or mod/admin
        var tag = await _context.CustomTags.FindAsync(tagId);
        bool canRemove = linkRow.AddedById == requesterUserId
            || (tag != null && tag.CreatedById == requesterUserId)
            || PermissionHelper.IsModeratorOrAdmin(requesterUser);

        if (!canRemove) return ServiceResult<bool>.Forbidden();

        _context.LinkCustomTagToMediaApiRefTable.Remove(linkRow);
        await _context.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }


    public async Task<ServiceResult<PaginatedResultDto<MediaApiRefSummaryDto>>> GetItemsByTagAsync(int tagId, string requesterUserId, int page, int pageSize)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<PaginatedResultDto<MediaApiRefSummaryDto>>.Unauthorized();

        var tag = await _context.CustomTags.FindAsync(tagId);
        if (tag == null) return ServiceResult<PaginatedResultDto<MediaApiRefSummaryDto>>.NotFound("Tag not found.");

        // Can only view items for a tag if it's public or the requester created it
        if (tag.VisibilityStatus == VisibilityStatus.Private && tag.CreatedById != requesterUserId)
            return ServiceResult<PaginatedResultDto<MediaApiRefSummaryDto>>.Forbidden();

        var tagQuery = _context.LinkCustomTagToMediaApiRefTable
            .Where(l => l.CustomTagId == tagId);

        var totalCount = await tagQuery.CountAsync();

        var items = await tagQuery
            .Include(l => l.MediaApiRef)
            .OrderBy(l => l.MediaApiRefId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new MediaApiRefSummaryDto
            {
                Id = l.MediaApiRef.Id,
                Name = l.MediaApiRef.Name,
                MediaTypeId = l.MediaApiRef.MediaTypeId,
                CreatorName = l.MediaApiRef.CreatorName,
                PublishedDate = l.MediaApiRef.PublishedDate,
                ExternalId = l.MediaApiRef.ExternalId
            })
            .ToListAsync();

        return ServiceResult<PaginatedResultDto<MediaApiRefSummaryDto>>.Ok(new PaginatedResultDto<MediaApiRefSummaryDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }


    // Private helper
    private static CustomTagSummaryDto ToSummaryDto(CustomTag t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        VisibilityStatus = t.VisibilityStatus,
        CreatedById = t.CreatedById
    };
}

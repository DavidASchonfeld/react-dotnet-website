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
                Description = t.Description,
                VisibilityStatus = t.VisibilityStatus,
                CreatedById = t.CreatedById,
                CanEdit = t.CreatedById == requesterUserId  // Owner-only
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

        // Only mod/admin can create a tag with Public visibility
        if (dto.VisibilityStatus == VisibilityStatus.Public && !PermissionHelper.IsModeratorOrAdmin(requesterUser))
            return ServiceResult<CustomTagSummaryDto>.Forbidden();

        var newTag = new CustomTag
        {
            Name = dto.Name,
            Description = dto.Description,
            VisibilityStatus = dto.VisibilityStatus,
            CreatedById = requesterUserId,
            DateCreated = DateTime.UtcNow
        };

        _context.CustomTags.Add(newTag);
        await _context.SaveChangesAsync();

        return ServiceResult<CustomTagSummaryDto>.Ok(ToSummaryDto(newTag, requesterUser));
    }


    public async Task<ServiceResult<CustomTagSummaryDto>> UpdateTagAsync(int tagId, UpdateCustomTagDto dto, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<CustomTagSummaryDto>.Unauthorized();

        var tag = await _context.CustomTags.FindAsync(tagId);
        if (tag == null) return ServiceResult<CustomTagSummaryDto>.NotFound();

        // Name/description edits require ownership
        if ((dto.Name != null || dto.Description != null) && !PermissionHelper.CanEditTagMetadata(requesterUser, tag))
            return ServiceResult<CustomTagSummaryDto>.Forbidden();

        // Visibility changes require mod/admin (or owner reverting to Private)
        if (dto.VisibilityStatus != null && !PermissionHelper.CanSetTagVisibility(requesterUser, tag))
            return ServiceResult<CustomTagSummaryDto>.Forbidden();

        // Only mod/admin can promote a tag to Public
        if (dto.VisibilityStatus == VisibilityStatus.Public && !PermissionHelper.IsModeratorOrAdmin(requesterUser))
            return ServiceResult<CustomTagSummaryDto>.Forbidden();

        if (dto.Name != null) tag.Name = dto.Name;
        if (dto.Description != null) tag.Description = dto.Description;
        if (dto.VisibilityStatus != null) tag.VisibilityStatus = dto.VisibilityStatus.Value;

        await _context.SaveChangesAsync();
        return ServiceResult<CustomTagSummaryDto>.Ok(ToSummaryDto(tag, requesterUser));
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


    public async Task<ServiceResult<List<CustomTagSummaryDto>>> SearchTagsAsync(string query, int limit, string? requesterUserId, bool mineOnly = false, int page = 1)
    {
        limit = Math.Min(limit, AppConstants.SearchResultMaxLimit);

        var queryLower = query.ToLower();
        var tags = await _context.CustomTags
            .Where(t =>
                t.Name.ToLower().Contains(queryLower) &&
                // mineOnly: return only the requester's own tags, skipping public tags from other users
                // anonymous users (null requesterUserId) only see public tags
                (mineOnly
                    ? t.CreatedById == requesterUserId
                    : (t.CreatedById == requesterUserId || t.VisibilityStatus == VisibilityStatus.Public)))
            .OrderBy(t => t.Name)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(t => new CustomTagSummaryDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                VisibilityStatus = t.VisibilityStatus,
                CreatedById = t.CreatedById,
                CanEdit = t.CreatedById == requesterUserId  // Owner-only
            })
            .ToListAsync();

        return ServiceResult<List<CustomTagSummaryDto>>.Ok(tags);
    }


    public async Task<ServiceResult<bool>> AddTagToMediaApiRefAsync(int tagId, int mediaApiRefId, string requesterUserId, AddTagToMediaApiRefDto? dto = null)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<bool>.Unauthorized();

        var tag = await _context.CustomTags.FindAsync(tagId);
        if (tag == null) return ServiceResult<bool>.NotFound("Tag not found.");

        // Creator can always apply; admin can also apply/manage public tags
        bool canApplyTag = tag.CreatedById == requesterUserId
            || (PermissionHelper.IsAdministrator(requesterUser) && tag.VisibilityStatus == VisibilityStatus.Public);
        if (!canApplyTag)
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
            Note = dto?.Note,
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


    public async Task<ServiceResult<CustomTagSummaryDto>> GetTagAsync(int tagId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<CustomTagSummaryDto>.Unauthorized();

        var tag = await _context.CustomTags.FindAsync(tagId);
        if (tag == null) return ServiceResult<CustomTagSummaryDto>.NotFound();

        if (tag.VisibilityStatus == VisibilityStatus.Private && tag.CreatedById != requesterUserId)
            return ServiceResult<CustomTagSummaryDto>.Forbidden();

        return ServiceResult<CustomTagSummaryDto>.Ok(ToSummaryDto(tag, requesterUser));
    }


    public async Task<ServiceResult<PaginatedResultDto<TaggedMediaApiRefDto>>> GetItemsByTagAsync(int tagId, string requesterUserId, int page, int pageSize)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<PaginatedResultDto<TaggedMediaApiRefDto>>.Unauthorized();

        var tag = await _context.CustomTags.FindAsync(tagId);
        if (tag == null) return ServiceResult<PaginatedResultDto<TaggedMediaApiRefDto>>.NotFound("Tag not found.");

        // Can only view items for a tag if it's public or the requester created it
        if (tag.VisibilityStatus == VisibilityStatus.Private && tag.CreatedById != requesterUserId)
            return ServiceResult<PaginatedResultDto<TaggedMediaApiRefDto>>.Forbidden();

        var tagQuery = _context.LinkCustomTagToMediaApiRefTable
            .Where(l => l.CustomTagId == tagId);

        var totalCount = await tagQuery.CountAsync();

        var items = await tagQuery
            .Include(l => l.MediaApiRef)
                .ThenInclude(r => r.ApiSource)
            .OrderBy(l => l.MediaApiRefId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new TaggedMediaApiRefDto
            {
                TagNote = l.Note,
                Item = new MediaApiRefSummaryDto
                {
                    Id = l.MediaApiRef.Id,
                    Name = l.MediaApiRef.Name,
                    MediaTypeId = l.MediaApiRef.MediaTypeId,
                    CreatorName = l.MediaApiRef.CreatorName,
                    PublishedDate = l.MediaApiRef.PublishedDate,
                    ExternalId = l.MediaApiRef.ExternalId,
                    ApiSourceName = l.MediaApiRef.ApiSource.ApiName,
                    ThumbnailUrl = l.MediaApiRef.ThumbnailUrl  // include thumbnail so frontend rows can display it
                }
            })
            .ToListAsync();

        return ServiceResult<PaginatedResultDto<TaggedMediaApiRefDto>>.Ok(new PaginatedResultDto<TaggedMediaApiRefDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }


    // Private helper — basic overload (no user context; CanEdit defaults to false)
    private static CustomTagSummaryDto ToSummaryDto(CustomTag t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Description = t.Description,
        VisibilityStatus = t.VisibilityStatus,
        CreatedById = t.CreatedById
    };

    // Overload with user context — computes CanEdit from permission helpers
    private static CustomTagSummaryDto ToSummaryDto(CustomTag t, AppUser requester) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Description = t.Description,
        VisibilityStatus = t.VisibilityStatus,
        CreatedById = t.CreatedById,
        CanEdit = PermissionHelper.CanEditTagMetadata(requester, t),
    };
}

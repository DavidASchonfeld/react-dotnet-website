using Microsoft.EntityFrameworkCore;

public class MediaListService : IMediaListService

{
    private static readonly HashSet<string> _mutuallyExclusiveListNames =
        new() { "Want to Read", "Currently Reading", "Read", "Did Not Finish" };

    private readonly AppDbContext _context;

    public MediaListService(AppDbContext context)
    {
        _context = context;
    }


    // Private helpers


    private async Task<(AppUser? user, MediaList? mediaListObject, bool forbidden)> FetchListWithModifyCheckAsync(int mediaListId, string requesterId)
    {
        var user = await _context.Users.FindAsync(requesterId);
        var mediaListObject = await _context.MediaLists.FindAsync(mediaListId);

        if (user == null || mediaListObject == null)
            // Return early — callers check whether user and/or mediaListObject is null before reaching the forbidden boolean to check.
            return (user, mediaListObject, false);

        return (user, mediaListObject, !PermissionHelper.CanModifyOrDeleteList(user, mediaListObject));
    }

    private async Task<int> ClampPositionAsync(int mediaListId, int? submittedPosition, bool isAdding)
    {
        int count = await _context.LinkMediaApiRefToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .CountAsync();


        // isAdding:
        //    == true: Therefore, the future list's length = currentLength + 1.
        //    == false (Meaning, we are just shifting a MediaApiRef within the list. Therefore, the future list's length = it's current length.
        int maxPosition = isAdding ? count : count - 1;

        // If submittedPosition is null, use maxPosition
        int position = submittedPosition ?? maxPosition;

        if (position < 0) return 0;
        if (position > maxPosition) return maxPosition;

        return position;
    }


    private async Task ShiftPositionsAsync(int targetPosition, int mediaListId, bool isAdding)
    {
        int delta = isAdding ? 1: -1;
        var rows = await _context.LinkMediaApiRefToMediaListTable
            .Where(l => l.HostListId == mediaListId && l.Position >= targetPosition)
            .ToListAsync();

        foreach (var row in rows) row.Position += delta;
    }

    private async Task<int> GetItemCountAsync(int mediaListId) =>
        await _context.LinkMediaApiRefToMediaListTable
        .Where(l => l.HostListId == mediaListId)
        .CountAsync();


    private static MediaListSummaryDto ToSummaryDto(MediaList mediaListObject, int itemCount, bool canEdit = true) => new()
    {
        Id = mediaListObject.Id,
        Name = mediaListObject.Name,
        SubmittedById = mediaListObject.SubmittedById,
        Description = mediaListObject.Description,
        VisibilityStatus = mediaListObject.VisibilityStatus,
        ItemCount = itemCount,
        CanEdit = canEdit,
        IsDefault = mediaListObject.IsDefault,
        IsFeatured = mediaListObject.IsFeatured
    };



    // ---- Public Service Methods ----

    public async Task<ServiceResult<PaginatedResultDto<MediaListSummaryDto>>> GetMyListsAsync(string requesterUserId, int page, int pageSize)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<PaginatedResultDto<MediaListSummaryDto>>.Unauthorized();

        var query = _context.MediaLists.Where(l => l.SubmittedById == requesterUserId);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(l => l.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new MediaListSummaryDto
            {
                Id = l.Id,
                Name = l.Name,
                SubmittedById = l.SubmittedById,
                Description = l.Description,
                VisibilityStatus = l.VisibilityStatus,
                ItemCount = l.ItemLinks.Count,
                CanEdit = true,  // GetMyLists only returns lists the user submitted, so they always own them
                IsDefault = l.IsDefault,
                IsFeatured = l.IsFeatured
            })
            .ToListAsync();

        return ServiceResult<PaginatedResultDto<MediaListSummaryDto>>.Ok(new PaginatedResultDto<MediaListSummaryDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }


    public async Task<ServiceResult<MediaListDetailDto>> GetMediaListDetailAsync(int mediaListId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaListDetailDto>.Unauthorized();


        var targetMediaList = await _context.MediaLists.FindAsync(mediaListId);
        if (targetMediaList == null) return ServiceResult<MediaListDetailDto>.NotFound();

        if(!PermissionHelper.CanSeeList(requesterUser, targetMediaList))
            return ServiceResult<MediaListDetailDto>.Forbidden();

        var mediaList_withIncludes = await _context.MediaLists
            .Include(l => l.ItemLinks)  // Load the link rows
                .ThenInclude(link => link.MediaApiRef)  // and the MediaApiRef attached via the link row
                    .ThenInclude(r => r.ApiSource)
            .FirstOrDefaultAsync(l => l.Id == mediaListId);

        if(mediaList_withIncludes == null) return ServiceResult<MediaListDetailDto>.NotFound();

        return ServiceResult<MediaListDetailDto>.Ok(new MediaListDetailDto
        {
            Id = mediaList_withIncludes.Id,
            Name = mediaList_withIncludes.Name,
            Description = mediaList_withIncludes.Description,
            SubmittedById = mediaList_withIncludes.SubmittedById,
            VisibilityStatus = mediaList_withIncludes.VisibilityStatus,
            CanEdit = PermissionHelper.CanModifyOrDeleteList(requesterUser, targetMediaList),
            IsDefault = mediaList_withIncludes.IsDefault,
            IsFeatured = mediaList_withIncludes.IsFeatured,
            ListContent = mediaList_withIncludes.ItemLinks
                .OrderBy(link => link.Position)  // Sorts Ascending by Default, which is what I want
                .Select(link => new MediaApiRefSummaryDto
                {
                    Id = link.MediaApiRef.Id,
                    Name = link.MediaApiRef.Name,
                    MediaTypeId = link.MediaApiRef.MediaTypeId,
                    CreatorName = link.MediaApiRef.CreatorName,
                    PublishedDate = link.MediaApiRef.PublishedDate,
                    ExternalId = link.MediaApiRef.ExternalId,
                    ApiSourceName = link.MediaApiRef.ApiSource.ApiName,
                    ThumbnailUrl = link.MediaApiRef.ThumbnailUrl
                })
                .ToList()
        });

    }


    // CreateList, when we create, we create an empty list. Items are added in AddMediaApiRefToList.
    public async Task<ServiceResult<MediaListSummaryDto>> CreateListAsync(CreateMediaListDto dto, string requesterUserId)
    {
        // If the current user does not exist, you cannot create the list
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaListSummaryDto>.Unauthorized();

        var newMediaList = new MediaList
        {
            Name = dto.Name,
            Description = dto.Description,


            // The following line means:
            // If dto.VisibilityStatus is null, set it to Private
            // AKA by default, if I don't get a VisiblityStatus value, I'll set it to Private by default
            // In Code Terms, it also means:
            // if (dto.VisibilityStatus == null){
            //     VisibilityStatusToSet = VisibilityStatus.Private
            // } else {
            //     VisibilityStatusToSet = dto.VisibilityStatus
            // }
            VisibilityStatus = dto.VisibilityStatus ?? VisibilityStatus.Private,
            SubmittedById = requesterUserId,
            DateSubmitted = DateTime.UtcNow
        };

        _context.MediaLists.Add(newMediaList);
        await _context.SaveChangesAsync();  // Flush changes

        // Passing in itemCount = 0 since a newly created MediaList always starts with 0 items inside.
        return ServiceResult<MediaListSummaryDto>.Ok(ToSummaryDto(newMediaList, 0));
    }


    public async Task<ServiceResult<bool>> DeleteListAsync(int mediaListId, string requesterUserId)
    {

        // Fetch the User and MediaList Object and then Check Permissions:
        var (requesterUser, mediaList, forbidden) = await FetchListWithModifyCheckAsync(mediaListId, requesterUserId);

        if (mediaList == null) return ServiceResult<bool>.NotFound();
        if (requesterUser == null) return ServiceResult<bool>.Unauthorized();
        if (forbidden) return ServiceResult<bool>.Forbidden();
        if (mediaList.IsDefault) return ServiceResult<bool>.Forbidden();
        if (mediaList.IsFeatured) return ServiceResult<bool>.Forbidden();

        // Implement the Change:
        _context.MediaLists.Remove(mediaList);
        await _context.SaveChangesAsync();  // Flush changes

        return ServiceResult<bool>.Ok(true);
    }


    public async Task<ServiceResult<MediaListSummaryDto>> PatchListBasicInfoAsync(int mediaListId, UpdateMediaListNotListContentDto dto, string requesterUserId)
    {

        // Fetch the User and MediaList Object and then Check Permissions:
        var (requesterUser, mediaList, forbidden) = await FetchListWithModifyCheckAsync(mediaListId, requesterUserId);

        if (mediaList == null) return ServiceResult<MediaListSummaryDto>.NotFound();
        if (requesterUser == null) return ServiceResult<MediaListSummaryDto>.Unauthorized();
        if (forbidden) return ServiceResult<MediaListSummaryDto>.Forbidden();


        // Patch the Changes
        if (dto.Name != null) mediaList.Name = dto.Name;
        if (dto.Description != null) mediaList.Description = dto.Description;
        if (dto.VisibilityStatus != null)
        {
            if (dto.VisibilityStatus == VisibilityStatus.Shared)
                return ServiceResult<MediaListSummaryDto>.NotImplemented("Sharing is not implemented yet.");
            mediaList.VisibilityStatus = dto.VisibilityStatus.Value;
        }

        await _context.SaveChangesAsync();  // Flush changes

        int count = await GetItemCountAsync(mediaListId);
        return ServiceResult<MediaListSummaryDto>.Ok(ToSummaryDto(mediaList, count));
    }


    public async Task<ServiceResult<MediaListSummaryDto>> AddMediaApiRefToListAsync(int mediaListId, int mediaApiRefId, AddMediaApiRefToMediaListDto dto, string requesterUserId)
    {

        //// Fetch the User and MediaList Object and then Check Permissions:
        var (requesterUser, mediaList, forbidden) = await FetchListWithModifyCheckAsync(mediaListId, requesterUserId);

        if (mediaList == null) return ServiceResult<MediaListSummaryDto>.NotFound();
        if (requesterUser == null) return ServiceResult<MediaListSummaryDto>.Unauthorized();
        if (forbidden) return ServiceResult<MediaListSummaryDto>.Forbidden();


        //// Get MediaApiRef
        var targetMediaApiRef = await _context.MediaApiRefs.FindAsync(mediaApiRefId);
        if (targetMediaApiRef == null) return ServiceResult<MediaListSummaryDto>.NotFound("Media API ref not found.");

        bool alreadyInList = await _context.LinkMediaApiRefToMediaListTable
            .AnyAsync(l => l.HostListId == mediaListId && l.MediaApiRefId == mediaApiRefId);

        if (alreadyInList)
            return ServiceResult<MediaListSummaryDto>.Conflict("This item is already inside this list.");


        //// If target is a status list, auto-remove the item from any other status list the owner has
        if (mediaList.IsDefault && _mutuallyExclusiveListNames.Contains(mediaList.Name))
        {
            var otherStatusListIds = await _context.MediaLists
                .Where(l => l.SubmittedById == mediaList.SubmittedById
                         && l.IsDefault
                         && l.Id != mediaListId
                         && _mutuallyExclusiveListNames.Contains(l.Name))
                .Select(l => l.Id)
                .ToListAsync();

            var staleLinks = await _context.LinkMediaApiRefToMediaListTable
                .Where(l => otherStatusListIds.Contains(l.HostListId) && l.MediaApiRefId == mediaApiRefId)
                .ToListAsync();

            foreach (var staleLink in staleLinks)
            {
                await ShiftPositionsAsync(staleLink.Position + 1, staleLink.HostListId, isAdding: false);
                _context.LinkMediaApiRefToMediaListTable.Remove(staleLink);
            }
        }


        //// Move existing items in the list to make room for the to-be-added MediaApiRef

        // Note: I am explicitly labeling isAdding here to make it more obvious what that boolean value is for.
        int position = await ClampPositionAsync(mediaListId, dto.Position, isAdding: true);

        await ShiftPositionsAsync(position, mediaListId, isAdding: true);


        //// Add the MediaApiRef to the MediaList
        _context.LinkMediaApiRefToMediaListTable.Add(new LinkMediaApiRefToMediaList
        {
            HostListId = mediaListId,
            MediaApiRefId = mediaApiRefId,
            Position = position
        });

        await _context.SaveChangesAsync();  // Flush the changes

        int count = await GetItemCountAsync(mediaListId);
        return ServiceResult<MediaListSummaryDto>.Ok(ToSummaryDto(mediaList, count));
    }


    public async Task<ServiceResult<MediaListSummaryDto>> RemoveMediaApiRefFromListAsync(int mediaListId, int mediaApiRefId, string requesterUserId)
    {
        // Fetch the User and MediaList Object and then Check Permissions:
        var (requesterUser, mediaList, forbidden) = await FetchListWithModifyCheckAsync(mediaListId, requesterUserId);

        if (mediaList == null) return ServiceResult<MediaListSummaryDto>.NotFound();
        if (requesterUser == null) return ServiceResult<MediaListSummaryDto>.Unauthorized();
        if (forbidden) return ServiceResult<MediaListSummaryDto>.Forbidden();


        // Get MediaApiRef
        var targetMediaApiRef = await _context.MediaApiRefs.FindAsync(mediaApiRefId);
        if (targetMediaApiRef == null) return ServiceResult<MediaListSummaryDto>.NotFound("Media API ref not found.");


        // Get Link between MediaApiRef and MediaList
        var linkRow = await _context.LinkMediaApiRefToMediaListTable
            .Where(l => l.HostListId == mediaListId && l.MediaApiRefId == mediaApiRefId)
            .FirstOrDefaultAsync();
        if (linkRow == null)
            return ServiceResult<MediaListSummaryDto>.NotFound("This item is not in this list.");


        await ShiftPositionsAsync(linkRow.Position + 1, mediaListId, isAdding: false);
        _context.LinkMediaApiRefToMediaListTable.Remove(linkRow);
        await _context.SaveChangesAsync();  // Flush changes

        int count = await GetItemCountAsync(mediaListId);
        return ServiceResult<MediaListSummaryDto>.Ok(ToSummaryDto(mediaList, count));
    }


    public async Task<ServiceResult<MediaListSummaryDto>> MoveMediaApiRefWithinMediaListAsync(int mediaListId, int mediaApiRefId, MoveMediaApiRefWithinMediaListDto dto, string requesterUserId)
    {

        // Fetch the User and MediaList Object and then Check Permissions:
        var (requesterUser, mediaList, forbidden) = await FetchListWithModifyCheckAsync(mediaListId, requesterUserId);

        if (mediaList == null) return ServiceResult<MediaListSummaryDto>.NotFound();
        if (requesterUser == null) return ServiceResult<MediaListSummaryDto>.Unauthorized();
        if (forbidden) return ServiceResult<MediaListSummaryDto>.Forbidden();


        // Get MediaApiRef
        var targetMediaApiRef = await _context.MediaApiRefs.FindAsync(mediaApiRefId);
        if (targetMediaApiRef == null) return ServiceResult<MediaListSummaryDto>.NotFound("Media API ref not found.");


        // Get Link between MediaApiRef and MediaList
        var linkRow = await _context.LinkMediaApiRefToMediaListTable
            .Where(l => l.HostListId == mediaListId && l.MediaApiRefId == mediaApiRefId)
            .FirstOrDefaultAsync();
        if (linkRow == null)
            return ServiceResult<MediaListSummaryDto>.NotFound("This item is not in this list.");



        int oldPosition = linkRow.Position;
        int destinationPosition = await ClampPositionAsync(mediaListId, dto.NewPosition, isAdding: false);

        // Do not do the operation if the mediaApiRef
        // is already in the correct spot
        if (destinationPosition == oldPosition)
        {
            int count = await GetItemCountAsync(mediaListId);
            return ServiceResult<MediaListSummaryDto>.Ok(ToSummaryDto(mediaList, count));
        }


        // Do the Move:
        linkRow.Position = destinationPosition;

        List<LinkMediaApiRefToMediaList> rowsToShift;
        if (destinationPosition > oldPosition)
        {
            // Moving towards the back: shift items between old and new positions forward
            rowsToShift = await _context.LinkMediaApiRefToMediaListTable
                .Where(l => l.HostListId == mediaListId
                         && l.Position > oldPosition
                         && l.Position <= destinationPosition)
                .ToListAsync();

            foreach (var row in rowsToShift) row.Position -= 1;
        } else
        {
            // Moving towards the front: shift items between new and old positions back
            rowsToShift = await _context.LinkMediaApiRefToMediaListTable
                .Where(l => l.HostListId == mediaListId
                         && l.Position >= destinationPosition
                         && l.Position < oldPosition)
                .ToListAsync();

            foreach (var row in rowsToShift) row.Position += 1;
        }

        await _context.SaveChangesAsync();  // Flush changes

        int finalCount = await GetItemCountAsync(mediaListId);
        return ServiceResult<MediaListSummaryDto>.Ok(ToSummaryDto(mediaList, finalCount));
    }

    public async Task<ServiceResult<bool>> ReorderItemsAsync(int mediaListId, List<int> orderedItemIds, string requesterUserId)
    {
        var (requesterUser, mediaList, forbidden) = await FetchListWithModifyCheckAsync(mediaListId, requesterUserId);

        if (mediaList == null) return ServiceResult<bool>.NotFound();
        if (requesterUser == null) return ServiceResult<bool>.Unauthorized();
        if (forbidden) return ServiceResult<bool>.Forbidden();

        var linkRows = await _context.LinkMediaApiRefToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .ToListAsync();



        // Verify all submitted MediaApiRef Ids actually belong to this list

        // This line gets only the MediaApiRefIds (not the actual MediaApiRef objects) and puts them into a HashSet.
        var listItemIds = linkRows.Select(l => l.MediaApiRefId).ToHashSet();
        if (orderedItemIds.Count != listItemIds.Count || !orderedItemIds.All(listItemIds.Contains))
            return ServiceResult<bool>.BadRequest("The submitted item IDs do not match the list's current contents.");

        // Assign positions based on the submitted order
        var linkByItemId = linkRows.ToDictionary(l => l.MediaApiRefId);
        for (int i = 0; i < orderedItemIds.Count; i++)
            linkByItemId[orderedItemIds[i]].Position = i;

        await _context.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }



    // ownedByUserId = null              : all visible lists (owner || admin || public) — mirrors CanSeeList()
    // ownedByUserId = requesterUserId   : own lists only
    // ownedByUserId = someOtherUserId   : that user's public lists (or all of their lists if requester is admin)
    //
    // Note: visibility bypass is admin-only (not moderator) — matches CanSeeList() which uses IsAdministrator, not IsModeratorOrAdmin.
    public async Task<ServiceResult<List<MediaListSummaryDto>>> SearchListsAsync(string query, int limit, string? ownedByUserId, string requesterUserId)
    {
        if (query.Length < AppConstants.SearchMinQueryLength)
            return ServiceResult<List<MediaListSummaryDto>>.BadRequest("Search query must be at least 2 characters.");

        limit = Math.Min(limit, AppConstants.SearchResultMaxLimit);  // Server-side cap — ignore whatever limit the client sent

        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<List<MediaListSummaryDto>>.Unauthorized();

        // Precompute booleans so EF Core can inline them as SQL constants rather than loading AppUser per-row
        bool isAdmin = PermissionHelper.IsAdministrator(requesterUser);
        bool canModify = PermissionHelper.IsModeratorOrAdmin(requesterUser);  // Used for CanEdit projection

        var queryLower = query.ToLower();
        IQueryable<MediaList> baseQuery = _context.MediaLists;

        if (ownedByUserId == null)
        {
            // All visible: owner || admin || public (mirrors CanSeeList)
            baseQuery = baseQuery.Where(l =>
                l.SubmittedById == requesterUserId
                || isAdmin
                || l.VisibilityStatus == VisibilityStatus.Public);
        }
        else if (ownedByUserId == requesterUserId)
        {
            // Own lists only — CanEdit is always true since the requester owns every result
            baseQuery = baseQuery.Where(l => l.SubmittedById == requesterUserId);
        }
        else
        {
            // Another user's lists: only their public lists (or all of their lists if requester is admin)
            baseQuery = baseQuery.Where(l =>
                l.SubmittedById == ownedByUserId
                && (l.VisibilityStatus == VisibilityStatus.Public || isAdmin));
        }

        var results = await baseQuery
            .Where(l => l.Name.ToLower().Contains(queryLower))
            .OrderBy(l => l.Name)
            .Take(limit)
            .Select(l => new MediaListSummaryDto
            {
                Id = l.Id,
                Name = l.Name,
                SubmittedById = l.SubmittedById,
                Description = l.Description,
                VisibilityStatus = l.VisibilityStatus,
                ItemCount = l.ItemLinks.Count,
                CanEdit = l.SubmittedById == requesterUserId || canModify,
                IsDefault = l.IsDefault,
                IsFeatured = l.IsFeatured
            })
            .ToListAsync();

        return ServiceResult<List<MediaListSummaryDto>>.Ok(results);
    }


    public async Task<ServiceResult<List<MediaListDetailDto>>> GetFeaturedListsAsync()
    {
        var lists = await _context.MediaLists
            .Where(l => l.IsFeatured)
            .OrderBy(l => l.Id)
            .Include(l => l.ItemLinks)
                .ThenInclude(link => link.MediaApiRef)
                    .ThenInclude(r => r.ApiSource)
            .ToListAsync();

        var dtos = lists.Select(l => new MediaListDetailDto
        {
            Id = l.Id,
            Name = l.Name,
            SubmittedById = l.SubmittedById,
            Description = l.Description,
            VisibilityStatus = l.VisibilityStatus,
            CanEdit = false,
            IsDefault = l.IsDefault,
            IsFeatured = true,
            ListContent = l.ItemLinks
                .OrderBy(link => link.Position)
                .Select(link => new MediaApiRefSummaryDto
                {
                    Id = link.MediaApiRef.Id,
                    Name = link.MediaApiRef.Name,
                    MediaTypeId = link.MediaApiRef.MediaTypeId,
                    CreatorName = link.MediaApiRef.CreatorName,
                    PublishedDate = link.MediaApiRef.PublishedDate,
                    ExternalId = link.MediaApiRef.ExternalId,
                    ApiSourceName = link.MediaApiRef.ApiSource.ApiName,
                    ThumbnailUrl = link.MediaApiRef.ThumbnailUrl
                })
                .ToList()
        }).ToList();

        return ServiceResult<List<MediaListDetailDto>>.Ok(dtos);
    }


    public async Task<ServiceResult<MediaListSummaryDto>> CreateFeaturedListAsync(CreateMediaListDto dto, string requesterUserId)
    {
        var requester = await _context.Users.FindAsync(requesterUserId);
        if (requester == null) return ServiceResult<MediaListSummaryDto>.Unauthorized();
        if (!PermissionHelper.IsAdministrator(requester)) return ServiceResult<MediaListSummaryDto>.Forbidden();

        var list = new MediaList
        {
            Name = dto.Name,
            Description = dto.Description,
            IsFeatured = true,
            SubmittedById = null,
            VisibilityStatus = VisibilityStatus.Public,
            DateSubmitted = DateTime.UtcNow
        };

        _context.MediaLists.Add(list);
        await _context.SaveChangesAsync();

        return ServiceResult<MediaListSummaryDto>.Ok(ToSummaryDto(list, 0));
    }


}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;  // This import is needed for the lookups into the Database.  For example: _context.MediaItems.Where(i => is.IsApproved).ToListAsync();

public class MediaItemService : IMediaItemService
{
    private readonly AppDbContext _context;


    private readonly int _randomAmountHardLimit;


    public MediaItemService(AppDbContext context, IOptions<MediaItemSettings> settings)
    {
        _context = context;
        _randomAmountHardLimit = settings.Value.RandomAmountHardLimit;
    }


    public async Task<ServiceResult<MediaItemDetailDto>> GetMediaItemDetailAsync(int mediaItemId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaItemDetailDto>.Unauthorized();

        var mediaItemObject = await _context.MediaItems.FindAsync(mediaItemId);
        if (mediaItemObject == null) return ServiceResult<MediaItemDetailDto>.NotFound();

        //TODO: Uncomment this once I implement/create the approval/submission process
        // if (!mediaItemObject.IsApproved && !PermissionHelper.CanSeeUnApprovedMediaItem(requesterUser, mediaItemObject))
        //     return ServiceResult<MediaItemDetailDto>.Forbidden();
        
        return ServiceResult<MediaItemDetailDto>.Ok(new MediaItemDetailDto
        {
            Id = mediaItemObject.Id,
            Name = mediaItemObject.Name,
            SubmittedById = mediaItemObject.SubmittedById,
            Description = mediaItemObject.Description,
            MediaTypeId = mediaItemObject.MediaTypeId,
            IsApproved = mediaItemObject.IsApproved,
            PublishedDateTime = mediaItemObject.PublishedDateTime,
            DateSubmitted = mediaItemObject.DateSubmitted,
            CanEdit = PermissionHelper.CanModifyOrDeleteItem(requesterUser, mediaItemObject)
        });
    }


    public async Task<ServiceResult<List<MediaItemSummaryDto>>> GetAllApprovedMediaItemsForAdminAsync(string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<List<MediaItemSummaryDto>>.Unauthorized();

        if (!PermissionHelper.IsAdministrator(requesterUser))
            return ServiceResult<List<MediaItemSummaryDto>>.Forbidden();
        
        var mediaItems = await _context.MediaItems
            .Where(i => i.IsApproved)
            .Select(i => new MediaItemSummaryDto
            {
                Id = i.Id,
                Name = i.Name,
                MediaTypeId = i.MediaTypeId
            })
            .ToListAsync();
        
        return ServiceResult<List<MediaItemSummaryDto>>.Ok(mediaItems);
    }


    public async Task<ServiceResult<List<MediaItemSummaryDto>>> GetRandomAsync(int amount, string requesterUserId)
    {
        if (amount <= 0 || amount > _randomAmountHardLimit)
            return ServiceResult<List<MediaItemSummaryDto>>.BadRequest($"Amount must be between 1 and {_randomAmountHardLimit}.");
        
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<List<MediaItemSummaryDto>>.Unauthorized();

        var availableCount = await _context.MediaItems.CountAsync(i => i.IsApproved);
        if (amount > availableCount)
            return ServiceResult<List<MediaItemSummaryDto>>.BadRequest($"Requested {amount} items, but only {availableCount} approved items exist.");

        var mediaItems = await _context.MediaItems
            .Where(i => i.IsApproved)  // Only choose from already-approved MediaItem objects
            .Select(i => new MediaItemSummaryDto
            {
                Id = i.Id,
                Name = i.Name,
                MediaTypeId = i.MediaTypeId
            })
            .OrderBy(_ => EF.Functions.Random())
            .Take(amount)  // Only take X number of MediaItems
            .ToListAsync();

        return ServiceResult<List<MediaItemSummaryDto>>.Ok(mediaItems);

    }

    public async Task<ServiceResult<MediaItem>> CreateMediaItemAsync(CreateMediaItemDto dto, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaItem>.Unauthorized();

        var newItem = new MediaItem
        {
            Name = dto.Name,
            MediaTypeId = dto.MediaTypeId,
            Description = dto.Description,
            IsApproved = false,  // By default, IsApproved will be set to false
            PublishedDateTime = dto.PublishedDateTime,
            SubmittedById = requesterUserId,
            DateSubmitted = DateTime.UtcNow
        };

        _context.MediaItems.Add(newItem);

        // Flush the changes
        await _context.SaveChangesAsync();

        return ServiceResult<MediaItem>.Ok(newItem);
    }

    public async Task<ServiceResult<bool>> DeleteMediaItemAsync(int mediaItemId, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<bool>.Unauthorized();

        var mediaItemObject = await _context.MediaItems.FindAsync(mediaItemId);
        if (mediaItemObject == null) return ServiceResult<bool>.NotFound();

        if (!PermissionHelper.CanModifyOrDeleteItem(requesterUser, mediaItemObject))
            return ServiceResult<bool>.Forbidden();
        
        _context.MediaItems.Remove(mediaItemObject);
        await _context.SaveChangesAsync();  // Flush changes

        return ServiceResult<bool>.Ok(true);

    }


    // Patching Non-Linked (aka Basic) Items
    public async Task<ServiceResult<MediaItemDetailDto>> PatchMediaItemBasicInfoAsync(int mediaItemId, UpdateMediaItemBasicInfoDto dto, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<MediaItemDetailDto>.Unauthorized();

        var mediaItemObject = await _context.MediaItems.FindAsync(mediaItemId);
        if (mediaItemObject == null) return ServiceResult<MediaItemDetailDto>.NotFound();

        if (!PermissionHelper.CanModifyOrDeleteItem(requesterUser, mediaItemObject))
            return ServiceResult<MediaItemDetailDto>.Forbidden();


        // Only overwrite the fields that were filled in by the user aka not null in the DTO
        if (dto.Name != null) mediaItemObject.Name = dto.Name;
        if (dto.MediaTypeId != null) mediaItemObject.MediaTypeId = dto.MediaTypeId.Value;
        if (dto.Description != null) mediaItemObject.Description = dto.Description;
        if (dto.PublishedDateTime != null) mediaItemObject.PublishedDateTime = dto.PublishedDateTime;

        await _context.SaveChangesAsync();  // Flush changes

        return ServiceResult<MediaItemDetailDto>.Ok(new MediaItemDetailDto
        {
           Id = mediaItemObject.Id,
           Name = mediaItemObject.Name,
           SubmittedById = mediaItemObject.SubmittedById,
           Description = mediaItemObject.Description,
           MediaTypeId = mediaItemObject.MediaTypeId,
           IsApproved = mediaItemObject.IsApproved,
           PublishedDateTime = mediaItemObject.PublishedDateTime,
           DateSubmitted = mediaItemObject.DateSubmitted,
           CanEdit = PermissionHelper.CanModifyOrDeleteItem(requesterUser, mediaItemObject)
        });

    }










}
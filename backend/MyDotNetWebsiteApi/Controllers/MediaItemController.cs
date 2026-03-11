using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[ApiController]
[Route("api/[controller]")]
[Authorize]  // Means this using this controller needs a JwtToken
public class MediaItemController : ControllerBase
{

    // Passing in AppDbContext 
    private readonly AppDbContext _context;

    public MediaItemController(AppDbContext context)
    {
        _context = context;
    }





    // Functions and Endpoints


    // Helper Method:

    // NOTE: This is a copy of my "CanModifyDeleteMediaList" function from my MediaListController.cs file, vut for MediaItem objects
    private bool CanModifyDeleteMediaItem(AppUser requesterUser, MediaItem targetedMediaItem)
    {

        if (targetedMediaItem == null)
        {
            return false;
        }

        // if requesterUser is not found in our Users table.
        if (requesterUser == null)
        {
            return false;
        }


        // Permissions to Check
        // Only the user who created the MediaItem (aka its owner)
        // and special users (Administrator, Moderator)
        // have permission to delete the MediaItem
        // (Who the MediaItem might be shared with is NOT relevant for deleting MediaItems)

        bool isOwner = (targetedMediaItem.SubmittedById == requesterUser.Id);
        bool isSpecialUserWhoCanModifyDelete = (requesterUser.RoleLevel == UserRoleLevel.Moderator
                                            || requesterUser.RoleLevel == UserRoleLevel.Administrator);

        // If the requesterUser is the owner (aka creator) of the MediaItem
        // and/or is a user with special permissions (Moderator or Administrator),
        // he can modify/delete the MediaItem
        return (isOwner || isSpecialUserWhoCanModifyDelete);
    }

    // NOTE: This is a copy of my "fetchUserMediaList_andCheckPermissions" method from my MediaListController.cs file, but for MediaItem objects.
    private async Task<(AppUser? requesterUser, MediaItem? targetedMediaItem, IActionResult?)> FetchUserMediaItem_andCheckPermissions(int targetedMediaItemId)
    {
        IActionResult? httpError = null;


        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        

        //// Get Current User's Permission Level:
        
        // Get User and MediaList items
        // Note: .FindAsync is searching via Primary Key (aka Id for those tables)
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        var targetedMediaItem = await _context.MediaItems.FindAsync(targetedMediaItemId);

        // if targetedMediaList is not found in our MediaLists table.
        if (targetedMediaItem == null)
        {
            httpError = NotFound();
        }

        // if requesterUser is not found in our Users table.
        else if (requesterUser == null)
        {
            httpError = Unauthorized();
        }


        // If (NOT can modifiy) AKA If cannot modify the MediaList
        else if (!CanModifyDeleteMediaItem(requesterUser, targetedMediaItem))
        {
            httpError = Forbid();
        }

        return (requesterUser, targetedMediaItem, httpError);
    }


    // TODO: Implement an Approval/Submission Process
    private bool CanSeeNotApprovedMediaItem(AppUser requesterUser, MediaItem targetedMediaItem)
    {

        if (targetedMediaItem == null)
        {
            return false;
        }

        // if requesterUser is not found in our Users table.
        if (requesterUser == null)
        {
            return false;
        }

        // Permissions
        bool isOwner = (targetedMediaItem.SubmittedById == requesterUser.Id);
        bool isSpecialUserWhoCanDelete = (requesterUser.RoleLevel == UserRoleLevel.Moderator
                                            || requesterUser.RoleLevel == UserRoleLevel.Administrator);

        // If the requesterUser is the owner (aka creator) of the MediaItem
        // and/or is a user with special permissions (Moderator or Administrator),
        // he can view the not (yet) approved MediaItem
        return (isOwner || isSpecialUserWhoCanDelete);
    }


    [HttpGet("{mediaItemId}")]
    public async Task<IActionResult> GetMediaItemDetail(int mediaItemId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        
        // If user is not found in the Users table.
        if (requesterUser == null)
        {
            return Unauthorized();
        }

        
        var targetedMediaItem = await _context.MediaItems
            .Where(l => l.Id == mediaItemId)
            .Select(l => new MediaItemDetailDto
            {
                // Instead of returning many MediaList Items,
                //   pushing each MediaList's info
                //    into its own DTO object
                Id = l.Id,
                Name = l.Name,
                SubmittedById = l.SubmittedById,
                Description = l.Description,
                MediaTypeId = l.MediaTypeId,
                IsApproved = l.IsApproved,
                PublishedDateTime = l.PublishedDateTime,
                DateSubmitted = l.DateSubmitted,
            })
            .FirstOrDefaultAsync();
        
        // if targetedMediaList is not found in our MediaLists table.
        if (targetedMediaItem == null)
        {
            return NotFound();
        }

        // Permissions
        // UNCOMMENT THIS
        // else if (!CanSeeNotApprovedMediaItem(requesterUser, targetedMediaItem))
        // {
        //     return Forbid();
        // }

        return Ok(targetedMediaItem);
    }


    //TODO: Getting all MediaItems ever is not a great long-term endpoint for this specific website
    // since this is about exporting all details for all MediaItems
    [HttpGet("getAllPublicMediaItems")]
    public async Task<IActionResult> getAllPublicMediaItems(int mediaItemId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        
        // If user is not found in the Users table.
        if (requesterUser == null)
        {
            return Unauthorized();
        }

        // Check Permissions
        // Only Moderators and Administrators can use this method
        if (!(requesterUser.RoleLevel == UserRoleLevel.Moderator || requesterUser.RoleLevel == UserRoleLevel.Administrator))
        {
            return Forbid();
        }

        var mediaItemObjects = await _context.MediaItems
            .Where(l => l.IsApproved == true)
            .Select(l => new MediaItemSummaryDto
            {
                // Instead of returning many MediaList Items,
                //   pushing each MediaList's info
                //    into its own DTO object
                Id = l.Id,
                Name = l.Name,
                MediaTypeId = l.MediaTypeId 
            })
            .ToListAsync();

        return Ok(mediaItemObjects);
    }

    // Get X random approved MediaItems
    [HttpGet("getRandom/{amount}")]
    public async Task<IActionResult> GetRandomAmount(int amount)
    {
        // Amount Limits
        if (amount <= 0 || amount > 5)
            return BadRequest("Amount must be between 1 and 5.");

        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        
        // If user is not found in the Users table.
        if (requesterUser == null)
        {
            return Unauthorized();
        }

        // No Permission Check for this.

        var mediaItemObjects_random = await _context.MediaItems
            .Where(l => l.IsApproved == true)
            .Select(l => new MediaItemSummaryDto
            {
                // Instead of returning many MediaList Items,
                //   pushing each MediaList's info
                //    into its own DTO object
                Id = l.Id,
                Name = l.Name,
                MediaTypeId = l.MediaTypeId 
            })
            .OrderBy(XmlConfigurationExtensions => EF.Functions.Random())
            .Take(amount)
            .ToListAsync();
        

        return Ok(mediaItemObjects_random);
    }




    





    [HttpPost("create")]
    public async Task<IActionResult> CreateMediaItem([FromBody] CreateMediaItemDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        
        // If user is not found in the Users table.
        if (requesterUser == null)
        {
            return Unauthorized();
        }


        var newMediaItem = new MediaItem
        {
            Name = dto.Name,
            MediaTypeId = dto.MediaTypeId,
            Description = dto.Description,
            IsApproved = false,
            PublishedDateTime = dto.PublishedDateTime,

            SubmittedById = requesterUserId,
            DateSubmitted = DateTime.UtcNow
        };

        // TODO: Implement into the MediaItem creation process:
        // -- Creators
        // -- Genres


        // Add to Database:
        _context.MediaItems.Add(newMediaItem);

        // Flush changes to database
        await _context.SaveChangesAsync();

        return Ok(newMediaItem);

    }



    // UNCOMMENT THIS
    // [HttpPatch("{mediaItemId}")]
    // public async Task<IActionResult> PatchMediaItemBasicInfo(int mediaItemId, [FromBody] UpdateMediaItemNotLinksDto dto)
    // {
        
    //     // The _ for the first parameter is "discarding" the first value, since we do not need that value (RequestUser) for this method
    //     (_, MediaItem? targetedMediaItem, IActionResult? error) = await FetchUserMediaItem_andCheckPermissions(mediaItemId);
    //     if (error != null) return error;
        


    //     // I'm adding ! to the end of targetedMediaList to soothe the code to tell it
    //         // that I already checked that at this point in the code,
    //         // targetedMediaList is not null
    //         // since the method that checked it (fetchUserMediaList_andCheckPermissions)
    //         // already ran, and would have returned an Error code in the code block after it
    //         // if it was null right after that method was run (at "if (error != null) return error;")

    //     // Make the Changes to the MediaList object
    //     if (dto.Name != null)
    //         targetedMediaItem!.Name = dto.Name;
    //     if (dto.Description != null)
    //         targetedMediaItem!.Description = dto.Description;
    //     if (dto.PublishedDateTime != null)
    //         targetedMediaItem!.PublishedDateTime = dto.PublishedDateTime;
    //     if (dto.MediaTypeId != null)
    //         targetedMediaItem!.MediaTypeId = dto.MediaTypeId;

    //     // Flush changes to database
    //     await _context.SaveChangesAsync();


    //     // Return the updated MediaItem
         
    //     var targetedMediaItem_updated = await _context.MediaItems
    //         .Where(l => l.Id == mediaItemId)
    //         .Select(l => new MediaItemDetailDto
    //         {
    //             // Instead of returning many MediaList Items,
    //             //   pushing each MediaList's info
    //             //    into its own DTO object
    //             Id = l.Id,
    //             Name = l.Name,
    //             SubmittedById = l.SubmittedById,
    //             Description = l.Description,
    //             MediaTypeId = l.MediaTypeId,
    //             IsApproved = l.IsApproved,
    //             PublishedDateTime = l.PublishedDateTime,
    //             DateSubmitted = l.DateSubmitted,
    //         })
    //         .FirstOrDefaultAsync();
    
    //     return Ok(targetedMediaItem_updated);
    // }

        
    [HttpDelete("{mediaItemId}")]
    public async Task<IActionResult> DeleteMediaItem(int mediaItemId)
    {
        // The _ for the first parameter is "discarding" the first value, since we do not need that value (RequestUser) for this method
        (AppUser requesterUser, MediaItem? targetedMediaItem, IActionResult? error) = await FetchUserMediaItem_andCheckPermissions(mediaItemId);
        if (error != null) return error;


        // If the requesterUser is not an Administrator, Forbid.
        // AKA Only administrators can delete MediaItems.
        if (!(requesterUser.RoleLevel == UserRoleLevel.Administrator))
            return Forbid();


        // Delete from Database:
        // I'm adding ! because I'm telling C# that targetedMediaList should NOT be null by the time it reaches this point
        // (since it is set to a value in that fetchUserMediaList_andCheckPermissions method)
        _context.MediaItems.Remove(targetedMediaItem!);

        // Flush changes to database
        await _context.SaveChangesAsync();

        return Ok();
    }

    // TODO:
    // Edit MediaItem Links

    // For Submitting a Request:
    // -- Could Create all types of Objects, including MediaItem
    // -- There will be a queue that Moderators/Administrators can see and approve or deny.
    // EditHistory: Who edited what and where. To track if someone, even a moderator sabotages things.
}
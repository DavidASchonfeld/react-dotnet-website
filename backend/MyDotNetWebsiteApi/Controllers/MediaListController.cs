


using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]  // Means this using this controller needs a JwtToken
public class MediaListController : ControllerBase
{

    // Passing in AppDbContext 
    private readonly AppDbContext _context;

    public MediaListController(AppDbContext context)
    {
        _context = context;
    }


    [HttpGet("GetMyLists")]  // Occurs with route /GetMyLists (with GET request)
    public async Task<IActionResult> GetMyLists()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var mediaListObjects = await _context.MediaLists
            .Where(l => l.SubmittedById == userId)
            .Select(l => new MediaListSummaryDto
            {
                // Instead of returning many MediaList Items,
                //   pushing each MediaList's info
                //    into its own DTO object
                Id = l.Id,
                Name = l.Name,
                SubmittedById = l.SubmittedById,
                Description = l.Description,
                VisibilityStatus = l.VisibilityStatus,
                ItemCount = l.ItemLinks.Count   
            })
            .ToListAsync();

        return Ok(mediaListObjects);
    }


    // CreateList, when we create, we create an empty list. In UpdateList, we'll add MediaItems to the list
    [HttpPost("CreateList")]  // Occurs with route /GetMyLists (with GET request)
    public async Task<IActionResult> CreateList([FromBody] CreateMediaListDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var newMediaList = new MediaList
        {
            Name = dto.Name,
            Description = dto.Description,
            VisibilityStatus = dto.VisibilityStatus,
            SubmittedById = userId,
            DateSubmitted = DateTime.UtcNow
        };

        // Add to Database:
        _context.MediaLists.Add(newMediaList);

        // Flush changes to database
        await _context.SaveChangesAsync();

        return Ok(new MediaListSummaryDto
        {
            Id = newMediaList.Id,
            Name = newMediaList.Name,
            Description = newMediaList.Description,
            VisibilityStatus = newMediaList.VisibilityStatus,
            ItemCount = 0  // It == 0 since for this createList method, we create empty lsits, and in another method, we can add to it
        });

    }

    // Private: because this is NOT a route to be used. It is an internal method here in MediaListController to decide permissions for modifying a MediaList
    private bool CanModifyDeleteMediaList(AppUser requesterUser, MediaList targetedMediaList)
    {

        if (targetedMediaList == null)
        {
            return false;
        }

        // if requesterUser is not found in our Users table.
        if (requesterUser == null)
        {
            return false;
        }


        // Permissions to Check
        // Only the user who created the MediaList (aka its owner)
        // and special users (Administrator, Moderator)
        // have permission to delete the MediaList
        // (Who the MediaList might be shared with is NOT relevant for deleting MediaLists)

        bool isOwner = (targetedMediaList.SubmittedById == requesterUser.Id);
        bool isSpecialUserWhoCanDelete = (requesterUser.RoleLevel == UserRoleLevel.Moderator
                                            || requesterUser.RoleLevel == UserRoleLevel.Administrator);

        // If the requesterUser is the owner (aka creator) of the MediaList
        // and/or is a user with special permissions (Moderator or Administrator),
        // he can modify/delete the MediaList
        return (isOwner || isSpecialUserWhoCanDelete);
    }
    

    // Helper Method
    // Because this logic is used over and over in many of these methods, I am refactoring my code
    // to put all of this code into 1 method
    // To return async, I need to wrap the return type in Task<>
    private async Task<(AppUser? requesterUser, MediaList? targetedMediaList, IActionResult?)> fetchUserMediaList_andCheckPermissions(int targetedMediaListId)
    {
        IActionResult? httpError = null;


        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        

        //// Get Current User's Permission Level:
        
        // Get User and MediaList items
        // Note: .FindAsync is searching via Primary Key (aka Id for those tables)
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        var targetedMediaList = await _context.MediaLists.FindAsync(targetedMediaListId);

        // if targetedMediaList is not found in our MediaLists table.
        if (targetedMediaList == null)
        {
            httpError = NotFound();
        }

        // if requesterUser is not found in our Users table.
        else if (requesterUser == null)
        {
            httpError = Unauthorized();
        }


        // If (NOT can modifiy) AKA If cannot modify the MediaList
        else if (!CanModifyDeleteMediaList(requesterUser, targetedMediaList))
        {
            httpError = Forbid();
        }

        return (requesterUser, targetedMediaList, httpError);
    }


    
    [HttpDelete("{mediaListId}")]
    public async Task<IActionResult> DeleteList(int mediaListId)
    {

        (AppUser? requesterUser, MediaList? targetedMediaList, IActionResult? error) = await fetchUserMediaList_andCheckPermissions(mediaListId);
        if (error != null) return error;

        // Delete from Database:
        // I'm adding ! because I'm telling C# that targetedMediaList should NOT be null by the time it reaches this point
        // (since it is set to a value in that fetchUserMediaList_andCheckPermissions method)
        _context.MediaLists.Remove(targetedMediaList!);

        // Flush changes to database
        await _context.SaveChangesAsync();

        return Ok();
    }


    // Update Basic Info on MediaList
    // Update Name, Description, Visibility 
    // Does NOT add/remove MediaItem(s) in MediaList
    [HttpPatch("{mediaListId}")]  // Occurs with route /GetMyLists (with GET request)
    public async Task<IActionResult> PatchListBasicInfo(int mediaListId, [FromBody] UpdateMediaListNotListContentDto dto)
    {

        
        (AppUser? requesterUser, MediaList? targetedMediaList, IActionResult? error) = await fetchUserMediaList_andCheckPermissions(mediaListId);
        if (error != null) return error;
        


        // Make the Changes to the MediaList object
        if (dto.Name != null)
            targetedMediaList.Name = dto.Name;
        if (dto.Description != null)
            targetedMediaList.Description = dto.Description;
        if (dto.VisibilityStatus != null)
        {
            if (dto.VisibilityStatus == VisibilityStatus.Shared)
            {   
                // TODO: Implement Sharing
                return StatusCode(501, "Sharing is not implemented yet.");
            }
            targetedMediaList.VisibilityStatus = dto.VisibilityStatus.Value;
        }


        // Flush changes to database
        await _context.SaveChangesAsync();


        // Getting MediaList's Count:
        // Get Current Count of the MediaList
        var linkRowCount = await _context.LinkMediaItemToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .CountAsync();
        

        return Ok(new MediaListSummaryDto
        {
            Id = targetedMediaList.Id,
            Name = targetedMediaList.Name,
            SubmittedById = targetedMediaList!.SubmittedById,
            Description = targetedMediaList.Description,
            VisibilityStatus = targetedMediaList.VisibilityStatus,
            ItemCount = linkRowCount
        });
    }





    // Helper method, When a MediaItem is added into/remove from the middle of the list, we need to update the positions of the MediaItems behind that MediaItem object.
    // This is called Gapless Ordering. Wheere the positions are 1, 2, 3, etc. with no gaps between them.
    // The Industry Standard, according to my basic searching, is "Sparse Ordering:" Use big numbers like 100, 200, etc.
    //    so if I rearrange or delete an item I don't have to renumber all items in the list every time an object is added or removed.
    // If my website becomes famous/heavily-used where my website needs to be much faster, then I can update my code to use Sparse Ordering instead.
    // I am using Gapless Ordering because I don't need Sparse Ordering right now, and Gapless Ordering is more satisfying.

    private async Task updatePositionsBehindTargetMediaItem(int targetPosition, int mediaListId, bool isAdding)
    {


        // if isAdding, then move each item behind it back 1 position in the list
        // Else (aka is Removing), then move each item behind it up 1 position in the list
        int positionEditNum = isAdding ? 1 : -1 ;

        var linkRowsToUpdate = await _context.LinkMediaItemToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .Where(l => l.Position >= targetPosition)
            .ToListAsync();

        foreach (var linkRow in linkRowsToUpdate){
            linkRow.Position += positionEditNum;
        }
        
        // Don't need to return the linkRowsToUpdate since EF Core tracks the rows
        // And if the method that calls this one decides to implement the changes, it just
        // has to call to flush the changes "await _context.SaveChangesAsync();" and the changes
        // will automatically be pushed into the database


    }




    //// Editing Items in the MediaList Object:
    

    // Add 1 MediaItem to MediaList
    [HttpPost("{mediaListId}/items/{mediaItemId}")]  // /api/medialist/{mediaListId}/items/{mediaItemId}
    public async Task<IActionResult> AddMediaItemToList(int mediaListId, int mediaItemId, [FromBody] AddMediaItemToMediaList dto)
    {
        (AppUser? requesterUser, MediaList? targetedMediaList, IActionResult? error) = await fetchUserMediaList_andCheckPermissions(mediaListId);
        if (error != null) return error;

        // Search for MediaItem Object.
        // If you can't find it, return NotFound()
        var targetedMediaItem = await _context.MediaItems.FindAsync(mediaItemId);

        // if targetedMediaItem is not found in our MediaItems table.
        if (targetedMediaItem == null)
        {
            return NotFound();
        }


        // Fetch MediaList contents for Checking
        var mediaListObjects = await _context.LinkMediaItemToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .ToListAsync();

        // Check for Duplicates:
        // Is the MediaItem the user wants to add already part of the MediaList.
        // Duplicates are prevented from being added. (Perhaps that will change in a future update)
        if (mediaListObjects.Any(l => l.MediaItemId == mediaItemId))  return Conflict("This MediaItem already exists in this MediaList.");
        // The above line does the exact same thing as this:
        // foreach (var eachLinkRow in mediaListObjects){
        //     if (eachLinkRow.MediaItemId == mediaItemId) return Conflict("This MediaItem already exists in this MediaList.");
        // }

        
        // get the MediaList's Count
        int targetedMediaList_Count = mediaListObjects.Count;

        // Create New Row Object for this Newly Added MediaItem:
        
        // ?? is the "Null-Coalescing Operator"
        // Means: var variableToSet = (NullableVariable) ?? (If it is null, use this value instead.)
        var positionToCheck = dto.Position ?? targetedMediaList_Count;
        var positionToUse = positionToCheck;  // As a placeholder.

        if (positionToCheck < 0) positionToUse = 0;  // The 1st position in the list.
        else if (positionToCheck > targetedMediaList_Count) positionToUse = targetedMediaList_Count; // The last position on the list.
        else positionToUse = positionToCheck;

         var newLinkRow = new LinkMediaItemToMediaList
         {
            // .NET's EntityFramework Core automatically adds the objects assocaited with the ids to the Link Row,
            // so I don't have to specifically add them here. Hence, they are commented out here just for explanation purposes.

            HostListId = mediaListId,
            //  HostList = targetedMediaList!,  // In "fetchUserMediaList_andCheckPermissions", we already checked for if it is null
            MediaItemId = mediaItemId,
            //  MediaItem = targetedMediaItem!, // Above, we check if targetedMediaItem is null
            Position = positionToUse
         };


        // Rearrange MediaItems Behind this Newly Added MediaItem
        // aka Make room for the new object.
        // Yes, this method makes potential changes to the positions to the link rows,
        // so we don't need to fetch those new row versions from this method
        await updatePositionsBehindTargetMediaItem(positionToUse, mediaListId, true);


        // Add the new Row Object to Database:
        _context.LinkMediaItemToMediaListTable.Add(newLinkRow);


        // Flush changes to database
        await _context.SaveChangesAsync();

        return Ok(new MediaListSummaryDto
        {
            Id = targetedMediaList!.Id,
            Name = targetedMediaList.Name,
            SubmittedById = targetedMediaList!.SubmittedById,
            Description = targetedMediaList.Description,
            VisibilityStatus = targetedMediaList.VisibilityStatus,
            ItemCount = targetedMediaList_Count + 1
        });
    }





    
    // Remove 1 MediaItem from MediaList
    [HttpDelete("{mediaListId}/items/{mediaItemId}")]  // /api/medialist/{mediaListId}/items/{mediaItemId}
    public async Task<IActionResult> RemoveMediaItemFromList(int mediaListId, int mediaItemId)
    {

        // The _ for the first aparameter is "discarding" the first value, since we do not need that value (RequestUser) for this method
        (_, MediaList? targetedMediaList, IActionResult? error) = await fetchUserMediaList_andCheckPermissions(mediaListId);
        if (error != null) return error;

        // Search for MediaItem Object.
        // If you can't find it, return NotFound()
        var targetedMediaItem = await _context.MediaItems.FindAsync(mediaItemId);

        // Throw an error if the MediaItem does not exist at all
        if (targetedMediaItem == null)
        {
            return NotFound();
        }


        // Fetch MediaList contents for Checking
        var linkRowToRemove = await _context.LinkMediaItemToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .Where(l => l.MediaItemId == mediaItemId)
            .FirstOrDefaultAsync();
        
        // If the requesterUser tries to remove a MediaItem that actually is not in the MediaList,
        // then we will throw a NotFound() error, as described in the line below
        if (linkRowToRemove == null) return NotFound();  

        int positionToUse = linkRowToRemove.Position;
        
        
        // Rearrange MediaItems Behind this Newly Removed MediaItem
        // Move those MediaItems one position upwards to fill the gap.
        // Yes, this method makes potential changes to the positions to the link rows,
        // so we don't need to fetch those new row versions from this method
        // Passing in "positionToUse + 1" because we don't want to move the toRemove MediaItem, just starting with the object(s) after it.
        await updatePositionsBehindTargetMediaItem(positionToUse + 1, mediaListId, false);


        // Delete from Database:
        _context.LinkMediaItemToMediaListTable.Remove(linkRowToRemove);


        // Flush changes to database
        await _context.SaveChangesAsync();

        // Get Current Count (after the Removal) of the MediaList
        var linkRowCount = await _context.LinkMediaItemToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .CountAsync();

        return Ok(new MediaListSummaryDto
        {
            Id = targetedMediaList!.Id,  // In "fetchUserMediaList_andCheckPermissions", we already checked for if it is null
            Name = targetedMediaList.Name,
            SubmittedById = targetedMediaList!.SubmittedById,
            Description = targetedMediaList.Description,
            VisibilityStatus = targetedMediaList.VisibilityStatus,
            ItemCount = linkRowCount
        });
    }




    // Move 1 MediaItem to a Different Position, still in the same MediaList
    [HttpPatch("{mediaListId}/items/{mediaItemId}")]  // /api/medialist/{mediaListId}/items/{mediaItemId}
    public async Task<IActionResult> MoveMediaItemWithinMediaList(int mediaListId, int mediaItemId, [FromBody] MoveMediaItemWithinMediaList dto)
    {

    }




}
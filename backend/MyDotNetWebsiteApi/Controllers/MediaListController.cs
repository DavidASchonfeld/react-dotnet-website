


using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
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
    









    // Functions:
    // Private: because this is NOT a route to be used. It is an internal method here in MediaListController to decide permissions for seeing a Private MediaList
    // Here, I will set it so administrators and the owner can see private lists.
    // And all users can see public lists.
    // TODO: Formalize/neaten policy on administrators being able to see private lists for helpdesk support and safety purposes.
    //       It is optimal that Admin access to private data is audit-logged (who accessed what, and when.)
    // TODO: Implement Sharing Lists.
    private bool CanSeeList(AppUser requesterUser, MediaList targetedMediaList)
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
        // and administrators can see private lists

        bool isOwner = (targetedMediaList.SubmittedById == requesterUser.Id);
        bool isAdministrator = (requesterUser.RoleLevel == UserRoleLevel.Administrator);

        // If the requesterUser is the owner (aka creator) of the MediaList
        // and/or is a user with special permissions (Moderator or Administrator),
        // he can modify/delete the MediaList
        return (isOwner || isAdministrator || targetedMediaList.VisibilityStatus == VisibilityStatus.Public);
    }








    // Endpoints (And More Help Methods):


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

    //Get 1 List in Detail:
    [HttpGet("{mediaListId}")]
    public async Task<IActionResult> GetMediaListDetail(int mediaListId)
    {
        // Permission Checking for Getting Media List Detail
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        var targetedMediaList = await _context.MediaLists.FindAsync(mediaListId);

        // if targetedMediaList is not found in our MediaLists table.
        if (targetedMediaList == null)
        {
            return NotFound();
        }

        // if requesterUser is not found in our Users table.
        else if (requesterUser == null)
        {
            return Unauthorized();
        }

        // If (NOT can modifiy) AKA If cannot modify the MediaList
        else if (!CanSeeList(requesterUser, targetedMediaList))
        {
            return Forbid();
        }


        var mediaList = await _context.MediaLists
            .Include(l => l.ItemLinks)  // Load the link rows
                .ThenInclude(link => link.MediaItem)  // and the MediaItem attached via the link row
                    .ThenInclude(item => item.Type)  // add the MediaType objects connected to the MediaItems
            .FirstOrDefaultAsync(l => l.Id == mediaListId);  // Only returning 1 MediaList
        
        if (mediaList == null) return NotFound();
        
        return Ok(new MediaListDetailDto
        {
            Id = mediaList.Id,
            Name = mediaList.Name,
            Description = mediaList.Description,
            SubmittedById = mediaList.SubmittedById,
            VisibilityStatus = mediaList.VisibilityStatus,
            ListContent = mediaList.ItemLinks
                .OrderBy(link => link.Position)  // Sorts Ascending by Default, which is what I want
                .Select(link => new MediaItemSummaryDto
                {
                    Id = link.MediaItem.Id,
                    Name = link.MediaItem.Name,
                    MediaTypeId = link.MediaItemId
                })
                .ToList()
        });
    }


    // CreateList, when we create, we create an empty list. In UpdateList, we'll add MediaItems to the list
    [HttpPost("CreateList")]  // Occurs with route /GetMyLists (with GET request)
    public async Task<IActionResult> CreateList([FromBody] CreateMediaListDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        // The following line means:
        // If dto.VisibilityStatus is null, set it to Private
        // AKA by default, if I don't get a VisiblityStatus value, I'll set it to Private by default
        // In Code Terms, it also means:
        // if (dto.VisibilityStatus == null){
        //     VisibilityStatusToSet = VisibilityStatus.Private
        // } else {
        //     VisibilityStatusToSet = dto.VisibilityStatus
        // }
        var VisibilityStatusToSet = dto.VisibilityStatus ?? VisibilityStatus.Private;

        var newMediaList = new MediaList
        {
            Name = dto.Name,
            Description = dto.Description,
            VisibilityStatus = VisibilityStatusToSet,
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
        bool isSpecialUserWhoCanModifyDelete = (requesterUser.RoleLevel == UserRoleLevel.Moderator
                                            || requesterUser.RoleLevel == UserRoleLevel.Administrator);

        // If the requesterUser is the owner (aka creator) of the MediaList
        // and/or is a user with special permissions (Moderator or Administrator),
        // he can modify/delete the MediaList
        return (isOwner || isSpecialUserWhoCanModifyDelete);
    }
    

    // Helper Method
    // Because this logic is used over and over in many of these methods, I am refactoring my code
    // to put all of this code into 1 method
    // To return async, I need to wrap the return type in Task<>
    private async Task<(AppUser? requesterUser, MediaList? targetedMediaList, IActionResult?)> FetchUserMediaList_andCheckPermissions(int targetedMediaListId)
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
        // The _ for the first parameter is "discarding" the first value, since we do not need that value (RequestUser) for this method
        (_, MediaList? targetedMediaList, IActionResult? error) = await FetchUserMediaList_andCheckPermissions(mediaListId);
        if (error != null) return error;

        // Delete from Database:
        // I'm adding ! because I'm telling C# that targetedMediaList should NOT be null by the time it reaches this point
        // (since it is set to a value in that FetchUserMediaList_andCheckPermissions method)
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

        // The _ for the first parameter is "discarding" the first value, since we do not need that value (RequestUser) for this method
        (_, MediaList? targetedMediaList, IActionResult? error) = await FetchUserMediaList_andCheckPermissions(mediaListId);
        if (error != null) return error;
        


        // I'm adding ! to the end of targetedMediaList to soothe the code to tell it
            // that I already checked that at this point in the code,
            // targetedMediaList is not null
            // since the method that checked it (FetchUserMediaList_andCheckPermissions)
            // already ran, and would have returned an Error code in the code block after it
            // if it was null right after that method was run (at "if (error != null) return error;")

        // Make the Changes to the MediaList object
        if (dto.Name != null)
            targetedMediaList!.Name = dto.Name;
        if (dto.Description != null)
            targetedMediaList!.Description = dto.Description;
        if (dto.VisibilityStatus != null)
        {
            if (dto.VisibilityStatus == VisibilityStatus.Shared)
            {   
                // TODO: Implement Sharing
                return StatusCode(501, "Sharing is not implemented yet.");
            }
            targetedMediaList!.VisibilityStatus = dto.VisibilityStatus.Value;
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
            // I'm adding ! to the end of targetedMediaList to soothe the code to tell it
            // that I already checked that at this point in the code,
            // targetedMediaList is not null
            // since the method that checked it (FetchUserMediaList_andCheckPermissions)
            // already ran, and would have returned an Error code in the code block after it
            // if it was null right after that method was run (at "if (error != null) return error;")
            
            Id = targetedMediaList!.Id,
            Name = targetedMediaList!.Name,
            SubmittedById = targetedMediaList!.SubmittedById,
            Description = targetedMediaList!.Description,
            VisibilityStatus = targetedMediaList!.VisibilityStatus,
            ItemCount = linkRowCount
        });
    }



    //// Editing Items in the MediaList Object:
    


    // Helper Method: Handle Out of Bounds Position Number
    // If Number is Negative, put the MediaItem in the front of the list
    // If Number is Way Too Big, put the MediaItem in the back of the list
    private async Task<int> HandleOutOfBoundsPositionNumber(int mediaListId, int? submittedPosition, bool isAdd)
    {
        // Get Size of MediaList (# of MediaItems stored in MediaList)
        // Getting MediaList's Count:
        // Get Current Count of the MediaList
        var targetedMediaList_Count_preChange = await _context.LinkMediaItemToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .CountAsync();

        // Maximum Position for DestinationPosition
        // For Adding an Item to the List,
        // -- Before the item is added, the last item in the list is at position (maxLength - 1),
        //    so if the item is added at the end, it will be placed at position (maxLength)
        // For Moving an Item in the List,
        // -- Before the item is moved, the last item in the list is at position (maxLength - 1),
        //    Because the item is being moved, the length of the list is still the same,
        //    so the length of the list is still the same,
        //    so the last slot on the list that the item could be moved to
        //    is the still numbered position that the preChange last item on the list is at
        //    is still at the same position (maxLength - 1)

        int maxPosition = isAdd ? (targetedMediaList_Count_preChange) : (targetedMediaList_Count_preChange -1); 
        

         // ?? is the "Null-Coalescing Operator"
        // Means: var variableToSet = (NullableVariable) ?? (If it is null, use this value instead.)
        var positionToCheck = submittedPosition ?? maxPosition;
        var positionToUse = positionToCheck;  // As a placeholder.

        if (positionToCheck < 0) positionToUse = 0;  // The 1st position in the list.
        else if (positionToCheck > maxPosition) positionToUse = maxPosition; // The last position on the list.
        else positionToUse = positionToCheck;
        return positionToUse;
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

    

    // Add 1 MediaItem to MediaList
    [HttpPost("{mediaListId}/items/{mediaItemId}")]  // /api/medialist/{mediaListId}/items/{mediaItemId}
    public async Task<IActionResult> AddMediaItemToList(int mediaListId, int mediaItemId, [FromBody] AddMediaItemToMediaList dto)
    {
        // The _ for the first parameter is "discarding" the first value, since we do not need that value (RequestUser) for this method
        (_, MediaList? targetedMediaList, IActionResult? error) = await FetchUserMediaList_andCheckPermissions(mediaListId);
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


        var positionToUse = await HandleOutOfBoundsPositionNumber(mediaListId, dto.Position, isAdd:true);

         var newLinkRow = new LinkMediaItemToMediaList
         {
            // .NET's EntityFramework Core automatically adds the objects assocaited with the ids to the Link Row,
            // so I don't have to specifically add them here. Hence, they are commented out here just for explanation purposes.

            HostListId = mediaListId,
            //  HostList = targetedMediaList!,  // In "FetchUserMediaList_andCheckPermissions", we already checked for if it is null
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


        // Get Count:
        var targetedMediaList_Count = await _context.LinkMediaItemToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .CountAsync();

        return Ok(new MediaListSummaryDto
        {
            // I'm adding ! to the end of targetedMediaList to soothe the code to tell it
            // that I already checked that at this point in the code,
            // targetedMediaList is not null
            // since the method that checked it (FetchUserMediaList_andCheckPermissions)
            // already ran, and would have returned an Error code in the code block after it
            // if it was null right after that method was run (at "if (error != null) return error;")

            Id = targetedMediaList!.Id,
            Name = targetedMediaList!.Name,
            SubmittedById = targetedMediaList!.SubmittedById,
            Description = targetedMediaList!.Description,
            VisibilityStatus = targetedMediaList!.VisibilityStatus,
            ItemCount = targetedMediaList_Count
        });
    }





    
    // Remove 1 MediaItem from MediaList
    [HttpDelete("{mediaListId}/items/{mediaItemId}")]  // /api/medialist/{mediaListId}/items/{mediaItemId}
    public async Task<IActionResult> RemoveMediaItemFromList(int mediaListId, int mediaItemId)
    {

        // The _ for the first parameter is "discarding" the first value, since we do not need that value (RequestUser) for this method
        (_, MediaList? targetedMediaList, IActionResult? error) = await FetchUserMediaList_andCheckPermissions(mediaListId);
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
            // I'm adding ! to the end of targetedMediaList to soothe the code to tell it
            // that I already checked that at this point in the code,
            // targetedMediaList is not null
            // since the method that checked it (FetchUserMediaList_andCheckPermissions)
            // already ran, and would have returned an Error code in the code block after it
            // if it was null right after that method was run (at "if (error != null) return error;")

            Id = targetedMediaList!.Id,
            Name = targetedMediaList!.Name,
            SubmittedById = targetedMediaList!.SubmittedById,
            Description = targetedMediaList!.Description,
            VisibilityStatus = targetedMediaList!.VisibilityStatus,
            ItemCount = linkRowCount
        });
    }




    // Move 1 MediaItem to a Different Position, still in the same MediaList
    [HttpPatch("{mediaListId}/items/{mediaItemId}")]  // /api/medialist/{mediaListId}/items/{mediaItemId}
    public async Task<IActionResult> MoveMediaItemWithinMediaList(int mediaListId, int mediaItemId, [FromBody] MoveMediaItemWithinMediaList dto)
    {



        // The _ for the first parameter is "discarding" the first value, since we do not need that value (RequestUser) for this method
        (_, MediaList? targetedMediaList, IActionResult? error) = await FetchUserMediaList_andCheckPermissions(mediaListId);
        if (error != null) return error;


        // Search for MediaItem Object.
        // If you can't find it, return NotFound()
        var targetedMediaItem = await _context.MediaItems.FindAsync(mediaItemId);

        // Throw an error if the MediaItem does not exist at all
        if (targetedMediaItem == null)
        {
            return NotFound();
        }


        // Technically, I could write this method just as:
        // var positionToUse = await HandleOutOfBoundsPositionNumber(mediaListId, dto.Position, false);
        // I added the "isAdd:" label (aka name of the input parameter for that parameter) to that parameter
        // to make this code easier to read, so they understand instantly what the boolean is for.

        var destinationPosition = await HandleOutOfBoundsPositionNumber(mediaListId, dto.NewPosition, isAdd:false);



        // Get Existing MediaItem LinkRow for the MediaList
        var linkRowRightNow = await _context.LinkMediaItemToMediaListTable
            .Where(l => l.HostListId == mediaListId)
            .Where(l => l.MediaItemId == mediaItemId)
            .FirstOrDefaultAsync();
        if (linkRowRightNow == null)
        {
            return NotFound();
        }

        // If the destinationPosition == the old position,
        // then I do not need to move anything at all,
        // I will return a Success.
        int oldPosition = linkRowRightNow.Position;
        if (destinationPosition == oldPosition)
        {
            
            return Ok(new MediaListSummaryDto
            {
                Id = targetedMediaList!.Id,
                Name = targetedMediaList.Name,
                SubmittedById = targetedMediaList!.SubmittedById,
                Description = targetedMediaList.Description,
                VisibilityStatus = targetedMediaList.VisibilityStatus,
                ItemCount = await _context.LinkMediaItemToMediaListTable
                            .Where(l => l.HostListId == mediaListId)
                            .CountAsync()
            });  
        } 


        // Move:
        // Update the Position of the target MediaItem
        linkRowRightNow.Position = destinationPosition;



        // Move the Items Between TargetMediaItem's Old and New Positions to Maintain Gapless Ordering
        // aka to maintain that once we put the TargetMediaItem into its new position,
        // we move the other objects to their new correct positions

        List<LinkMediaItemToMediaList> linkRowsToUpdate;
        if (destinationPosition > oldPosition)
        {
               linkRowsToUpdate = await _context.LinkMediaItemToMediaListTable
               .Where(l => l.HostListId == mediaListId)

               // Note: All items in between destinationPosition and oldPosition need to be moved
               //   This includes destinationPosition (to make room for the movedItem)
               //   This excludes oldPosition because that is the movedItem itself,
               //   which is being moved in a separate query.
               .Where(l => oldPosition < l.Position && l.Position <= destinationPosition)
               .ToListAsync();

        } else // if (destinationPosition < oldPosition) <-Yes, this is what it means.
        {
            linkRowsToUpdate = await _context.LinkMediaItemToMediaListTable
               .Where(l => l.HostListId == mediaListId)

               // Note: All items in between destinationPosition and oldPosition need to be moved
               //   This includes destinationPosition (to make room for the movedItem)
               //   This excludes oldPosition because that is the movedItem itself,
               //   which is being moved in a separate query.
               .Where(l => destinationPosition <= l.Position && l.Position < oldPosition)
               .ToListAsync();
        }

        // If the targetMediaItem is placed in a higher Position value (aka closer to the back of the list), move other affected MediaItems 1 slot closer to the front (aka -1 for Position values)
        int positionEditNum = (destinationPosition > oldPosition) ? -1 : 1 ;


        foreach (var linkRow in linkRowsToUpdate){
            linkRow.Position += positionEditNum;
        }
        

        // Flush changes to database
        await _context.SaveChangesAsync();

        
        return Ok(new MediaListSummaryDto
        {
            Id = targetedMediaList!.Id,
            Name = targetedMediaList.Name,
            SubmittedById = targetedMediaList!.SubmittedById,
            Description = targetedMediaList.Description,
            VisibilityStatus = targetedMediaList.VisibilityStatus,
            ItemCount = await _context.LinkMediaItemToMediaListTable
                        .Where(l => l.HostListId == mediaListId)
                        .CountAsync()
        });

    }




}
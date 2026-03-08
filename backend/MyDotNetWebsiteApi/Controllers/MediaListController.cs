


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
        
    
    [HttpDelete("{mediaListId}")]
    public async Task<IActionResult> DeleteList(int mediaListId)
    {

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        

        //// Get Current User's Permission Level:
        
        // Get User and MediaList items
        // Note: .FindAsync is searching via Primary Key (aka Id for those tables)
        var requesterUser = await _context.Users.FindAsync(userId);
        var targetedMediaList = await _context.MediaLists.FindAsync(mediaListId);

        if (targetedMediaList == null)
        {
            return NotFound();
        }

        // if requesterUser is not found in our Users table.
        if (requesterUser == null)
        {
            return Unauthorized();
        }


        // If (NOT can modifiy) AKA If cannot modify the MediaList
        if (!CanModifyDeleteMediaList(requesterUser, targetedMediaList))
        {
            return Forbid();
        }


        // Delete from Database:
        _context.MediaLists.Remove(targetedMediaList);

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
        //TODO: Rename this method's name for a neater name.

        ///// Permission Check:
        ///
        // Get RequesterUser
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var requesterUser = await _context.Users.FindAsync(userId);

        // if requesterUser is not found in our Users table.
        if (requesterUser == null)
        {
            return Unauthorized();
        }


        // Get MediaList
        var targetedMediaList = await _context.MediaLists.FindAsync(mediaListId);
        
        // If MediaList is not found in the MediaList table:
        if (targetedMediaList == null)
        {
            return NotFound();
        }


         // If (NOT can modifiy) AKA If cannot modify the MediaList
        if (!CanModifyDeleteMediaList(requesterUser, targetedMediaList))
        {
            return Forbid();
        }
        


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

        return Ok(new MediaListSummaryDto
        {
            Id = targetedMediaList.Id,
            Name = targetedMediaList.Name,
            Description = targetedMediaList.Description,
            VisibilityStatus = targetedMediaList.VisibilityStatus
            // TODO: To Implement: Give it a way to count # of MediaItems in it
            // ItemCount = targetedMediaList.ItemLinks  // It == 0 since for this createList method, we create empty lsits, and in another method, we can add to it
        });
    }



}



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
        
    
    [HttpDelete("{MediaListId}")]
    public async Task<IActionResult> DeleteList(int MediaListId)
    {

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        

        //// Get Current User's Permission Level:
        
        // Get User and MediaList items
        // Note: .FindAsync is searching via Primary Key (aka Id for those tables)
        var requesterUser = await _context.Users.FindAsync(userId);
        var targetedMediaList = await _context.MediaLists.FindAsync(MediaListId);

        if (targetedMediaList == null)
        {
            return NotFound();
        }

        // if requesterUser is not found in our Users table.
        if (requesterUser == null)
        {
            return Unauthorized();
        }


        // Permissions to Check before Deleting:
        // Only the user who created the MediaList (aka its owner)
        // and special users (Administrator, Moderator)
        // have permission to delete the MediaList
        // (Who the MediaList might be shared with is NOT relevant for deleting MediaLists)

        bool isOwner = (targetedMediaList.SubmittedById == userId);
        bool isSpecialUserWhoCanDelete = (requesterUser.RoleLevel == UserRoleLevel.Moderator
                                            || requesterUser.RoleLevel == UserRoleLevel.Administrator);

        if (!isOwner && !isSpecialUserWhoCanDelete)
        {
            return Forbid();
        }


        // Delete from Database:
        _context.MediaLists.Remove(targetedMediaList);

        // Flush changes to database
        await _context.SaveChangesAsync();

        return Ok();
    }



}
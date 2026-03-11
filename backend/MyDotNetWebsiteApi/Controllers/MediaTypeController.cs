using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[ApiController]
[Route("api/[controller]")]
[Authorize]  // Means this using this controller needs a JwtToken
public class MediaTypeController : ControllerBase
{

    // Passing in AppDbContext 
    private readonly AppDbContext _context;

    public MediaTypeController(AppDbContext context)
    {
        _context = context;
    }





    // Functions and Endpoints

    // Get all approved Media types
    [HttpGet("GetAllApproved")]  // Occurs with route /GetAll (with GET request)
    public async Task<IActionResult> GetAllApproved()
    {
        var mediaTypeObjects = await _context.MediaTypes
            .Where(l => l.IsApproved == true)
            .Select(l => new MediaTypeSummaryDto
            {
                // Instead of returning many MediaType Items,
                //   pushing each MediaType's info
                //    into its own DTO object
                Id = l.Id,
                Name = l.Name,
                Description = l.Description,
                IsApproved = l.IsApproved
            })
            .ToListAsync();

        return Ok(mediaTypeObjects);
    }

    
    //Get 1 MediaType in Detail:
    [HttpGet("{mediaTypeId}")]
    public async Task<IActionResult> GetMediaType(int mediaTypeId)
    {
          var mediaTypeObject = await _context.MediaTypes
            .Where(l => l.Id == mediaTypeId)
            .Select(l => new MediaItemDetailDto
            {
                // Instead of returning many MediaType Items,
                //   pushing each MediaType's info
                //    into its own DTO object
                Id = l.Id,
                Name = l.Name,
                Description = l.Description,
                IsApproved = l.IsApproved,

                SubmittedById = l.SubmittedById,
                DateSubmitted = l.DateSubmitted
            })
            .FirstOrDefaultAsync();

        // If user has permission to see non-approved mediaItem, see it.
        // Permission Checking for Getting Media List Detail
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        var targetedMediaType = await _context.MediaTypes.FindAsync(mediaTypeId);

        // if targetedMediaList is not found in our MediaLists table.
        if (targetedMediaType == null)
        {
            return NotFound();
        }

        // if requesterUser is not found in our Users table.
        else if (requesterUser == null)
        {
            return Unauthorized();
        }
        
        else if (!CanSeeMediaType(requesterUser, targetedMediaType))
        {
            return Forbid();
        }

        return Ok(mediaTypeObject);
    }



    // Helper Function:
    private bool CanSeeMediaType(AppUser requesterUser, MediaType targetedMediaType)
    {   

        if (targetedMediaType == null)
        {
            return false;
        }

        // if requesterUser is not found in our Users table.
        if (requesterUser == null)
        {
            return false;
        }


        // Permissions to Check
        // Only the user who created the MediaType (aka its owner)
        // and moderators and administrators can see not approved MediaTypes

        bool isOwner = (targetedMediaType.SubmittedById == requesterUser.Id);
        bool isSpecialUser = (requesterUser.RoleLevel == UserRoleLevel.Administrator)
            || (requesterUser.RoleLevel == UserRoleLevel.Administrator);

        // If the requesterUser is the owner (aka creator) of the MediaList
        // and/or is a user with special permissions (Moderator or Administrator),
        // he can modify/delete the MediaList
        return (isOwner || isSpecialUser || targetedMediaType.IsApproved == true);
    }


    // TODO: Implement a Submission system if users think of new MediaTypes.
}
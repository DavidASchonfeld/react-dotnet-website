using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaTypeController : ControllerBase
{
    
    private readonly IMediaTypeService _mediaTypeService;

    public MediaTypeController(IMediaTypeService mediaTypeService)
    {
        _mediaTypeService = mediaTypeService;
    }


    // Routes/Endpoints

    // Get all approved MediaType objects
    [HttpGet("GetAllApproved")]
    public async Task<IActionResult> GetAllApproved()
    {
        var result = await _mediaTypeService.GetAllApprovedAsync();
        return result.ToActionResult(this);
    }

    [HttpGet("{mediaTypeId}")]
    public async Task<IActionResult> GetMediaType(int mediaTypeId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;  // I am adding a "!" here to tell C# that this will never return a null. I know this because this controller has a [Authorize] at the top, meaning that the user will always be logged in before he ever encounters this part of the code.
        var result = await _mediaTypeService.GetMediaTypeAsync(mediaTypeId, requesterUserId);
        return result.ToActionResult(this);  // This method is defined in backend/MyDotNetWebsiteApi/Services/ServiceResult.cs
    }

}
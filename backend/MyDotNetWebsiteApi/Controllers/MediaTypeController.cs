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
    [HttpGet("all-approved")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllApproved()
    {
        var result = await _mediaTypeService.GetAllApprovedAsync();
        return result.ToActionResult(this);
    }

    [HttpGet("{mediaTypeId}")]
    public async Task<IActionResult> GetMediaType(int mediaTypeId)
    {
        var requesterUserId = User.RequireId();
        var result = await _mediaTypeService.GetMediaTypeAsync(mediaTypeId, requesterUserId);
        return result.ToActionResult(this);  // This method is defined in backend/MyDotNetWebsiteApi/Services/ServiceResult.cs
    }

}
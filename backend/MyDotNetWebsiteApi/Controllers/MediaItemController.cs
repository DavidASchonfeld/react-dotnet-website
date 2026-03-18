using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// Note: Permissions are not in this file.
// Instead, permissions are in the Services level, specifically in backend/MyDotNetWebsiteApi/Services/MediaItemService.cs

[ApiController]
[Route("api/[controller]")]
[Authorize]  // Means this using this controller needs a JwtToken
public class MediaItemController : ControllerBase
{
    private readonly IMediaItemService _mediaItemService;

    public MediaItemController(IMediaItemService mediaItemService)
    {
        _mediaItemService = mediaItemService;
    }



    // Routing and Endpoints

    [HttpGet("{mediaItemId}")]
    public async Task<IActionResult> GetMediaItemDetail(int mediaItemId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;  // I am adding a "!" here to tell C# that this will never return a null. I know this because this controller has a [Authorize] at the top, meaning that the user will always be logged in before he ever encounters this part of the code.
        var result = await _mediaItemService.GetMediaItemDetailAsync(mediaItemId, requesterUserId);
        return result.ToActionResult(this);  // This method is defined in backend/MyDotNetWebsiteApi/Services/ServiceResult.cs
    }

    [HttpGet("getAllApprovedMediaItemsForAdmin")]
    public async Task<IActionResult> GetAllApprovedMediaItemsForAdmin()
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaItemService.GetAllApprovedMediaItemsForAdminAsync(requesterUserId);
        return result.ToActionResult(this);
    }

    // Get X random approved MediaItems
    [HttpGet("getRandom/{amount}")]
    public async Task<IActionResult> GetRandomAmount(int amount)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaItemService.GetRandomAsync(amount, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateMediaItem([FromBody] CreateMediaItemDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaItemService.CreateMediaItemAsync(dto, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpDelete("{mediaItemId}")]
    public async Task<IActionResult> DeleteMediaItem(int mediaItemId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaItemService.DeleteMediaItemAsync(mediaItemId, requesterUserId);
        return result.ToActionResult(this);
    }

    // Patching Non-Linked (aka Basic) Items
    [HttpPatch("{mediaItemId}")]
    public async Task<IActionResult> UpdateMediaItem(int mediaItemId, [FromBody] UpdateMediaItemBasicInfoDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaItemService.PatchMediaItemBasicInfoAsync(mediaItemId, dto, requesterUserId);
        return result.ToActionResult(this);
    }







}
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaListController : ControllerBase
{
    private readonly IMediaListService _mediaListService;

    public MediaListController(IMediaListService mediaListService)
    {
        _mediaListService = mediaListService;
    }



    // Routing and Endpoints

    [HttpGet("my-lists")]
    public async Task<IActionResult> GetMyLists()
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;  // I am adding a "!" here to tell C# that this will never return a null. I know this because this controller has a [Authorize] at the top, meaning that the user will always be logged in before he ever encounters this part of the code.
        var result = await _mediaListService.GetMyListsAsync(requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpGet("{mediaListId}")]
    public async Task<IActionResult> GetMediaListDetail(int mediaListId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.GetMediaListDetailAsync(mediaListId, requesterUserId);
        return result.ToActionResult(this);  // This method is defined in backend/MyDotNetWebsiteApi/Services/ServiceResult.cs
    }

    [HttpPost("create-list")]
    public async Task<IActionResult> CreateList([FromBody] CreateMediaListDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.CreateListAsync(dto, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpDelete("{mediaListId}")]
    public async Task<IActionResult> DeleteList(int mediaListId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.DeleteListAsync(mediaListId, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpPatch("{mediaListId}")]
    public async Task<IActionResult> PatchListBasicInfo(int mediaListId, [FromBody] UpdateMediaListNotListContentDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.PatchListBasicInfoAsync(mediaListId, dto, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpPost("{mediaListId}/items/{mediaItemId}")]
    public async Task<IActionResult> AddMediaItemToMediaList(int mediaListId, int mediaItemId, [FromBody] AddMediaItemToMediaListDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.AddMediaItemToListAsync(mediaListId, mediaItemId, dto, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpDelete("{mediaListId}/items/{mediaItemId}")]
    public async Task<IActionResult> RemoveMediaItemFromList(int mediaListId, int mediaItemId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.RemoveMediaItemFromListAsync(mediaListId, mediaItemId, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpPatch("{mediaListId}/items/{mediaItemId}")]
    public async Task<IActionResult> MoveMediaItemWithinMediaList(int mediaListId, int mediaItemId, [FromBody] MoveMediaItemWithinMediaListDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.MoveMediaItemWithinMediaListAsync(mediaListId, mediaItemId, dto, requesterUserId);
        return result.ToActionResult(this);
    }

    // Search MediaLists with an optional owner filter.
    // ownedByUserId = absent/null      → all visible (owner || admin || public)
    // ownedByUserId = current user ID  → own lists only
    // ownedByUserId = another user ID  → that user's public lists (or all if admin)
    [HttpGet("search")]
    public async Task<IActionResult> SearchLists([FromQuery] string q, [FromQuery] int limit = 10, [FromQuery] string? ownedByUserId = null)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.SearchListsAsync(q, limit, ownedByUserId, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpPatch("{mediaListId}/reorder")]
    public async Task<IActionResult> ReorderItems(int mediaListId, [FromBody] ReorderMediaListItemsDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.ReorderItemsAsync(mediaListId, dto.OrderedItemIds, requesterUserId);
        return result.ToActionResult(this);
    }





}
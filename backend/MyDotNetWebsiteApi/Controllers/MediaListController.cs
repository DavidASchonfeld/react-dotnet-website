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
    public async Task<IActionResult> GetMyLists([FromQuery] int page = 1, [FromQuery] int pageSize = AppConstants.DefaultPageSize)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;  // I am adding a "!" here to tell C# that this will never return a null. I know this because this controller has a [Authorize] at the top, meaning that the user will always be logged in before he ever encounters this part of the code.
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, AppConstants.DefaultPageSize);
        var result = await _mediaListService.GetMyListsAsync(requesterUserId, page, pageSize);
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

    [HttpPost("{mediaListId}/items/{mediaApiRefId}")]
    public async Task<IActionResult> AddMediaApiRefToMediaList(int mediaListId, int mediaApiRefId, [FromBody] AddMediaApiRefToMediaListDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.AddMediaApiRefToListAsync(mediaListId, mediaApiRefId, dto, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpDelete("{mediaListId}/items/{mediaApiRefId}")]
    public async Task<IActionResult> RemoveMediaApiRefFromList(int mediaListId, int mediaApiRefId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.RemoveMediaApiRefFromListAsync(mediaListId, mediaApiRefId, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpPatch("{mediaListId}/items/{mediaApiRefId}")]
    public async Task<IActionResult> MoveMediaApiRefWithinMediaList(int mediaListId, int mediaApiRefId, [FromBody] MoveMediaApiRefWithinMediaListDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaListService.MoveMediaApiRefWithinMediaListAsync(mediaListId, mediaApiRefId, dto, requesterUserId);
        return result.ToActionResult(this);
    }

    // Search MediaLists with an optional owner filter.
    // ownedByUserId = absent/null      → all visible (owner || admin || public)
    // ownedByUserId = current user ID  → own lists only
    // ownedByUserId = another user ID  → that user's public lists (or all if admin)
    // mineOnly = true                  → shorthand for ownedByUserId = requesterUserId (avoids exposing GUID to frontend)
    [HttpGet("search")]
    public async Task<IActionResult> SearchLists(
        [FromQuery] string q,
        [FromQuery] int limit = 10,
        [FromQuery] string? ownedByUserId = null,
        [FromQuery] bool mineOnly = false) // when true, overrides ownedByUserId with requester's own ID
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        // mineOnly is a convenience flag so the frontend never needs to know the user's GUID
        var resolvedOwnerId = mineOnly ? requesterUserId : ownedByUserId;
        var result = await _mediaListService.SearchListsAsync(q, limit, resolvedOwnerId, requesterUserId);
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

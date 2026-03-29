using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomTagController : ControllerBase
{
    private readonly ICustomTagService _customTagService;

    public CustomTagController(ICustomTagService customTagService)
    {
        _customTagService = customTagService;
    }


    // Returns the requester's own tags plus all public tags (paginated)
    [HttpGet("my-tags")]
    public async Task<IActionResult> GetMyTags([FromQuery] int page = 1, [FromQuery] int pageSize = AppConstants.DefaultPageSize)
    {
        var requesterUserId = User.RequireId();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, AppConstants.DefaultPageSize);
        var result = await _customTagService.GetMyTagsAsync(requesterUserId, page, pageSize);
        return result.ToActionResult(this);
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateTag([FromBody] CreateCustomTagDto dto)
    {
        var requesterUserId = User.RequireId();
        var result = await _customTagService.CreateTagAsync(dto, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpPatch("{tagId}")]
    public async Task<IActionResult> UpdateTag(int tagId, [FromBody] UpdateCustomTagDto dto)
    {
        var requesterUserId = User.RequireId();
        var result = await _customTagService.UpdateTagAsync(tagId, dto, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpDelete("{tagId}")]
    public async Task<IActionResult> DeleteTag(int tagId)
    {
        var requesterUserId = User.RequireId();
        var result = await _customTagService.DeleteTagAsync(tagId, requesterUserId);
        return result.ToActionResult(this);
    }

    // Open to anonymous users — guests see public tags; mineOnly requires authentication.
    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchTags(
        [FromQuery] string q = "",
        [FromQuery] int limit = 10,
        [FromQuery] bool mineOnly = false, // when true, returns only the requester's own tags
        [FromQuery] int page = 1)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (mineOnly && requesterUserId == null) return Unauthorized();
        var result = await _customTagService.SearchTagsAsync(q, limit, requesterUserId, mineOnly, page);
        return result.ToActionResult(this);
    }

    [HttpPost("{tagId}/items/{mediaApiRefId}")]
    public async Task<IActionResult> AddTagToItem(int tagId, int mediaApiRefId, [FromBody] AddTagToMediaApiRefDto? dto = null)
    {
        var requesterUserId = User.RequireId();
        var result = await _customTagService.AddTagToMediaApiRefAsync(tagId, mediaApiRefId, requesterUserId, dto);
        return result.ToActionResult(this);
    }

    [HttpDelete("{tagId}/items/{mediaApiRefId}")]
    public async Task<IActionResult> RemoveTagFromItem(int tagId, int mediaApiRefId)
    {
        var requesterUserId = User.RequireId();
        var result = await _customTagService.RemoveTagFromMediaApiRefAsync(tagId, mediaApiRefId, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpGet("{tagId}")]
    public async Task<IActionResult> GetTag(int tagId)
    {
        var requesterUserId = User.RequireId();
        var result = await _customTagService.GetTagAsync(tagId, requesterUserId);
        return result.ToActionResult(this);
    }

    // Returns all MediaApiRef items that have the given tag (paginated)
    [HttpGet("{tagId}/items")]
    public async Task<IActionResult> GetItemsByTag(int tagId, [FromQuery] int page = 1, [FromQuery] int pageSize = AppConstants.DefaultPageSize)
    {
        var requesterUserId = User.RequireId();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, AppConstants.DefaultPageSize);
        var result = await _customTagService.GetItemsByTagAsync(tagId, requesterUserId, page, pageSize);
        return result.ToActionResult(this);
    }
}

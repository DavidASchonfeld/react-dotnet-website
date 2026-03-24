using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaApiRefController : ControllerBase
{
    private readonly IMediaApiRefService _mediaApiRefService;

    public MediaApiRefController(IMediaApiRefService mediaApiRefService)
    {
        _mediaApiRefService = mediaApiRefService;
    }


    [HttpGet("{mediaApiRefId}")]
    public async Task<IActionResult> GetMediaApiRefDetail(int mediaApiRefId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaApiRefService.GetMediaApiRefDetailAsync(mediaApiRefId, requesterUserId);
        return result.ToActionResult(this);
    }

    // Proxies the search to the active external API for the given media type.
    // Returns ExternalApiSearchResult items (not MediaApiRef records) — these are raw API results.
    [HttpGet("search")]
    public async Task<IActionResult> SearchExternalApi(
        [FromQuery] string q,
        [FromQuery] int mediaTypeId,
        [FromQuery] int limit = 10,
        [FromQuery] int page = 1)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaApiRefService.SearchExternalApiAsync(q, limit, mediaTypeId, requesterUserId, page);
        return result.ToActionResult(this);
    }

    // Idempotent: if the item already exists in our DB, returns the existing record.
    // Call this after the user picks a result from the external API search.
    [HttpPost("find-or-create")]
    public async Task<IActionResult> FindOrCreate([FromBody] FindOrCreateMediaApiRefDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaApiRefService.FindOrCreateAsync(dto, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpGet("{mediaApiRefId}/lists")]
    public async Task<IActionResult> GetListsContainingRef(int mediaApiRefId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaApiRefService.GetListsContainingRefAsync(mediaApiRefId, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpGet("{mediaApiRefId}/tags")]
    public async Task<IActionResult> GetTagsForRef(int mediaApiRefId)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediaApiRefService.GetTagsForRefAsync(mediaApiRefId, requesterUserId);
        return result.ToActionResult(this);
    }
}

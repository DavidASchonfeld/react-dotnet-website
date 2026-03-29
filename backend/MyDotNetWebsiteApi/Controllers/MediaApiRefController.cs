using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

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


    // Fetch detail by external identifiers. Checks DB first; falls back to external API. Returns Id=0 when not in DB.
    // Open to anonymous users — guests see public data, authenticated users also get admin info if applicable.
    [HttpGet("byexternal/{apiName}/{externalId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByExternal(string apiName, string externalId)
    {
        // Null for guests; populated for authenticated users.
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _mediaApiRefService.GetDetailByExternalKeyAsync(apiName, externalId, requesterUserId);
        return WrapCachedResponse(result);
    }

    [HttpGet("{mediaApiRefId}")]
    public async Task<IActionResult> GetMediaApiRefDetail(int mediaApiRefId, [FromQuery] bool bypassCache = false)
    {
        var requesterUserId = User.RequireId();
        var result = await _mediaApiRefService.GetDetailByDbIdAsync(mediaApiRefId, requesterUserId, bypassCache);
        return WrapCachedResponse(result);
    }

    // Proxies the search to the active external API for the given media type.
    // Returns ExternalApiSearchResult items (not MediaApiRef records) — these are raw API results.
    // Open to anonymous users — guests can search; authenticated users get admin-level cache bypass.
    [HttpGet("search")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimiterExtensions.ExternalApiSearchPolicy)]
    public async Task<IActionResult> SearchExternalApi(
        [FromQuery] string q,
        [FromQuery] int mediaTypeId,
        [FromQuery] int limit = 10,
        [FromQuery] int page = 1,
        [FromQuery] string? subtype = null,
        [FromQuery] bool bypassCache = false)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _mediaApiRefService.SearchThirdPartyApiAsync(q, limit, mediaTypeId, requesterUserId, page, subtype, bypassCache);
        return WrapCachedResponse(result);
    }

    // Fetches a single item by its external API ID, using non-search caching when enabled.
    [HttpGet("external-detail")]
    [EnableRateLimiting(RateLimiterExtensions.ExternalApiSearchPolicy)]
    public async Task<IActionResult> GetExternalApiItem(
        [FromQuery] string externalItemId,
        [FromQuery] int sourceId,
        [FromQuery] bool bypassCache = false)
    {
        var requesterUserId = User.RequireId();
        var result = await _mediaApiRefService.FetchRawItemFromExternalApiAsync(externalItemId, sourceId, requesterUserId, bypassCache);
        return WrapCachedResponse(result);
    }

    // Idempotent: if the item already exists in our DB, returns the existing record.
    // Call this after the user picks a result from the external API search.
    [HttpPost("find-or-create")]
    [EnableRateLimiting(RateLimiterExtensions.ExternalApiSearchPolicy)]
    public async Task<IActionResult> FindOrCreate([FromBody] FindOrCreateMediaApiRefDto dto)
    {
        var requesterUserId = User.RequireId();
        var result = await _mediaApiRefService.GetOrCreateMediaApiRefAsync(dto, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpGet("{mediaApiRefId}/lists")]
    public async Task<IActionResult> GetListsContainingRef(int mediaApiRefId)
    {
        var requesterUserId = User.RequireId();
        var result = await _mediaApiRefService.GetListsContainingRefAsync(mediaApiRefId, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpGet("{mediaApiRefId}/tags")]
    public async Task<IActionResult> GetTagsForRef(int mediaApiRefId)
    {
        var requesterUserId = User.RequireId();
        var result = await _mediaApiRefService.GetTagsForRefAsync(mediaApiRefId, requesterUserId);
        return result.ToActionResult(this);
    }

    [HttpGet("{mediaApiRefId}/applied-tags")]
    public async Task<IActionResult> GetAppliedTagsWithNotes(int mediaApiRefId)
    {
        var requesterUserId = User.RequireId();
        var result = await _mediaApiRefService.GetAppliedTagsWithNotesAsync(mediaApiRefId, requesterUserId);
        return result.ToActionResult(this);
    }

    // Force-refresh (admin-gated): bypasses CacheItem, fetches fresh data from external API, and updates DetailsFetchedAt.
    [HttpPost("{mediaApiRefId}/refresh")]
    public async Task<IActionResult> RefreshDetails(int mediaApiRefId)
    {
        var requesterUserId = User.RequireId();
        var result = await _mediaApiRefService.GetDetailByDbIdAsync(mediaApiRefId, requesterUserId, bypassCache: true);
        return WrapCachedResponse(result);
    }

    private bool IsCurrentUserAdmin =>
        User.FindFirstValue("RoleLevel") == nameof(UserRoleLevel.Administrator);

    private IActionResult WrapCachedResponse<T>(ServiceResult<T> result)
    {
        if (result.IsSuccess)
        {
            object response = IsCurrentUserAdmin
                ? new { data = result.Data, cacheMetadata = result.CacheMetadata }
                : new { data = result.Data };
            return Ok(response);
        }

        return Problem(detail: result.ErrorMessage, statusCode: result.StatusCode);
    }
}

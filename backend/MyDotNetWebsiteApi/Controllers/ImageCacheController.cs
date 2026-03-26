using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

// Serves images through the backend cache instead of direct external URLs — deduplicates blobs across users
[ApiController]
[Route("api/[controller]")]
public class ImageCacheController : ControllerBase
{
    private readonly IImageCacheService _imageCacheService;
    private readonly AppDbContext _context;
    private readonly ExternalMediaApiAdapterFactory _adapterFactory;  // resolves the poster fetch URL per API
    private readonly IApiUsageService _apiUsageService;               // tracks one request on poster cache miss
    private readonly ILogger<ImageCacheController> _logger;

    public ImageCacheController(
        IImageCacheService imageCacheService,
        AppDbContext context,
        ExternalMediaApiAdapterFactory adapterFactory,
        IApiUsageService apiUsageService,
        ILogger<ImageCacheController> logger)
    {
        _imageCacheService = imageCacheService;
        _context = context;
        _adapterFactory = adapterFactory;
        _apiUsageService = apiUsageService;
        _logger = logger;
    }

    // GET /api/imagecache?url={encodedImageUrl}
    // Returns the image blob from cache or fetches from the external URL and caches it first.
    [HttpGet]
    [EnableRateLimiting(RateLimiterExtensions.PublicEndpointPolicy)]
    public async Task<IActionResult> GetImage([FromQuery] string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return BadRequest("Image URL is required.");

        var result = await _imageCacheService.GetOrFetchImageAsync(url);

        if (result == null)
            return StatusCode(502, "Failed to fetch image from the external URL.");

        var (blob, contentType) = result.Value;
        return File(blob, contentType);
    }

    // DELETE /api/imagecache/placeholders
    // Removes invalid ImageCache entries and clears non-http MediaApiRef thumbnail URLs. Admin-only.
    [HttpDelete("placeholders")]
    [Authorize]
    public async Task<IActionResult> DeletePlaceholders()
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return Unauthorized();
        if (!PermissionHelper.IsAdministrator(requesterUser)) return Forbid();

        var (deletedCacheEntries, nulledPlaceholderThumbnails) =
            await _imageCacheService.DeletePlaceholderEntriesAsync();

        return Ok(new { deletedCacheEntries, nulledPlaceholderThumbnails });
    }

    // GET /api/imagecache/poster-api/{apiName}/{externalId}
    // Fetches a high-res poster via the adapter's poster endpoint; API key stays server-side.
    // Tracks one usage request on the first cache miss; subsequent hits are served for free.
    [HttpGet("poster-api/{apiName}/{externalId}")]
    [EnableRateLimiting(RateLimiterExtensions.PublicEndpointPolicy)]
    public async Task<IActionResult> GetPosterApiImage(string apiName, string externalId)
    {
        var adapter = _adapterFactory.GetAdapter(apiName);
        var fetchUrl = adapter?.BuildPosterFetchUrl(externalId);
        if (fetchUrl == null)
            return NotFound("This API does not support a poster endpoint.");

        // Cache under the pseudo-URL key so it is recognised as a poster-api:// entry elsewhere.
        var cacheKey = $"poster-api://{apiName}/{externalId}";
        var wasCached = await _context.ImageCaches
            .AnyAsync(i => i.ImageUrl == cacheKey && i.ImageBlob != null);

        _logger.LogInformation(
            "Poster API [{ApiName}/{ExternalId}] — {CacheStatus}",
            apiName, externalId, wasCached ? "cache hit" : "cache miss, calling external API");

        var result = await _imageCacheService.GetOrFetchImageAsync(cacheKey, fetchUrl);
        if (result == null)
        {
            _logger.LogWarning(
                "Poster API [{ApiName}/{ExternalId}] — external API returned no image (see ImageCacheService log for details)",
                apiName, externalId);
            return StatusCode(502, "Failed to fetch image from the poster API.");
        }

        // Only count the request when actually hitting the external API (cache misses).
        if (!wasCached)
            await _apiUsageService.TrackRequestAsync(apiName);

        var (blob, contentType) = result.Value;
        _logger.LogInformation(
            "Poster API [{ApiName}/{ExternalId}] — served {Size} bytes ({ContentType})",
            apiName, externalId, blob.Length, contentType);
        return File(blob, contentType);
    }

    // DELETE /api/imagecache/big-images
    // Resets poster-api:// PosterUrl values to ThumbnailUrl and deletes cached big-poster blobs. Admin-only.
    [HttpDelete("big-images")]
    [Authorize]
    public async Task<IActionResult> DumpBigImages()
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return Unauthorized();
        if (!PermissionHelper.IsAdministrator(requesterUser)) return Forbid();

        var (deletedCacheEntries, resetPosterUrls) =
            await _imageCacheService.DumpBigImagesAsync();

        return Ok(new { deletedCacheEntries, resetPosterUrls });
    }
}

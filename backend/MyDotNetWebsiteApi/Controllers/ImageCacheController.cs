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

    public ImageCacheController(IImageCacheService imageCacheService, AppDbContext context)
    {
        _imageCacheService = imageCacheService;
        _context = context;
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
}

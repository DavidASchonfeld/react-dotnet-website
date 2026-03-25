using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// Serves images through the backend cache instead of direct external URLs — deduplicates blobs across users
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImageCacheController : ControllerBase
{
    private readonly IImageCacheService _imageCacheService;

    public ImageCacheController(IImageCacheService imageCacheService)
    {
        _imageCacheService = imageCacheService;
    }

    // GET /api/imagecache?url={encodedImageUrl}
    // Returns the image blob from cache or fetches from the external URL and caches it first.
    [HttpGet]
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
}

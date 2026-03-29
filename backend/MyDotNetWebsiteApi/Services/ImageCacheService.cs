using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

// Check ImageCache by URL → cache hit returns blob; miss fetches from URL, stores, and returns
public class ImageCacheService : IImageCacheService
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<ImageCacheService> _logger;
    private readonly CacheSettings _cacheSettings; // TTL and size-cap values from appsettings.json

    public ImageCacheService(AppDbContext context, HttpClient httpClient, ILogger<ImageCacheService> logger, IOptions<CacheSettings> cacheSettings)
    {
        _context = context;
        _httpClient = httpClient;
        _logger = logger;
        _cacheSettings = cacheSettings.Value;
    }

    // Single-param version: cache key and fetch URL are the same (the normal image proxy path).
    public Task<(byte[] blob, string contentType)?> GetOrFetchImageAsync(string imageUrl) =>
        GetOrFetchImageAsync(imageUrl, imageUrl);

    // Two-param version: cacheKey is the DB key; fetchUrl is the actual HTTP URL to download from.
    // Used by the poster-api:// pseudo-URL scheme where the two differ.
    public async Task<(byte[] blob, string contentType)?> GetOrFetchImageAsync(string cacheKey, string fetchUrl)
    {
        var imageUrl = cacheKey; // alias for readability in the body below — DB lookups use cacheKey
        // Cache hit: update LRU tracking and return stored blob
        // LRU stands for "Least Recently Used"
        ImageCache? cached;
        try
        {
            cached = await _context.ImageCaches.FindAsync(imageUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ImageCache: Failed to look up cache entry for {Url}", imageUrl);
            return null;
        }
        if (cached != null && DateTime.SpecifyKind(cached.ExpiresAt, DateTimeKind.Utc) > DateTime.UtcNow && cached.ImageBlob != null)
        {
            // LRU tracking is cosmetic — never fail the request if this write conflicts
            try
            {
                cached.AccessedAt = DateTime.UtcNow;
                cached.HitCount++;
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "ImageCache: Could not update LRU tracking for {Url}", imageUrl);
            }
            return (cached.ImageBlob, cached.ContentType ?? "image/jpeg");
        }

        // Cache miss — fetch from the actual fetch URL (may differ from cacheKey for pseudo-URL schemes)
        HttpResponseMessage response;
        try
        {
            response = await _httpClient.GetAsync(fetchUrl);
            if (!response.IsSuccessStatusCode)
            {
                // Log cacheKey (not fetchUrl) to avoid leaking API keys embedded in the URL.
                _logger.LogWarning("ImageCache: External URL returned {StatusCode} for {CacheKey}", (int)response.StatusCode, imageUrl);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ImageCache: Failed to fetch external URL for {CacheKey}", imageUrl);
            return null;
        }

        byte[] blob;
        try
        {
            blob = await response.Content.ReadAsByteArrayAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ImageCache: Failed to read response body for {CacheKey}", imageUrl);
            return null;
        }

        var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
        _logger.LogInformation("ImageCache: Fetched {Size} bytes ({ContentType}) from external URL for key {CacheKey}", blob.Length, contentType, imageUrl);

        // Upsert: insert new or refresh existing ImageCache entry
        if (cached != null)
        {
            cached.ImageBlob = blob;
            cached.ContentType = contentType;
            cached.ImageSizeBytes = blob.Length;
            cached.CachedAt = DateTime.UtcNow;
            cached.AccessedAt = DateTime.UtcNow;
            cached.ExpiresAt = DateTime.UtcNow.AddDays(_cacheSettings.ImageTtlDays);
        }
        else
        {
            _context.ImageCaches.Add(new ImageCache
            {
                ImageUrl = imageUrl,
                ImageBlob = blob,
                ContentType = contentType,
                ImageSizeBytes = blob.Length,
                CachedAt = DateTime.UtcNow,
                AccessedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(_cacheSettings.ImageTtlDays),
            });
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException) when (cached == null)
        {
            // Race condition: multiple concurrent requests for the same URL all saw a cache miss
            // and raced to insert. The first one won; re-fetch its entry and serve it instead.
            _logger.LogDebug("ImageCache: Race condition on insert for {Url} — serving existing entry", imageUrl);
            _context.ChangeTracker.Clear();
            var existing = await _context.ImageCaches.FindAsync(imageUrl);
            if (existing?.ImageBlob != null)
                return (existing.ImageBlob, existing.ContentType ?? "image/jpeg");
            return (blob, contentType); // winning entry disappeared — return what we fetched without persisting
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ImageCache: Failed to save cache entry for {Url}", imageUrl);
            return (blob, contentType); // return what we fetched even though we couldn't persist it
        }

        return (blob, contentType);
    }

    public async Task<bool> IsImageReachableAsync(string imageUrl)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Head, imageUrl);
            var response = await _httpClient.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<(int deletedCacheEntries, int nulledPlaceholderThumbnails)> DeletePlaceholderEntriesAsync()
    {
        // Step 1: Delete corrupt/incomplete entries — but preserve valid poster-api:// pseudo-URL entries.
        var deletedCacheEntries = await _context.ImageCaches
            .Where(i => (!i.ImageUrl.StartsWith("http") && !i.ImageUrl.StartsWith("poster-api://")) || i.ImageBlob == null)
            .ExecuteDeleteAsync();

        if (deletedCacheEntries > 0)
            _logger.LogInformation("ImageCache: Deleted {Count} placeholder/invalid entries.", deletedCacheEntries);

        // Step 2: Null out MediaApiRef thumbnail URLs that aren't real external HTTP URLs
        // (e.g. /placeholder-thumbnail.svg accidentally stored in the DB)
        var nulledPlaceholderThumbnails = await _context.MediaApiRefs
            .Where(m => m.ThumbnailUrl != null && !m.ThumbnailUrl.StartsWith("http"))
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.ThumbnailUrl, (string?)null));

        return (deletedCacheEntries, nulledPlaceholderThumbnails);
    }

    public async Task<(int deletedCacheEntries, int resetPosterUrls)> DumpBigImagesAsync()
    {
        // Step 1: Reset PosterUrl → ThumbnailUrl on all refs that pointed to a poster-api:// pseudo-URL.
        var resetPosterUrls = await _context.MediaApiRefs
            .Where(m => m.PosterUrl != null && m.PosterUrl.StartsWith("poster-api://"))
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.PosterUrl, m => m.ThumbnailUrl));

        if (resetPosterUrls > 0)
            _logger.LogInformation("ImageCache: Reset {Count} MediaApiRef.PosterUrl values to ThumbnailUrl.", resetPosterUrls);

        // Step 2: Delete all ImageCache blobs stored under poster-api:// keys.
        var deletedCacheEntries = await _context.ImageCaches
            .Where(i => i.ImageUrl.StartsWith("poster-api://"))
            .ExecuteDeleteAsync();

        if (deletedCacheEntries > 0)
            _logger.LogInformation("ImageCache: Deleted {Count} poster-api:// cache entries.", deletedCacheEntries);

        return (deletedCacheEntries, resetPosterUrls);
    }
}

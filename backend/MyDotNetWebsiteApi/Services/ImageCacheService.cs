using Microsoft.EntityFrameworkCore;

// Check ImageCache by URL → cache hit returns blob; miss fetches from URL, stores, and returns
public class ImageCacheService : IImageCacheService
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<ImageCacheService> _logger;

    public ImageCacheService(AppDbContext context, HttpClient httpClient, ILogger<ImageCacheService> logger)
    {
        _context = context;
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<(byte[] blob, string contentType)?> GetOrFetchImageAsync(string imageUrl)
    {
        // Cache hit: update LRU tracking and return stored blob
        // LRU stands for "Least Recently Used"
        var cached = await _context.ImageCaches.FindAsync(imageUrl);
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

        // Cache miss — fetch from external URL and store blob
        HttpResponseMessage response;
        try
        {
            response = await _httpClient.GetAsync(imageUrl);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ImageCache: External URL returned {StatusCode} for {Url}", (int)response.StatusCode, imageUrl);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ImageCache: Failed to fetch external URL {Url}", imageUrl);
            return null;
        }

        byte[] blob;
        try
        {
            blob = await response.Content.ReadAsByteArrayAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ImageCache: Failed to read response body for {Url}", imageUrl);
            return null;
        }

        var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";

        // Upsert: insert new or refresh existing ImageCache entry
        if (cached != null)
        {
            cached.ImageBlob = blob;
            cached.ContentType = contentType;
            cached.ImageSizeBytes = blob.Length;
            cached.CachedAt = DateTime.UtcNow;
            cached.AccessedAt = DateTime.UtcNow;
            cached.ExpiresAt = DateTime.UtcNow.AddDays(AppConstants.ImageCacheTtlDays);
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
                ExpiresAt = DateTime.UtcNow.AddDays(AppConstants.ImageCacheTtlDays),
            });
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (cached == null)
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
        // Step 1: Delete ImageCache rows with relative/local URLs or a null blob (corrupt/incomplete entries)
        var deletedCacheEntries = await _context.ImageCaches
            .Where(i => !i.ImageUrl.StartsWith("http") || i.ImageBlob == null)
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
}

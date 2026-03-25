using Microsoft.EntityFrameworkCore;

// Check ImageCache by URL → cache hit returns blob; miss fetches from URL, stores, and returns
public class ImageCacheService : IImageCacheService
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;

    public ImageCacheService(AppDbContext context, HttpClient httpClient)
    {
        _context = context;
        _httpClient = httpClient;
    }

    public async Task<(byte[] blob, string contentType)?> GetOrFetchImageAsync(string imageUrl)
    {
        // Cache hit: update LRU tracking and return stored blob
        // LRU stands for "Least Recently Ued"
        var cached = await _context.ImageCaches.FindAsync(imageUrl);
        if (cached != null && DateTime.SpecifyKind(cached.ExpiresAt, DateTimeKind.Utc) > DateTime.UtcNow && cached.ImageBlob != null)
        {
            cached.AccessedAt = DateTime.UtcNow;
            cached.HitCount++;
            await _context.SaveChangesAsync();
            return (cached.ImageBlob, cached.ContentType);
        }

        // Cache miss — fetch from external URL and store blob
        HttpResponseMessage response;
        try
        {
            response = await _httpClient.GetAsync(imageUrl);
            if (!response.IsSuccessStatusCode) return null;
        }
        catch
        {
            return null;
        }

        var blob = await response.Content.ReadAsByteArrayAsync();
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/png";

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

        await _context.SaveChangesAsync();
        return (blob, contentType);
    }
}

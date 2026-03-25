// Shared image storage across all users prevents duplication: URL is the natural key
public class ImageCache
{
    public string ImageUrl { get; set; } = string.Empty; // PK: Full URL from API

    public byte[]? ImageBlob { get; set; } // Binary image data

    public string ContentType { get; set; } = string.Empty; // image/jpeg, image/png, etc.

    public long ImageSizeBytes { get; set; } = 0;

    public DateTime CachedAt { get; set; } = DateTime.UtcNow;

    public DateTime AccessedAt { get; set; } = DateTime.UtcNow; // LRU tracking for eviction

    public int HitCount { get; set; } = 0;

    public DateTime ExpiresAt { get; set; } // TTL-based eviction (60 days typical)
}

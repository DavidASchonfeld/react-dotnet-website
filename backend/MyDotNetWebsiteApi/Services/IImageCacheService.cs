// Shared image blob storage: deduplicates image fetches across all users via URL-as-key lookup
public interface IImageCacheService
{
    // Returns (blob, contentType) from ImageCache or fetches from URL and stores it.
    Task<(byte[] blob, string contentType)?> GetOrFetchImageAsync(string imageUrl);
}

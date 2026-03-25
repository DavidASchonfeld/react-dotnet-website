// Shared image blob storage: deduplicates image fetches across all users via URL-as-key lookup
public interface IImageCacheService
{
    // Returns (blob, contentType) from ImageCache or fetches from URL and stores it.
    Task<(byte[] blob, string contentType)?> GetOrFetchImageAsync(string imageUrl);

    // Sends a HEAD request to check if the URL is reachable (2xx response).
    // Used to validate image URLs from 3rd-party APIs before caching or persisting them.
    Task<bool> IsImageReachableAsync(string url);
}

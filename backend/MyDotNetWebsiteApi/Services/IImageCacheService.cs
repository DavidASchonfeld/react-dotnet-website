// Shared image blob storage: deduplicates image fetches across all users via URL-as-key lookup
public interface IImageCacheService
{
    // Returns (blob, contentType) from ImageCache (keyed by imageUrl) or fetches from that URL and stores it.
    Task<(byte[] blob, string contentType)?> GetOrFetchImageAsync(string imageUrl);

    // Overload that separates the cache key from the actual fetch URL — used for pseudo-URL schemes.
    Task<(byte[] blob, string contentType)?> GetOrFetchImageAsync(string cacheKey, string fetchUrl);

    // Returns true if the image URL responds with a success status code; false otherwise.
    Task<bool> IsImageReachableAsync(string imageUrl);

    // Deletes invalid ImageCache entries (relative/placeholder URLs or null blobs) and clears
    // non-http MediaApiRef thumbnail URLs. Returns counts for each step.
    Task<(int deletedCacheEntries, int nulledPlaceholderThumbnails)> DeletePlaceholderEntriesAsync();

    // Removes all poster-api:// blobs from ImageCache and resets affected MediaApiRef.PosterUrl → ThumbnailUrl.
    Task<(int deletedCacheEntries, int resetPosterUrls)> DumpBigImagesAsync();
}

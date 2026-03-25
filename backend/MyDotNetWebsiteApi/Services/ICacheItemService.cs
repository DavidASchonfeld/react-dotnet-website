public interface ICacheItemService
{
    // Look up a fresh (non-expired) cache entry by discriminators + sorted query params.
    Task<CacheItem?> GetFreshAsync(string apiSource, string queryType, string mediaType, SortedDictionary<string, string?> queryParams);

    // Insert or update a cache entry; resets ExpiresAt and updates HitCount on hit.
    Task UpsertAsync(string apiSource, string queryType, string mediaType, SortedDictionary<string, string?> queryParams, string responseJson, int ttlDays);
}

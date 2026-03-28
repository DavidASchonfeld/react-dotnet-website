using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

// Unified cache layer: all API responses go through here regardless of query type or API source
public class CacheItemService : ICacheItemService
{
    private readonly AppDbContext _context;

    public CacheItemService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CacheItem?> GetFreshAsync(string apiSource, string queryType, string mediaType, SortedDictionary<string, string?> queryParams)
    {
        var hash = ComputeHash(queryParams);

        var item = await _context.CacheItems
            .FirstOrDefaultAsync(c =>
                c.ApiSource == apiSource &&
                c.QueryType == queryType &&
                c.MediaType == mediaType &&
                c.QueryParametersHash == hash &&
                c.Status == "Fresh" &&
                c.ExpiresAt > DateTime.UtcNow);

        if (item != null)
        {
            // Update LRU tracking on cache hit
            // LRU stands for "Least Recently Used"
            item.LastAccessedAt = DateTime.UtcNow;
            item.HitCount++;
            await _context.SaveChangesAsync();
        }

        return item;
    }

    public async Task UpsertAsync(string apiSource, string queryType, string mediaType, SortedDictionary<string, string?> queryParams, string responseJson, int ttlDays)
    {
        var paramsJson = JsonSerializer.Serialize(queryParams);
        var hash = ComputeHash(queryParams);

        var existing = await _context.CacheItems
            .FirstOrDefaultAsync(c =>
                c.ApiSource == apiSource &&
                c.QueryType == queryType &&
                c.MediaType == mediaType &&
                c.QueryParametersHash == hash);

        if (existing != null)
        {
            // Refresh existing entry: reset TTL and update response
            existing.ResponseJson = responseJson;
            existing.ExpiresAt = DateTime.UtcNow.AddDays(ttlDays);
            existing.LastAccessedAt = DateTime.UtcNow;
            existing.Status = "Fresh";
            existing.HitCount++;
        }
        else
        {
            // Insert new cache entry with sorted params JSON for auditability
            _context.CacheItems.Add(new CacheItem
            {
                ApiSource = apiSource,
                QueryType = queryType,
                MediaType = mediaType,
                QueryParametersJson = paramsJson,
                QueryParametersHash = hash,
                ResponseJson = responseJson,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(ttlDays),
                LastAccessedAt = DateTime.UtcNow,
                Status = "Fresh",
            });
        }

        await _context.SaveChangesAsync();
    }

    // Bulk-delete all CacheItem rows; returns the number of rows deleted.
    public async Task<int> ClearAllAsync()
    {
        return await _context.CacheItems.ExecuteDeleteAsync();
    }

    // Sorted-key JSON → SHA256 hex -> deterministic regardless of insertion order
    private static string ComputeHash(SortedDictionary<string, string?> queryParams)
    {
        var json = JsonSerializer.Serialize(queryParams);
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(json));
        return Convert.ToHexString(bytes).ToLower();
    }
}

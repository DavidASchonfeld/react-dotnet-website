using Microsoft.EntityFrameworkCore;

// TTL eviction: delete expired CacheItems and ImageCaches nightly; LRU fallback for ImageCache size cap
// TTL stands for "Time to Live" aka CacheItems have expiration dates and this script is about cleaning out expired CacheItems
public class CacheEvictionService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CacheEvictionService> _logger;

    // This automatic nightly cache service is initialized/starts running
    // via being set up in this line in "backend/MyDotNetWebsiteApi/Program.cs"
    // This is the line in Program.cs that starts up CacheEvictionService: builder.Services.AddHostedService<CacheEvictionService>(); // Background eviction runs nightly: TTL + LRU for CacheItem and ImageCache
    
    // For LRU storage limit, that is stored in backend/MyDotNetWebsiteApi/AppConstant.cs's variable ImageCacheMaxSizeBytes
    public CacheEvictionService(IServiceScopeFactory scopeFactory, ILogger<CacheEvictionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // stoppingToken automatically is passed in via C# since this class is called as a BackgroundService
        // it is when the C# system shuts off this BackgroundService

        // Wait 1 minute after startup before first eviction run (avoids contention at boot)
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await RunEvictionAsync();
            // Run nightly: eviction is low-priority and cache data is already safe to delete
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task RunEvictionAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await EvictExpiredCacheItemsAsync(db);
        await EvictExpiredImageCachesAsync(db);
        await EvictLruImageCachesAsync(db);
    }

    private async Task EvictExpiredCacheItemsAsync(AppDbContext db)
    {
        // Delete CacheItems whose TTL has passed
        var deleted = await db.CacheItems
            .Where(c => c.ExpiresAt < DateTime.UtcNow)
            .ExecuteDeleteAsync();

        if (deleted > 0)
            _logger.LogInformation("Cache eviction: deleted {Count} expired CacheItems.", deleted);
    }

    private async Task EvictExpiredImageCachesAsync(AppDbContext db)
    {
        // Delete ImageCaches whose TTL has passed
        var deleted = await db.ImageCaches
            .Where(i => i.ExpiresAt < DateTime.UtcNow)
            .ExecuteDeleteAsync();

        if (deleted > 0)
            _logger.LogInformation("Cache eviction: deleted {Count} expired ImageCaches.", deleted);
    }

    private async Task EvictLruImageCachesAsync(AppDbContext db)
    {
        // LRU fallback: if total ImageCache size exceeds cap, evict oldest-accessed entries first
        var totalSize = await db.ImageCaches.SumAsync(i => i.ImageSizeBytes);
        if (totalSize <= AppConstants.ImageCacheMaxSizeBytes) return;

        var excess = totalSize - AppConstants.ImageCacheMaxSizeBytes;
        var oldest = await db.ImageCaches
            .OrderBy(i => i.AccessedAt)
            .ToListAsync();

        long freed = 0;
        var toDelete = new List<ImageCache>();
        foreach (var entry in oldest)
        {
            if (freed >= excess) break;
            toDelete.Add(entry);
            freed += entry.ImageSizeBytes;
        }

        if (toDelete.Count > 0)
        {
            db.ImageCaches.RemoveRange(toDelete);
            await db.SaveChangesAsync();
            _logger.LogInformation("Cache eviction: LRU removed {Count} ImageCache entries ({Freed} bytes).", toDelete.Count, freed);
        }
    }
}

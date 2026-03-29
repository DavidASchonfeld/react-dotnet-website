// Strongly-typed binding for the "CacheSettings" section in appsettings.json.
// Injected via IOptions<CacheSettings> into services that need TTL or size-cap values.
// Defaults mirror the previously hardcoded AppConstants values.
public class CacheSettings
{
    // How many days before a GetById (detail) cache entry expires.
    public int GetByIdTtlDays { get; set; } = 60;

    // How many days before a Search cache entry expires (shorter since search results change more often).
    public int SearchTtlDays { get; set; } = 7;

    // How many days before a cached image expires.
    public int ImageTtlDays { get; set; } = 60;

    // Maximum total ImageCache size in megabytes; LRU eviction triggers when this is exceeded.
    public int ImageMaxSizeMb { get; set; } = 500;

    // Computed bytes value used by eviction logic — derived from ImageMaxSizeMb.
    public long ImageMaxSizeBytes => (long)ImageMaxSizeMb * 1024 * 1024;

    // How many days since DetailsFetchedAt before the UI shows a "stale" hint.
    public int DetailsStaleDays { get; set; } = 30;
}

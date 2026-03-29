// Singleton settings row (Id is always 1) for runtime-togglable global feature flags.
// Seeded via HasData in AppDbContext — never insert a second row.
public class AppGlobalSettings
{
    public int Id { get; set; }

    // When false, non-search detail-fetch caching is disabled globally for all APIs.
    // Name refers to the old NonSearchQueryCache table; both now use the unified CacheItem table.
    public bool UseNonSearchQueryCache { get; set; } = true;

    // When false, search-result caching is disabled globally for all APIs.
    // Name refers to the old SearchQueryCache table; both now use the unified CacheItem table.
    public bool UseSearchQueryCache { get; set; } = true;
}

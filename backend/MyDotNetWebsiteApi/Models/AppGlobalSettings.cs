// Singleton settings row (Id is always 1) for runtime-togglable global feature flags.
// Seeded via HasData in AppDbContext — never insert a second row.
public class AppGlobalSettings
{
    public int Id { get; set; }

    // When false, non-search detail-fetch caching is disabled globally for all APIs.
    // Per-API UseNonSearchQueryCache is only checked when this is true.
    public bool UseNonSearchQueryCache { get; set; } = true;
}

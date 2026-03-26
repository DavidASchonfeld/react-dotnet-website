public class AppGlobalSettingsDto
{
    // When false, non-search detail-fetch caching is disabled globally for all APIs.
    public bool UseNonSearchQueryCache { get; set; }

    // When false, search-result caching is disabled globally for all APIs.
    public bool UseSearchQueryCache { get; set; }
}

// Cache entry for a single external-API detail fetch, keyed by the API's own item ID.
public class NonSearchQueryCache
{
    public int Id { get; set; }

    // The external API's native identifier for the cached item (e.g. IMDB ID "tt0111161")
    public string ExternalItemId { get; set; } = string.Empty;

    public int ExternalApiSourceId { get; set; }

    // JSON-serialized ExternalApiSearchResult
    public string ResultsJson { get; set; } = string.Empty;

    public DateTime CachedAt { get; set; }

    // Navigation property
    public ExternalApiSource ExternalApiSource { get; set; } = null!;
}

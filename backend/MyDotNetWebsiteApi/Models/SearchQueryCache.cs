public class SearchQueryCache
{
    public int Id { get; set; }

    // Normalized query string (trimmed + lowercased) used as the cache key
    public string NormalizedQuery { get; set; } = string.Empty;

    public int ExternalApiSourceId { get; set; }
    public int Page { get; set; }
    public string? Subtype { get; set; }

    // JSON-serialized List<ExternalApiSearchResult>
    public string ResultsJson { get; set; } = string.Empty;

    public DateTime CachedAt { get; set; }

    // Navigation property
    public ExternalApiSource ExternalApiSource { get; set; } = null!;
}

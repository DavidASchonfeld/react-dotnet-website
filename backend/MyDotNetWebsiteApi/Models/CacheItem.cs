// Unified cache for all API responses: discriminators enable flexible query types without schema changes
public class CacheItem
{
    public int Id { get; set; }

    // Discriminators: what this cache represents
    public string ApiSource { get; set; } = string.Empty; // TMDB, OMDb, IGDB, GoogleBooks, Spotify, etc.
    public string QueryType { get; set; } = string.Empty; // Search, GetById, GetByISBN, GetByActor, etc.
    public string MediaType { get; set; } = string.Empty; // Movie, TV, Book, Music, Game, etc.

    // Query parameters: what was asked
    public string QueryParametersJson { get; set; } = string.Empty; // {"search_query": "dune"} or {"media_id": "tt0084787"}
    public string QueryParametersHash { get; set; } = string.Empty; // Hash for UNIQUE index

    // Response data
    public string ResponseJson { get; set; } = string.Empty; // Raw API response
    public int ResponseSchemaVersion { get; set; } = 1; // Track API evolution

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } // TTL-based eviction
    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;
    public int HitCount { get; set; } = 0;
    public string Status { get; set; } = "Fresh"; // Fresh, Stale, Error
    public string? ErrorMessage { get; set; }
}

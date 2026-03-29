// Persistent user data: minimal identifying info for media items users save to lists/tags
public class MediaApiRef
{
    public int Id { get; set; }

    // Basic identifying information
    public string Name { get; set; } = string.Empty; // Title/name from external API
    public int MediaTypeId { get; set; }
    // API-specific subtype (e.g. "movie"/"series"/"episode" for OMDB, "game"/"publisher"/"developer" for RAWG).
    // Valid values per API are defined by API_SUBTYPES in frontend/src/constants/index.ts — no server-side enum enforces this.
    public string? Subtype { get; set; }

    // Creator info (director, author, etc.) — allows grouping without detail fetch
    public string? CreatorName { get; set; }

    public DateTime? PublishedDate { get; set; }

    // Which external API this ref was sourced from
    public int ExternalApiSourceId { get; set; }

    // Item's ID within external API (e.g. OMDB's "tt1234567", RAWG's "12345")
    // Combined with ExternalApiSourceId, this uniquely identifies the item
    public string ExternalId { get; set; } = string.Empty;

    public DateTime DateAdded { get; set; } = DateTime.UtcNow;

    // Image URLs (blob storage deferred to ImageCache)
    public string? ThumbnailUrl { get; set; }  // small image from search results
    public string? PosterUrl { get; set; }     // full-size image from detail fetch

    // Optional location/origin info
    public string? Country { get; set; }

    // Staleness detection: when details were last refreshed from API
    public DateTime? DetailsFetchedAt { get; set; }

    // Navigation properties
    public MediaType MediaType { get; set; } = null!;
    public ExternalApiSource ApiSource { get; set; } = null!;

    public ICollection<LinkMediaApiRefToMediaList> ListAppearances { get; set; } = new List<LinkMediaApiRefToMediaList>();
    public ICollection<LinkCustomTagToMediaApiRef> Tags { get; set; } = new List<LinkCustomTagToMediaApiRef>();
}


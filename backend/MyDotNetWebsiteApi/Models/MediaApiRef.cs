// Persistent user data: minimal identifying info for media items users save to lists/tags
public class MediaApiRef
{
    public int Id { get; set; }

    // Basic identifying information
    public string Name { get; set; } = string.Empty; // Title/name from external API
    public int MediaTypeId { get; set; }

    // Creator info (director, author, etc.) — allows grouping without detail fetch
    public string? CreatorName { get; set; }

    public DateTime? PublishedDate { get; set; }

    // Which external API this ref was sourced from
    public int ExternalApiSourceId { get; set; }

    // Item's ID within external API (e.g. OMDB's "tt1234567", RAWG's "12345")
    // Combined with ExternalApiSourceId, this uniquely identifies the item
    public string ExternalId { get; set; } = string.Empty;

    public DateTime DateAdded { get; set; } = DateTime.UtcNow;

    // Poster image URL only (blob storage deferred to ImageCache)
    public string? Poster { get; set; }

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


// Represents a single result returned by an external media API search.
// All adapters must map their API-specific response into this shape.
public class ExternalApiSearchResult
{
    // The item's ID in the external API (e.g. OMDB: "tt1234567", RAWG: "12345")
    public string ExternalId {get; set;} = string.Empty;

    public string Name {get; set;} = string.Empty;

    // Director, author, developer, etc. — whatever the API provides; null if unavailable
    public string? CreatorName {get; set;}

    public DateTime? PublishedDate {get; set;}

    // Optional thumbnail URL for display in the search results UI
    public string? ThumbnailUrl {get; set;}
}

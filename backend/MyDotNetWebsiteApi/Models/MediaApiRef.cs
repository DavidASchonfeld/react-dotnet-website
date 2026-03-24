public class MediaApiRef
{
    ///// Real SQL Columns
    public int Id {get; set;}

    // Cached from external API so this record survives if the API goes offline
    public string Name {get; set;} = string.Empty;
    public int MediaTypeId {get; set;}

    // Denormalized creator string (e.g. director name, author name) — sourced from API
    public string? CreatorName {get; set;}

    public DateTime? PublishedDate {get; set;}

    // Which external API this ref was sourced from
    public int ExternalApiSourceId {get; set;}

    // The item's ID within the external API (e.g. OMDB's "tt1234567", RAWG's "12345")
    // Combined with ExternalApiSourceId, this uniquely identifies the item
    public string ExternalId {get; set;} = string.Empty;

    public DateTime DateAdded {get; set;} = DateTime.UtcNow;

    // Detailed metadata from external API (cached)
    public string? Poster {get; set;}
    public string? Plot {get; set;}
    public string? Runtime {get; set;}
    public string? Country {get; set;}
    public string? Genres {get; set;}
    public string? Rated {get; set;}
    public DateTime? DetailsFetchedAt {get; set;}


    ///// C# Only - They do not exist in the SQL Database

    // We already have MediaTypeId and ExternalApiSourceId in the Real SQL Columns section above
    public MediaType MediaType {get; set;} = null!;
    public ExternalApiSource ApiSource {get; set;} = null!;

    public ICollection<LinkMediaApiRefToMediaList> ListAppearances {get; set;} = new List<LinkMediaApiRefToMediaList>();
    public ICollection<LinkCustomTagToMediaApiRef> Tags {get; set;} = new List<LinkCustomTagToMediaApiRef>();


}

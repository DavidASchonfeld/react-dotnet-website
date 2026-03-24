public class MediaApiRefDetailDto
{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public int MediaTypeId {get; set;}
    public string? CreatorName {get; set;}
    public DateTime? PublishedDate {get; set;}
    public int ExternalApiSourceId {get; set;}
    public string ApiSourceName {get; set;} = string.Empty;
    public string ExternalId {get; set;} = string.Empty;
    public DateTime DateAdded {get; set;}
    public string? ApiHomepageUrl {get; set;}

    // Detailed metadata from external API (cached)
    public string? Poster {get; set;}
    public string? Plot {get; set;}
    public string? Runtime {get; set;}
    public string? Country {get; set;}
    public string? Genres {get; set;}
    public string? Rated {get; set;}
}

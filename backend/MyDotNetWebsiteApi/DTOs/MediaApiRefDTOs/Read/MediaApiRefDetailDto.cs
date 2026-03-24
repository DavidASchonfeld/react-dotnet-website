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
}

public class MediaApiRefSummaryDto
{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public int MediaTypeId {get; set;}
    public string? CreatorName {get; set;}
    public DateTime? PublishedDate {get; set;}
    public string ExternalId {get; set;} = string.Empty;
    public string ApiSourceName {get; set;} = string.Empty;
    public string? ThumbnailUrl {get; set;}
}

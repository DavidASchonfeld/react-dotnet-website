// Sent by the frontend after a user picks an item from the external API search results.
// The backend uses ExternalApiSourceId + ExternalId as a unique key to find-or-create the record.
public class FindOrCreateMediaApiRefDto
{
    public int ExternalApiSourceId {get; set;}
    public string ExternalId {get; set;} = string.Empty;
    public string Name {get; set;} = string.Empty;
    public int MediaTypeId {get; set;}
    public string? CreatorName {get; set;}
    public DateTime? PublishedDate {get; set;}
}

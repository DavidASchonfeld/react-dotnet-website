public class MediaItemSummaryDto
{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public int MediaTypeId {get; set;}
    public string MediaTypeName {get; set;} = string.Empty;  // I'm including it here, though if the front-end needs more details about the specific media type, it will use the mediaTypeId to do so.
}
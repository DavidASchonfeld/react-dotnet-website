public class MediaListDetailDto
{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public string? SubmittedById {get; set;}
    public string? SubmittedByUserName {get; set;}
    
    public VisibilityStatus VisibilityStatus {get; set;}
    public bool CanEdit {get; set;}

    public ICollection<MediaItemSummaryDto> ListContent {get; set;} = new List<MediaItemSummaryDto>();
}
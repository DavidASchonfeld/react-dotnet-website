public class MediaListDetailDto
{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public string? CreatedById {get; set;}
    public string? CreatedByUserName {get; set;}

    public VisibilityStatus VisibilityStatus {get; set;}
    public bool CanEdit {get; set;}
    public MediaListCategory Category {get; set;} // Drives UI badges and determines whether the list can be deleted

    public ICollection<MediaApiRefSummaryDto> ListContent {get; set;} = new List<MediaApiRefSummaryDto>();
}
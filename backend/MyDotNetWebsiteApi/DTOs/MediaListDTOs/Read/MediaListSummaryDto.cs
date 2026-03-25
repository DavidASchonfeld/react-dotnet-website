public class MediaListSummaryDto
{
    public int Id {get; set;}
    public string? SubmittedById {get; set;}
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public VisibilityStatus VisibilityStatus {get; set;}
    public int ItemCount {get; set;}
    public bool CanEdit {get; set;}
    public bool IsDefault {get; set;}
}
public class MediaListSummaryDto
{
    public int Id {get; set;}
    public string? CreatedById {get; set;}
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public VisibilityStatus VisibilityStatus {get; set;}
    public int ItemCount {get; set;}
    public bool CanEdit {get; set;}
    public MediaListCategory Category {get; set;} // Drives UI badges and determines whether the list can be deleted
    public List<string> PreviewThumbnailUrls { get; set; } = new(); // Up to 4 thumbnail URLs from first items (for collage display)
}
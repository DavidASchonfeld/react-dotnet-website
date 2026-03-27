public class CustomTagSummaryDto
{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public VisibilityStatus VisibilityStatus {get; set;}
    public string? CreatedById {get; set;}
    public bool CanEdit {get; set;}      // Owner can edit name/description and apply/remove the tag
}

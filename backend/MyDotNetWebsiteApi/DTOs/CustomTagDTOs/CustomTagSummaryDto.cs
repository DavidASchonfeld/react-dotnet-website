public class CustomTagSummaryDto
{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public VisibilityStatus VisibilityStatus {get; set;}
    public string? CreatedById {get; set;}
}

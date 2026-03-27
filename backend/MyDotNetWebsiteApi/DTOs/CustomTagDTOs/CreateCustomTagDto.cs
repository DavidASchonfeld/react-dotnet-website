public class CreateCustomTagDto
{
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public VisibilityStatus VisibilityStatus {get; set;} = VisibilityStatus.Private;
}

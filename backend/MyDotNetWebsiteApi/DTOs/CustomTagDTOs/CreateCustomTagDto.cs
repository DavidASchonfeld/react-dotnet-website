public class CreateCustomTagDto
{
    public string Name {get; set;} = string.Empty;
    public VisibilityStatus VisibilityStatus {get; set;} = VisibilityStatus.Private;
}

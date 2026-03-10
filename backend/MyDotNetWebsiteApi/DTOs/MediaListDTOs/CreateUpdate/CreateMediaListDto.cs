public class CreateMediaListDto
{
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}

    
    // VisibilityStatus is Optional.
    // If it not passed, then the list, by default, will be set to Private.
    public VisibilityStatus? VisibilityStatus {get; set;}
}
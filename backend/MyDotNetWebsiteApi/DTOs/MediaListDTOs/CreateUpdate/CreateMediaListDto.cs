using System.ComponentModel.DataAnnotations;

public class CreateMediaListDto
{
    [Required]
    [MaxLength(200)]
    public string Name {get; set;} = string.Empty;

    [MaxLength(1000)]
    public string? Description {get; set;}


    // VisibilityStatus is Optional.
    // If it not passed, then the list, by default, will be set to Private.
    public VisibilityStatus? VisibilityStatus {get; set;}
}

using System.ComponentModel.DataAnnotations;

public class UpdateMediaListNotListContentDto
{
    // Id NOT included here (aka it is commented out) because it will be passed via the URL when I send over this DTO
    // public int Id {get; set;}

    // Patch (Partial Update), so all fields optional
    [MaxLength(200)]
    public string? Name {get; set;}

    [MaxLength(1000)]
    public string? Description {get; set;}

    public VisibilityStatus? VisibilityStatus {get; set;}
}

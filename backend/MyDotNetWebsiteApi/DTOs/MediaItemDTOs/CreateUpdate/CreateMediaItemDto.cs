using System.ComponentModel.DataAnnotations;

public class CreateMediaItemDto
{
    [Required]
    [MaxLength(200)]
    public string Name {get; set;} = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "A valid MediaTypeId is required.")]
    public int MediaTypeId {get; set;}

    [MaxLength(2000)]
    public string? Description {get; set; }
    // The ? means it can be Null (aka empty) if needed


    // Reminder: Published is about when the actual MediaItem was published (Ex: "Finding Nemo" was published in 2003)
    public DateTime? PublishedDateTime {get; set; }
}

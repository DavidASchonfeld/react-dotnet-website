using System.ComponentModel.DataAnnotations;

public class UpdateUsernameDto
{
    [Required]
    [MaxLength(100)]
    public string NewUserName { get; set; } = string.Empty;
}

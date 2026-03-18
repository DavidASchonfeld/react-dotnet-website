using System.ComponentModel.DataAnnotations;

public class RegisterUserDto
{
    [Required]
    [MaxLength(100)]
    public string UserName {get; set;} = string.Empty;

    [Required]
    [EmailAddress]
    public string Email {get; set;} = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password {get; set;} = string.Empty;
}

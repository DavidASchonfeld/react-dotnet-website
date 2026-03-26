using System.ComponentModel.DataAnnotations;

// DTO for PATCH /api/user/me/theme — null clears the saved theme preference.
public class UpdateUserThemeDto
{
    [MaxLength(50)]  // guards against oversized input
    public string? Theme { get; set; }
}

using System.ComponentModel.DataAnnotations;

// DTO for PATCH /api/user/me/modifier — null clears the saved modifier preference.
public class UpdateUserModifierDto
{
    [MaxLength(30)]  // guards against oversized input
    public string? Modifier { get; set; }
}

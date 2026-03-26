using Microsoft.AspNetCore.Identity;

public class AppUser : IdentityUser
{
    // This class extends the built-in C#'s IdentityUser class
    // which handles user/passwords (including emails, phone numbers etc.)

    // By extending IdentityUser, this object gets te following
    // fields in the SQL table:
    // Id (string/GUID), UserName, PasswordHash
    // PhoneNumber, Email, EmailConfirmed and more

    // Real SQL Columns -- More Additions
    public DateTime CreatedAt {get; set; } = DateTime.UtcNow;

    // Role/Level
    public UserRoleLevel RoleLevel {get; set;} = UserRoleLevel.Basic;

    // Refresh token stored server-side so it can be invalidated on logout or rotation.
    // Null means no active refresh session for this user.
    public string? RefreshToken { get; set; }

    // Expiry stored server-side so the backend can reject a token that arrived after its window,
    // even if the cookie is still present on the client.
    public DateTime? RefreshTokenExpiry { get; set; }

    // User's selected UI theme; null means use app default. Stored as the Theme string key.
    public string? PreferredTheme { get; set; }

    // C# Only (does not exist in the SQL database)
    // Navigation Properties to your own tables
    public ICollection<MediaList> Lists {get; set; } = new List<MediaList>();

}
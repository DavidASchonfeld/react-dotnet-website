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

    // C# Only (does not exist in the SQL database)
    // Navigation Properties to your own tables
    public ICollection<MediaList> Lists {get; set; } = new List<MediaList>();

}
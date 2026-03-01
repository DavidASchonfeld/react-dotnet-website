using Microsoft.AspNetCore.Identity;

public class AppUser : IdentityUser
{
    // this class extends the built-in C#'s IdentityUser class
    // which handles user/passwords (including emails, phone numbers etc.)


    public DateTime CreatedAt {get; set; } = DateTime.UtcNow;

    // Navigation Properties to your own tables
    public ICollection<MediaList> Lists {get; set; } = new List<MediaList>();

}
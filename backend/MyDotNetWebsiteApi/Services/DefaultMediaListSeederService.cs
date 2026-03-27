using Microsoft.EntityFrameworkCore;

public static class DefaultMediaListSeederService
{
    // The 4 mutually exclusive reading status lists seeded for every user
    private static readonly string[] ReadingStatusListNames =
        ["Want to Read", "Currently Reading", "Read", "Did Not Finish"];

    // The standalone library list seeded for every user (not mutually exclusive)
    private static readonly string LibraryListName = "My Library";

    // Called at startup to ensure all existing users have their default lists
    public static async Task SeedDefaultListsForAllUsersAsync(AppDbContext db, ILogger logger)
    {
        var users = await db.Users.ToListAsync();
        foreach (var user in users)
            await SeedDefaultListsForUserAsync(db, user);
        await db.SaveChangesAsync();
        logger.LogInformation("Default MediaList seeding complete.");
    }

    // Called at registration for the newly created user.
    // Does NOT call SaveChangesAsync — the caller is responsible for flushing.
    public static async Task SeedDefaultListsForUserAsync(AppDbContext db, AppUser user)
    {
        // Fetch all existing protected list names for this user in one query
        var existingProtectedNames = await db.MediaLists
            .Where(l => l.SubmittedById == user.Id && l.Category != MediaListCategory.Standard)
            .Select(l => l.Name)
            .ToListAsync();

        // Seed the ReadingStatus lists if they don't already exist
        foreach (var name in ReadingStatusListNames)
        {
            if (existingProtectedNames.Contains(name)) continue;
            db.MediaLists.Add(new MediaList
            {
                Name = name,
                Category = MediaListCategory.ReadingStatus, // Mutually exclusive per-user status tracker
                SubmittedById = user.Id,
                VisibilityStatus = VisibilityStatus.Private,
                DateSubmitted = DateTime.UtcNow
            });
        }

        // Seed the Library list if it doesn't already exist
        if (!existingProtectedNames.Contains(LibraryListName))
        {
            db.MediaLists.Add(new MediaList
            {
                Name = LibraryListName,
                Category = MediaListCategory.Library, // Standalone protected list, not mutually exclusive
                SubmittedById = user.Id,
                VisibilityStatus = VisibilityStatus.Private,
                DateSubmitted = DateTime.UtcNow
            });
        }
    }
}

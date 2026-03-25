using Microsoft.EntityFrameworkCore;

public static class DefaultMediaListSeederService
{
    private static readonly string[] DefaultListNames =
        ["Want to Read", "Currently Reading", "Read", "Did Not Finish", "My Library"];

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
        var existingDefaultNames = await db.MediaLists
            .Where(l => l.SubmittedById == user.Id && l.IsDefault)
            .Select(l => l.Name)
            .ToListAsync();

        foreach (var name in DefaultListNames)
        {
            if (existingDefaultNames.Contains(name)) continue;
            db.MediaLists.Add(new MediaList
            {
                Name = name,
                IsDefault = true,
                SubmittedById = user.Id,
                VisibilityStatus = VisibilityStatus.Private,
                DateSubmitted = DateTime.UtcNow
            });
        }
    }
}

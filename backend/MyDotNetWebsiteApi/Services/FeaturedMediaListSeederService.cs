using Microsoft.EntityFrameworkCore;

public static class FeaturedMediaListSeederService
{
    public static async Task SeedFeaturedListsAsync(AppDbContext db, ILogger logger)
    {
        // Seed the "Home Page" featured list if it doesn't exist yet
        bool exists = await db.MediaLists.AnyAsync(l => l.Category == MediaListCategory.Featured && l.Name == "Home Page");
        if (!exists)
        {
            db.MediaLists.Add(new MediaList
            {
                Name = "Home Page",
                Category = MediaListCategory.Featured, // Admin-owned, site-wide — contents shown on the front page
                SubmittedById = null,
                VisibilityStatus = VisibilityStatus.Public,
                DateSubmitted = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }
        logger.LogInformation("Featured MediaList seeding complete.");
    }
}

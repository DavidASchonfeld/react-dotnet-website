using Microsoft.EntityFrameworkCore;

public static class FeaturedMediaListSeederService
{
    public static async Task SeedFeaturedListsAsync(AppDbContext db, ILogger logger)
    {
        bool exists = await db.MediaLists.AnyAsync(l => l.IsFeatured && l.Name == "Home Page");
        if (!exists)
        {
            db.MediaLists.Add(new MediaList
            {
                Name = "Home Page",
                IsFeatured = true,
                SubmittedById = null,
                VisibilityStatus = VisibilityStatus.Public,
                DateSubmitted = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }
        logger.LogInformation("Featured MediaList seeding complete.");
    }
}

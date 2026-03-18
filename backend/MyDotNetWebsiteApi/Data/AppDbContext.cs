// Created Manually (not generated with Vite) on March 2, 2026

using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : IdentityDbContext<AppUser>
{
    // Link my created AppUser.cs model to C#'s built-in user amangement system
    // and tells it that AppUser will represent users

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        // The  " : base(options)" means to pass in the inputted parameter to my parent class

        // This method is empty since we do not need anything here.
        // This method is still required because it needs to expose
        // that constructor to be publicly called and then tell it
        // to pass the parameters to that more hidden constructor
        // in the parent class
    }




    // Model Registration

    // Note: Here, we are creating names of the actual SQL Tables
    // The .cs Model files will be object types.
    // Here, the variable names will be the tables that we will query to/from.



    // AppUser:  we are not listing it, since IdentityDbContext<AppUser> above takes care of AppUser
    public DbSet<Creator> Creators {get; set;}
    // Enums: We do not create a DbSet for enums.

    public DbSet<Franchise> Franchises {get; set;}
    public DbSet<Genre> Genres {get; set;}

    // Link Tables
    public DbSet<LinkCreatorToMediaItem> LinkCreatorToMediaItemTable {get; set;}
    public DbSet<LinkMediaItemToFranchise> LinkMediaItemToFranchiseTable {get; set;}
    public DbSet<LinkMediaItemToGenre> LinkMediaItemToGenreTable {get; set;}
    public DbSet<LinkMediaItemToMediaList> LinkMediaItemToMediaListTable {get; set;}
    public DbSet<LinkMediaItemToSeriesItem> LinkMediaItemToSeriesItemTable {get; set;}
    public DbSet<LinkPermissionsForMediaListToAppUser> LinkPermissionsForMediaListToAppUserTable {get; set;}
    public DbSet<LinkSeriesItemToFranchise> LinkSeriesItemToFranchiseTable {get; set;}

    
    public DbSet<MediaItem> MediaItems {get; set;}
    public DbSet<MediaList> MediaLists {get; set;}
    public DbSet<MediaType> MediaTypes {get; set;}
    public DbSet<SeriesItem> SeriesItems {get; set;}




    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Relationship Between Tables:

        // Cascade Delete for Link Tables

        // Restrict Deletion for Core Data (only allow deletions
        // if there are no foreign keys related to this to-be-deleted table)

        // Each Code Chunk below refers to 1 relationship between 2 items



        // In each of these files, you should have these line of code:
        // public string? SubmittedById {get; set;} <-Yes, we need the "?" to ensure that this variable can be set to null.

        // Block 1: Media Item -> AppUser (via SubmittedBy)
        modelBuilder.Entity<MediaItem>()
            .HasOne(m => m.SubmittedBy)
            // A MediaItem has 1 AppUser, and that AppUser is accessed through the SubmittedBy property.
            // Note: We arbitrarily chose "m" as the variable name to refer to for MediaItem, but could be any variable name
            // The arbitrary variable name applies to the HasForeignKey below too

            .WithMany()  // Describes the AppUser perspective: that it has relationship with many MediaItems.
            // Example: An AppUser can create many MediaItems
            .HasForeignKey(m => m.SubmittedById)  // the actual SQL column storing the AppUser's id
            .OnDelete(DeleteBehavior.SetNull); 
            // when the linked AppUser is deleted, set SubmittedById to null
            // The MediaItem survives without the user who created that item

        
        // Block 2: Creator -> AppUser (via SubmittedBy)
        modelBuilder.Entity<Creator>()
            .HasOne(m => m.SubmittedBy)
            // A Creator has 1 AppUser, and that AppUser is accessed through the SubmittedBy property.

            .WithMany()  // Describes the AppUser perspective: that it has relationship with many Creators.
            // Example: An AppUser can create many Creators
            .HasForeignKey(m => m.SubmittedById)  // the actual SQL column storing the AppUser's id
            .OnDelete(DeleteBehavior.SetNull); 
            // when the linked AppUser is deleted, set SubmittedById to null
            // The Creator survives without the user who created that item

        modelBuilder.Entity<Genre>()
            .HasOne(m => m.SubmittedBy)
            .WithMany()
            .HasForeignKey(m => m.SubmittedById)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MediaType>()
            .HasOne(m => m.SubmittedBy)
            .WithMany()
            .HasForeignKey(m => m.SubmittedById)
            .OnDelete(DeleteBehavior.SetNull);
        
        modelBuilder.Entity<SeriesItem>()
            .HasOne(m => m.SubmittedBy)
            .WithMany()
            .HasForeignKey(m => m.SubmittedById)
            .OnDelete(DeleteBehavior.SetNull);
        
        modelBuilder.Entity<Franchise>()
            .HasOne(m => m.SubmittedBy)
            .WithMany()
            .HasForeignKey(m => m.SubmittedById)
            .OnDelete(DeleteBehavior.SetNull);
        
        modelBuilder.Entity<MediaList>()
            .HasOne(m => m.SubmittedBy)
            .WithMany()
            .HasForeignKey(m => m.SubmittedById)
            .OnDelete(DeleteBehavior.SetNull);


        // Next, added this to clarify the relationship between AppUser and MediaList
        // Block: AppUSer (One) -> MediaList (Many) (through SubmittedBy Id variable)
        modelBuilder.Entity<AppUser>()
            .HasMany(u => u.Lists)  // An AppUser can have many lists.
            .WithOne(l => l.SubmittedBy) // The MediaList can only have 1 AppUser. as represented by SubmittedBy variable
            .HasForeignKey(l => l.SubmittedById); //The actual variable for this in SQL is SubmittedById


        // Cascade Deletions
        //// Means: If that item is deleted, if it has a foreign key in another table rows, those rows are atuomatically deleted
        //// For Many-To-Many Relationships,
        /////// foreign keys for objects are not stored in the corresponding other object
        /////// the foreign keys are only directly stored in the link/join tables
        /////// So for cascade deletion only deletes the row in the link/join table, not the related item(s0 in through the link/join table
        /////// Deleting a link/join row never affects the items referred to inside the link/join row 
        /// Note: Since Cascade Deletion is the default mode, we do not need to add code blocks to specify this, since it is the default mode.

        /// 
        // Right now, I'll auto-approve all submitted things.
        // In my Future_Ideas.md, I added to implement a more complcated approval system.







        // Optional (I'm not doing it) Use 2 ids as a unique id
        // in link tables, instead of giving each row its own id.


        // Seeding Data (aka manually putting in initial data):
        // Note: For seeding data, IDs must be hardcoded so, across migrations EF Core can track them

        // Media Types
        modelBuilder.Entity<MediaType>().HasData(
            // Note: You cannot use DateTime.UtcNow here since it will be a different value every time you run this file
            new MediaType { Id = 1, Name = "Movie", Icon = "🎬", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new MediaType { Id = 2, Name = "TV Show", Icon = "📺", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new MediaType { Id = 3, Name = "Book", Icon = "📘", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new MediaType { Id = 4, Name = "Video Game", Icon = "🎮", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)}
        );

        // Genres
        modelBuilder.Entity<Genre>().HasData(
            new Genre { Id = 1, Name = "Comedy", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new Genre { Id = 2, Name = "Sitcom", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new Genre { Id = 3, Name = "Action", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new Genre { Id = 4, Name = "Sci-Fi", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new Genre { Id = 5, Name = "Fantasy", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)}
        );

        // Media Items
        modelBuilder.Entity<MediaItem>().HasData(
            new MediaItem { Id = 1, Name = "Finding Nemo", MediaTypeId = 1, Description = "Disney Pixar movie about a father clownfish and his son getting separated and attempting to bring the son home.", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new MediaItem { Id = 2, Name = "The Lion King", MediaTypeId = 1, Description = "Disney Animated 1990s Musical about a lion growing up in the wild.", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new MediaItem { Id = 3, Name = "The Avengers", MediaTypeId = 1, Description = "2012 Superhero Ensemble Movie Based on Marvel Comics Superheroes", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new MediaItem { Id = 4, Name = "Super Mario 64", MediaTypeId = 4, Description = "1st 3d Platformer for Nintendo's Super Mario Franchise.", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new MediaItem { Id = 5, Name = "Star Trek", MediaTypeId = 2, Description = "1966 Sci-Fi TV Show about a crew from the US Federation exploring space.", IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)},
            new MediaItem { Id = 6, Name = "A Study in Scarlet", MediaTypeId = 3, Description = "1st Sherlock Holmes book (unless my research is incorrect). Published 1887" , IsApproved = true, DateSubmitted = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)}
        );
    }

}

// Classic Movies:
// Fantasy: Lord of the Rings
// Sci-Fi: Star-Wars: #1
// Classic: 1950s Musicals from Parents
// Gilligan's Island 
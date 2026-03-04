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



    }

}
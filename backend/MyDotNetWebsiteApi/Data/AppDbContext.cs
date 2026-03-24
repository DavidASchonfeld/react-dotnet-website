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

    public DbSet<ApiUsageRecord> ApiUsageRecords {get; set;}
    public DbSet<ExternalApiSource> ExternalApiSources {get; set;}
    public DbSet<MediaApiRef> MediaApiRefs {get; set;}
    public DbSet<CustomTag> CustomTags {get; set;}

    // Link Tables
    public DbSet<LinkCustomTagToMediaApiRef> LinkCustomTagToMediaApiRefTable {get; set;}
    public DbSet<LinkMediaApiRefToMediaList> LinkMediaApiRefToMediaListTable {get; set;}
    public DbSet<LinkPermissionsForMediaListToAppUser> LinkPermissionsForMediaListToAppUserTable {get; set;}

    public DbSet<MediaList> MediaLists {get; set;}
    public DbSet<MediaType> MediaTypes {get; set;}




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

        // Block: MediaType -> AppUser (via SubmittedBy)
        modelBuilder.Entity<MediaType>()
            .HasOne(m => m.SubmittedBy)
            .WithMany()
            .HasForeignKey(m => m.SubmittedById)
            .OnDelete(DeleteBehavior.SetNull);

        // Block: MediaList -> AppUser (via SubmittedBy)
        modelBuilder.Entity<MediaList>()
            .HasOne(m => m.SubmittedBy)
            .WithMany()
            .HasForeignKey(m => m.SubmittedById)
            .OnDelete(DeleteBehavior.SetNull);

        // Block: AppUser (One) -> MediaList (Many) (through SubmittedById variable)
        modelBuilder.Entity<AppUser>()
            .HasMany(u => u.Lists)
            .WithOne(l => l.SubmittedBy)
            .HasForeignKey(l => l.SubmittedById);

        // Block: CustomTag -> AppUser (via CreatedBy)
        modelBuilder.Entity<CustomTag>()
            .HasOne(t => t.CreatedBy)
            .WithMany()
            .HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.SetNull);

        // Block: LinkCustomTagToMediaApiRef -> AppUser (via AddedBy)
        modelBuilder.Entity<LinkCustomTagToMediaApiRef>()
            .HasOne(l => l.AddedBy)
            .WithMany()
            .HasForeignKey(l => l.AddedById)
            .OnDelete(DeleteBehavior.SetNull);

        // Block: ExternalApiSource -> MediaType (many sources can map to same media type,
        //        but only one should have IsActive = true per type)
        modelBuilder.Entity<ExternalApiSource>()
            .HasOne(s => s.MediaType)
            .WithMany()
            .HasForeignKey(s => s.MediaTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Block: MediaApiRef -> MediaType
        modelBuilder.Entity<MediaApiRef>()
            .HasOne(r => r.MediaType)
            .WithMany()
            .HasForeignKey(r => r.MediaTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Block: MediaApiRef -> ExternalApiSource
        modelBuilder.Entity<MediaApiRef>()
            .HasOne(r => r.ApiSource)
            .WithMany(s => s.MediaApiRefs)
            .HasForeignKey(r => r.ExternalApiSourceId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique index: same external item should never be stored twice
        modelBuilder.Entity<MediaApiRef>()
            .HasIndex(r => new { r.ExternalApiSourceId, r.ExternalId })
            .IsUnique();


        // Cascade Deletions
        //// Means: If that item is deleted, if it has a foreign key in another table rows, those rows are automatically deleted
        //// For Many-To-Many Relationships,
        /////// foreign keys for objects are not stored in the corresponding other object
        /////// the foreign keys are only directly stored in the link/join tables
        /////// So cascade deletion only deletes the row in the link/join table, not the related item(s) through the link/join table
        /////// Deleting a link/join row never affects the items referred to inside the link/join row
        /// Note: Since Cascade Deletion is the default mode, we do not need to add code blocks to specify this.




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

        // External API Sources — one per MediaType, all active by default
        // These are stubs; real HTTP calls are implemented in the adapter classes
        modelBuilder.Entity<ExternalApiSource>().HasData(
            new ExternalApiSource { Id = 1, ApiName = "OMDB", MediaTypeId = 1, IsActive = true },
            new ExternalApiSource { Id = 2, ApiName = "TVMaze", MediaTypeId = 2, IsActive = true },
            new ExternalApiSource { Id = 3, ApiName = "OpenLibrary", MediaTypeId = 3, IsActive = true },
            new ExternalApiSource { Id = 4, ApiName = "RAWG", MediaTypeId = 4, IsActive = true }
        );
    }

}

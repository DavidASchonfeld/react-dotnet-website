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

        // Cascade Delete Behavior





        // Optional (I'm not doing it) Use 2 ids as a unique id
        // in link tables, instead of giving each row its own id.



    }

}
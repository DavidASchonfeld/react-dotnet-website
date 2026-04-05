// Tells the `dotnet ef` migration tooling which database provider and connection string to use
// when generating migrations — so migrations always use PostgreSQL type mappings (timestamp with
// time zone, etc.) instead of SQLite types (TEXT), matching the production database.
// This file is only used at design time (dotnet ef commands) and never runs in the app itself.

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

public class AppDbContextDesignTimeFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

        // Must match appsettings.Development.json — update Password if your local PostgreSQL differs
        optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=react_dotnet_dev;Username=postgres;Password=postgres");

        return new AppDbContext(optionsBuilder.Options);
    }
}

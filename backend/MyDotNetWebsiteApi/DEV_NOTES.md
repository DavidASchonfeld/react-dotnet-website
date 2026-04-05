Notes on MediaApiRef VS CacheItem VS ImageCache

-- MediaApiRef: NOT a cache. Just an item with minimum information to identify whatever mediaItem it represents (For example: The Lightning Thief, by Rick Riordan, 2005. USA, and a URL to an image)

-- CacheItem: Caching any query result from a 3rd-Party
---- Potential (But Not All Possible) Queries
------ MediaItem Details (For example, for The Lightning Thief: genres: fantasy, adventure, and other facts)
------ SearchQuery Results (a list of MediaItems, each with basic details for them)
---- Has a TTL (Time to Leave) Eviction Policy aka Expires after Certain Amount of Time 

-- ImageCache
---- Has a TTL and a LRU Eviction Policy
------- TTL (Time to Leave): item expires after certain amount of time
------- LRU (Least Recently Used): Once the cache reaches max storage, during the nightly service (CacheEvictionService.cs), the least recently image(s) are removed to make room for more image caching.
--------- "least recently used": Every time an item is looked at, its "Last used" field is updated.

Constants/Hard Numbers for Expiration, for LRU etc.
-- Stored in backend/MyDotNetWebsiteApi/AppConstants.cs


Pre-Warming a Cache:
-- means: ahead of time, if I know that someone will need some resource, I will load it into the cache ahead of time.
-- In MediaApiRefService.cs
---- for searching for a list of media items, my backend's API endpoint for returning searh results from the 3rd party will prewarm the thumbnail images for each search result so when my front end shows the search results (each search result row (frontend/src/components/RowItemContent.tsx) asks for the backend's image cache instead of retrieving the image from the search results). So, by prewarming the cache with the thumbnail images that, originally I would just return/pass into the components directly, now I pre-warm thumbnails, the return the search results, then the front end requests the now-cached thumbnail images. So that way, when loading the searchResult list, it will still just be 1 3rd-party API request.
---- for searching for 1 specific media item, my script will prewarm its poster (aka full-sized image)


Before saving an imageUrl to the imageCache, the backend will test the imageUrl to ensure it does not receive an error. If it does, it does not save/use the imageUrl (though, if the imageUrl is attached to other non-error data, it still uses that other data.)


NuGet Package Version Gotcha (Npgsql):
-- Microsoft .NET packages (e.g. JwtBearer, EF Core) follow the exact .NET patch version (e.g. 10.0.3)
-- Third-party packages like Npgsql.EntityFrameworkCore.PostgreSQL follow their OWN release cadence
---- DO NOT assume Npgsql matches the .NET patch version — it almost certainly doesn't
---- Example: .NET 10.0.3 shipped, but Npgsql only had 10.0.1 available → `dotnet restore` fails in Docker
---- Always check https://www.nuget.org/packages/Npgsql.EntityFrameworkCore.PostgreSQL for the latest version before upgrading


Render PostgreSQL — Connection String Format Gotcha:
-- The error: "Format of the initialization string does not conform to specification starting at index 0"
---- What it means: Npgsql received a connection string it couldn't parse. "index 0" means it failed on
     the very first character — a sure sign the string is in the wrong format entirely.
---- Root cause: Render provides PostgreSQL connection strings as a URI:
       postgres://username:password@host:port/database
     But Npgsql's UseNpgsql() expects key=value format:
       Host=...;Port=...;Database=...;Username=...;Password=...
     Pasting Render's "Internal Database URL" directly into the ConnectionStrings__DefaultConnection
     env var triggers this crash every time.
-- How we detected it: The stack trace pointed to NpgsqlConnectionStringBuilder..ctor → SetupDataSource
   at startup (before the app even handled a request), and the "index 0" in the message is the
   giveaway that the string starts with an unexpected character (the 'p' in "postgres://").
-- The fix (Program.cs — ResolveConnectionString helper):
   1. Check if the string starts with postgres:// or postgresql://
   2. If yes, parse it as a URI and reconstruct it as Npgsql key=value format, adding
      SSL Mode=Require;Trust Server Certificate=true (required by Render's TLS certs)
   3. Also falls back to the DATABASE_URL env var, which Render auto-injects for linked
      PostgreSQL services — so the app works even if ConnectionStrings__DefaultConnection is unset
-- Bottom line: You can paste either format into your Render env vars and it will just work.

Render PostgreSQL — Port -1 Gotcha (follow-up to the above):
-- The error: "Couldn't set port — value ('-1') must be a non-negative and non-zero value"
---- Root cause: .NET's Uri.Port returns -1 when the URI omits an explicit port
       (e.g., postgres://user:pass@host/database with no :5432).
     The ResolveConnectionString helper was passing uri.Port directly to the connection string,
     so Npgsql received Port=-1 and rejected it.
-- The fix: Default to 5432 (PostgreSQL standard port) when uri.Port is -1:
       var port = uri.Port > 0 ? uri.Port : 5432;


Render Docker — Missing libgssapi_krb5.so.2 Gotcha:
-- The error: "Cannot load library libgssapi_krb5.so.2"
---- Root cause: Npgsql (the PostgreSQL driver) links against the Kerberos GSSAPI shared library
     at runtime even when Kerberos authentication is not used. The slim ASP.NET runtime image
     (mcr.microsoft.com/dotnet/aspnet:10.0) does not include this library by default.
---- This caused the app to crash on startup in the Docker container on Render.
-- The fix (Dockerfile — final/runtime stage):
     Added an apt-get install step right after WORKDIR /app (before COPY):
       RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*
     --no-install-recommends keeps the image small; rm -rf /var/lib/apt/lists/* removes the
     package index cache to avoid bloating the image layer.
-- Bottom line: Any time you see a "Cannot load library" crash on startup in Docker,
   check whether the missing .so is a system library not included in the slim runtime image.


Render Deploy — PendingModelChangesWarning (EF Core 10):
-- The error: System.InvalidOperationException: "The model for context 'AppDbContext' has pending changes."
---- Root cause: EF Core 10 promoted PendingModelChangesWarning from a warning to a hard exception
     by default. It fires because migrations are generated locally against SQLite, but production
     runs PostgreSQL. The two providers interpret some model configurations differently, so EF Core's
     runtime model (PostgreSQL) doesn't exactly match the snapshot baked into the latest migration
     (SQLite). Running `dotnet ef migrations add` locally produces an EMPTY migration because SQLite
     sees no changes — the mismatch only surfaces at runtime against PostgreSQL.
---- Generating a new empty migration does NOT fix this; EF Core still detects the provider diff.
-- The fix (Program.cs — AddDbContext call):
     Added ConfigureWarnings to suppress the false-positive:
       options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
     Requires: using Microsoft.EntityFrameworkCore.Diagnostics;
---- This is safe because all real schema changes ARE tracked through migrations — the warning is
     purely a SQLite-vs-PostgreSQL provider artifact with no actual missing columns or tables.
-- Bottom line: If you see this exception on a project that uses SQLite locally but PostgreSQL
   in production, suppress it via ConfigureWarnings. Do not waste time adding empty migrations.
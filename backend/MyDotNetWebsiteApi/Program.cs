using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

// JWT Libaries to Import
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;



var builder = WebApplication.CreateBuilder(args);

// Converts Render's postgres:// URI format to the key=value format Npgsql requires.
// Render injects DATABASE_URL automatically for linked PostgreSQL services; this also
// handles ConnectionStrings__DefaultConnection being set to a postgres:// URI manually.
static string? ResolveConnectionString(string? raw)
{
    // Fall back to DATABASE_URL if DefaultConnection is not configured
    raw ??= Environment.GetEnvironmentVariable("DATABASE_URL");

    if (raw is null) return null;

    // Already key=value format — no conversion needed
    if (!raw.StartsWith("postgres://") && !raw.StartsWith("postgresql://"))
        return raw;

    // Parse URI and emit Npgsql key=value connection string (SSL required by Render)
    var uri = new Uri(raw);
    var userInfo = uri.UserInfo.Split(':');
    // uri.Port returns -1 when the URI omits a port; fall back to the PostgreSQL default
    var port = uri.Port > 0 ? uri.Port : 5432;
    return $"Host={uri.Host};Port={port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
}

// Registers AppDbContext.cs as a service.
// Uses PostgreSQL for both development and production — eliminates SQLite/Postgres type-mapping mismatches.
// Dev connection string comes from appsettings.Development.json; production uses DATABASE_URL on Render.
// Every time that your controllers need database access, .NET automatically creates an AppDbContext and passes in the connection string.
var connectionString = ResolveConnectionString(builder.Configuration.GetConnectionString("DefaultConnection"));
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString);  // PostgreSQL for all environments
});

// Register ASP.NET Core Identity
// Registers the Identitiy system
// AppUser.cs: My chosen and created user model
// IdentityRole: buiilt-in role model: Handles admins vs regular user roles. 
builder.Services.AddIdentity<AppUser, IdentityRole>()

    // Tell Identity where to store users, roles, login data, etc.
    // This tells Identity to store it in EF Core, specifically AppUser (yes, the user class we created in our Models folder.)
    // Without this, Identity never work since it would have no storage hooked up.
    .AddEntityFrameworkStores<AppDbContext>()

    // Add default token providers for things like password reset emails so Microsoft's built-in password reset stuff is enabled.
    .AddDefaultTokenProviders();


////////
/// JWT (Json Web Token):


//// Pull my Secret from "dotnet user-secret" (Details just Below)
// I edited/added JWT information in the appsettings.json
// For the JWT token, for development, I did the following command
// Note: Remember to navigate into backend/MyDotNetWebsiteApi folder first.
// dotnet user-secrets init
// dotnet user-secrets set "JwtSettings:Secret" "MySecretKeyWhichMustBe32PlusCharactersLong"
// dotnet user-secrets set "ExternalApiSettings:OmdbApiKey" "<your-omdb-key>"
// dotnet user-secrets set "ExternalApiSettings:RawgApiKey" "<your-rawg-key>"
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secret = jwtSettings["Secret"];

builder.Services.AddAuthentication(options =>
{
    // Set JWT as the default authenticaiton
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, // Validate that the token was created by this website/server/backend
        ValidateAudience = true, // Validate that the token was meant for this app
        ValidateLifetime = true, // Validate that the token was not expired
        ValidateIssuerSigningKey = true, //Validate that the token signature was not tampered with
        ValidIssuer = jwtSettings["Issuer"], // Pulling this value from the appsettings.json
        ValidAudience = jwtSettings["Audience"], // Pulling this value from the appsettings.json
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secret!)
        )
    };
});




// Bind CacheSettings from appsettings.json — injected via IOptions<CacheSettings> into cache-aware services.
builder.Services.Configure<CacheSettings>(builder.Configuration.GetSection("CacheSettings"));

// Register Service Files
//  (They are in the backend/MyDotNetWebsiteApi/Services folder)
builder.Services.AddScoped<IMediaTypeService, MediaTypeService>();
builder.Services.AddScoped<IMediaListService, MediaListService>();
builder.Services.AddScoped<ICacheItemService, CacheItemService>(); // Unified cache: discriminator pattern for all query types
builder.Services.AddScoped<IMediaApiRefService, MediaApiRefService>();
builder.Services.AddScoped<ICustomTagService, CustomTagService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IApiUsageService, ApiUsageService>();
builder.Services.AddScoped<IImageCacheService, ImageCacheService>(); // Shared image blob storage prevents duplication
builder.Services.AddHostedService<CacheEvictionService>(); // Background eviction runs nightly: TTL + LRU for CacheItem and ImageCache

// Register IHttpClientFactory — required by ExternalMediaApiAdapterFactory and ImageCacheService.
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<ImageCacheService>(); // Named client for fetching external image URLs

// Register ExternalMediaApiAdapterFactory as a singleton (it's stateless)
// Singleton: This scope will be created/exist for the entire time that the website is active
//            and it will only have one instance.
builder.Services.AddSingleton<ExternalMediaApiAdapterFactory>();
builder.Services.AddAppRateLimiting(builder.Configuration);
// Every time the backend receives an HTTPRequest the DI Container wakes up a creates a "scope" for this request
//  -- new AppDbContext()
//  -- Here in this .AddScoped(), it will also create these services too.
//  -- the controllers will be created, injected with the Service
//  -- the GetMyLists() runs, queries DB, returns response
//  -- response is sent to the browser
//  -- Scope is disposed (aka destroyed):
//  ---- MediaListService.Dispose() called (if it has one)
//  ---- AppDbContext.Dispose() called <- important since it releases the DB connection
//  ---- those objects are garbage collected


// Register Controllers
// Tells app to look for controller classes to handle API requests.
// Without this, my API endpoints won't be discovered nor routed.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        // Force all incoming DateTime values to UTC — PostgreSQL rejects DateTimeKind.Unspecified
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new UtcNullableDateTimeJsonConverter());
    });

// The following line pulls from this logic from the appsettings.json:
//   "CorsSettings": {
//     "AllowedOrigin": "http://localhost:1234" (The actual port number in my appsettings.json is different)
//   }
//  "allowedOrigin" is the URL for the front-end part of the website.
// Adding CORs is about letting our backend accept HTTP Requests from the front-end of our website,
// This means that we need to tell our backend here our frontend's URL so it can recognize that requests coming from the frontend are coming from the frontend
var allowedOrigin = builder.Configuration["CorsSettings:AllowedOrigin"]!;


// Configure CORS
// Allows my app to allow requests from the listed url typed below (Example: http://localhost:5173).
// We're choosing that url because it is the frontend's URL (since our front end has a different URL than the backened)
// By default (without adding cors), browsers have Same Origin Policy: aka block requests between different origins
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", policy =>
    {

        // allowedOrigin is the frontend URL for this website (more details are right above "var allowedOrigin" line.)
       policy.WithOrigins(allowedOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod()
            // Required for HttpOnly refresh token cookies to be sent/received cross-origin.
            // Safe here because the origin is pinned to the frontend URL (not a wildcard).
            .AllowCredentials();
    });
});






// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Initialize ExternalApiRegistry with plans from configuration (appsettings.json)
var apiPlanConfig = builder.Configuration.GetSection("ApiPlanSettings").Get<ApiPlanConfiguration>();
if (apiPlanConfig == null)
{
    throw new InvalidOperationException("ApiPlanSettings not found in configuration. Check appsettings.json.");
}
ExternalApiRegistry.InitializeFromConfiguration(apiPlanConfig);
ExternalApiRegistry.ValidateAllPlans();


// Configure the HTTP request pipeline.

// NOTE: In a real production project, OpenAPI and Scalar docs would typically be restricted to
// Development only (to avoid exposing API internals). These are intentionally enabled in all
// environments here so that recruiters can explore the live API at /scalar/v1 without any local setup.
app.MapOpenApi();
app.MapScalarApiReference(); // Using Scalar
// Scalar is a visual UI that makes it easier (don't have to write CURL commands)
// to interact with my backend API endpoints
// To use this, run the backend, then,
// in my internet browser, go to:
// http://localhost:5198/scalar/v1

if (!app.Environment.IsDevelopment())
{
    // Only in Production, redirect to HTTPS (since it will have a real HTTPS certificate)

    // If we kept this in Development, it would intercept requests before the requests reach the controllers
    // which result in POST endpoints getting 404s.
    app.UseHttpsRedirection();
}

// Add HTTP security headers to every response — hardens the API against common browser-level attacks.
// Placed first so headers are set before any other middleware can short-circuit the pipeline.
app.UseSecurityHeaders();

// Enable CORS
//// Activate the CORS we described in the builder.Services.AddCors section above
app.UseCors("AllowReactApp");

// Global exception handler — catches any unhandled exception and returns a ProblemDetails JSON response.
// Placed before UseAuthentication so it wraps the entire auth + controller pipeline.
// We are putting this here so if this website has any error,
// this code block only shows a standardized vague error
// in order to hide the actual error from customers
// for
// -- security purposes
// -- potential problems from the errors
// ----- consistency (in case an error causes random effects)
// ----- and to prevent an error from sending out an Ok 200 Http Code
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/problem+json";

        // Creates a ProblemDetails (for showing HttpResposne Error)
        // ProblemDetails is a .NET-build-in class for standardizing showing the HttpError
        var problem = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = 500,
            Title = "An unexpected error occurred."
        };
        await context.Response.WriteAsJsonAsync(problem);
    });
});

// Enable Authentication and Authorization
// Checking incoming requeets for Authentication Tokens.
// Without this, tokens (including JWT(Json Web Tokens) tokens) would not be looked for/checked.
app.UseAuthentication();

// Without this, all endpoints are publicly accessible
// Tells app to eforce [Authorize] attributes on my controllers
app.UseAuthorization();

// Rate limiting — placed after UseAuthentication/UseAuthorization so that
// user ID claims are available for user-keyed policies (ExternalApiSearch, AuthenticatedGeneral)
app.UseRateLimiter();

// Map controller routes
// Map controllers to the routing system.
// This is needed. Without it, requests never reach controllers.
app.MapControllers();





// Seed initial admin user if none exists already.
// Credentials (user/password/etc.) are read from
// -- (Development): user-secrets
// -- (Production ): environment variables

 // Since app hasn't started running yet, I am creating a temporary scope here
 // to the user to make that admin user.
 // The "using" means that after this code chunk, this scope will be cleaned up/disposed when the block is finished
 // (so it releases its connection the Database)
 // The line right below Runs on startup
using (var scope = app.Services.CreateScope()) 
{
    // Add database:
    // AppDbContext is a file I created in backend/MyDotNetWebsiteApi/Data/AppDbContext.cs
    // In this file (yes, Program.cs lines 17-20)
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();  // Applies any unapplied migrations (if all migrations are applied already, this is still fine to call.)


    // Pulls .NET's built-in UserManager for CRUDing users.
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

    // Pulls IConfiguration (unified config object that pulls settings from appsettings,json, user-secrets and environment variables all into 1 place.)
    // To read from IConfiguration, you do config["Key:SubKey"]
    // For Example ["SeedAdmin:UserName"] as seen in the structure below:
    // {
    //     "SeedAdmin": {
    //         "UserName": "admin"
    //     }
    // }
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    // Adding a logger for logging errors:
    // logger is a built-in C#/.NET program for logging errors:
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();


    // Definition for this method is below, in this same Program.cs file.
    await SeedInitialAdminAsync(userManager, config, logger);

    // Ensure every user has their 4 default non-deleteable MediaLists.
    await DefaultMediaListSeederService.SeedDefaultListsForAllUsersAsync(db, logger);

    // Ensure global Featured MediaLists (e.g. "Home Page") exist.
    await FeaturedMediaListSeederService.SeedFeaturedListsAsync(db, logger);

}



// Only runs on first-ever startup (then never again), creates an admin account
// async/Task because it accesses the database (which is an async action)
async Task SeedInitialAdminAsync(UserManager<AppUser> userManager, IConfiguration config, ILogger<Program> logger)
{
    
    // Do not run if admin already exists in the database
    if (userManager.Users.Any(u => u.RoleLevel == UserRoleLevel.Administrator))
        return;
    
    var username = config["SeedAdmin:UserName"];
    var password = config["SeedAdmin:Password"];
    var email = config["SeedAdmin:Email"];



    // If credentials (aka user/pass/email) are not configured,
    // skip without throwing errors (Still write in the log about it)
    // Why are we continuing even though the admin user was not creatd?
    // These valid skip scenarios are all automated/non-interactive runs:
    //
    // -- CI (Continuous Integration) pipeline aka runs everything automatically
    // that you push this into Git, so it typically
    // ---- pulls your code
    // ---- builds it (dotnet build)
    // ---- runs tests (dotnet test)
    // ---- and reports pass/fail back to GitHub.
    //    So CI only builds/tests, and therefore no real DB state is needed.
    //
    // -- Integration tests (aka testing data manually). Test data is managed by the test framework, not by startup seeding
    //
    // -- Docker health-check containers (which only need the webapp to start without errors)

    if (username == null || password == null)
    {
        logger.LogWarning("SeedAdmin credentials were not configured because user and/or password were blank - skipping admin seeding.");
        return; 
    }
    
    // Builds the user object in memory (In C# - not yet in the DB)
    var admin = new AppUser
    {
        UserName = username,
        Email = email,
        RoleLevel = UserRoleLevel.Administrator
    };

    // Writes to DB
    var result = await userManager.CreateAsync(admin, password);

    // This line below is not needed since
    // userManager.CreateAsync (the line above)
    // already built-in calls that flush method inside
    // Also, we had not passed in a _context, so the line would not work anyway.
    // And userManager already has that built-in connection to the DB.
    // 
    // await _context.SaveChangesAsync();  // Flushes changes

    
    if (!result.Succeeded)
    {
        var errorsString = string.Join(", ", result.Errors.Select(e => e.Description));
        logger.LogError("Failed to seed admin user. Error(s): {Errors}", errorsString);

        // Throw an error so the app does not run. I don't want the website to run
        // if no administrator exists and the seeding for an administrator does not work.
        throw new InvalidOperationException($"Admin user seeding failed. Error(s): {errorsString}");

    }
    else
    {
        // Logging the creation:
        logger.LogInformation("Seeded initial admin user '{UserName}'", username);
    }
   
}







app.Run();


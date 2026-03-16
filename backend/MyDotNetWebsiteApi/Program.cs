using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

// JWT Libaries to Import
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;



var builder = WebApplication.CreateBuilder(args);

// Registers AppDbContext.cs as a service.
// Tells EF Core: Use SqLite, find the database file path in 'appsettings.json' under the key 'DefaultConnection'.
// Every time that your controllers need database access, .NET automatically creates an AppDbContext and passes in the database file path
builder.Services.AddDbContext<AppDbContext>(options =>
{
   options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")); 
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





///////







// Register Controllers
// Tells app to look for controller classes to handle API requests.
// Without this, my API endpoints won't be discovered nor routed.
builder.Services.AddControllers();


// Configure CORS
// Allows my app to allow requests from the listed url typed below (Example: http://localhost:5173).
// We're choosing that url because it is the frontend's URL (since our front end has a different URL than the backened)
// By default (without adding cors), browsers have Same Origin Policy: aka block requests between different origins
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", policy =>
    {
       policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod(); 
    });
});






// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // Using Scalar
    // Scalar is a visual UI that makes it easier (don't have to write CURL commands)
    // to interact with my backend API endpoints
    // To use this, run the backend, then,
    // in my internet browser, go to:
    // http://localhost:5198/scalar/v1
}
else
{
    // Only in Production, redirect to HTTPS (since it will have a real HTTPS certificate)

    // If we kept this in Development, it would intercept requests before the requests reach the controllers
    // which result in POST endpoints getting 404s.
    // HOW WOULD THAT BE DIFFERENT Once I set this up in Production?

    app.UseHttpsRedirection();
}

// Enable CORS
//// Activate the CORS we described in the builder.Services.AddCors section above
app.UseCors("AllowReactApp");

// Enable Authentication and Authorization
// Checking incoming requeets for Authentication Tokens.
// Without this, tokens (including JWT(Json Web Tokens) tokens) would not be looked for/checked.
app.UseAuthentication();

// Without this, all endpoints are publicly accessible
// Tells app to eforce [Authorize] attributes on my controllers
app.UseAuthorization();

// Map controller routes
// Map controllers to the routing system.
// This is needed. Without it, requests never reach controllers.
app.MapControllers();






app.Run();


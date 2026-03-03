using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;



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
}

app.UseHttpsRedirection();

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





var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

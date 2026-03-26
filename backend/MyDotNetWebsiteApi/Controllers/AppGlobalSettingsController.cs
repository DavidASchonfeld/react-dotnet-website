using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/appsettings")]
[Authorize]
public class AppGlobalSettingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<AppGlobalSettingsController> _logger;

    public AppGlobalSettingsController(AppDbContext context, ILogger<AppGlobalSettingsController> logger)
    {
        _context = context;
        _logger = logger;
    }


    // Returns current global settings. Admin-only.
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return Unauthorized();
        if (!PermissionHelper.IsAdministrator(requesterUser)) return Forbid();

        // Singleton row — Id is always 1.
        var settings = await _context.AppGlobalSettings.FindAsync(1);
        if (settings == null) return NotFound();

        return Ok(new AppGlobalSettingsDto { UseNonSearchQueryCache = settings.UseNonSearchQueryCache, UseSearchQueryCache = settings.UseSearchQueryCache });
    }


    // Flips the global UseNonSearchQueryCache flag. Admin-only.
    [HttpPatch("toggle-nonsearch-cache")]
    public async Task<IActionResult> ToggleNonSearchCache()
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return Unauthorized();
        if (!PermissionHelper.IsAdministrator(requesterUser)) return Forbid();

        var settings = await _context.AppGlobalSettings.FindAsync(1);
        if (settings == null) return NotFound();

        settings.UseNonSearchQueryCache = !settings.UseNonSearchQueryCache;
        await _context.SaveChangesAsync();

        _logger.LogInformation("AppGlobalSettings: UseNonSearchQueryCache toggled to {Value} by user '{UserId}'",
            settings.UseNonSearchQueryCache, requesterUserId);

        return Ok(new AppGlobalSettingsDto { UseNonSearchQueryCache = settings.UseNonSearchQueryCache, UseSearchQueryCache = settings.UseSearchQueryCache });
    }

    // Flips the global UseSearchQueryCache flag. Admin-only.
    [HttpPatch("toggle-search-cache")]
    public async Task<IActionResult> ToggleSearchCache()
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return Unauthorized();
        if (!PermissionHelper.IsAdministrator(requesterUser)) return Forbid();

        var settings = await _context.AppGlobalSettings.FindAsync(1);
        if (settings == null) return NotFound();

        settings.UseSearchQueryCache = !settings.UseSearchQueryCache;
        await _context.SaveChangesAsync();

        _logger.LogInformation("AppGlobalSettings: UseSearchQueryCache toggled to {Value} by user '{UserId}'",
            settings.UseSearchQueryCache, requesterUserId);

        return Ok(new AppGlobalSettingsDto { UseNonSearchQueryCache = settings.UseNonSearchQueryCache, UseSearchQueryCache = settings.UseSearchQueryCache });
    }
}

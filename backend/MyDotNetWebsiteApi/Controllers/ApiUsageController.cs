using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApiUsageController : ControllerBase
{
    private readonly IApiUsageService _apiUsageService;
    private readonly AppDbContext _context;

    public ApiUsageController(IApiUsageService apiUsageService, AppDbContext context)
    {
        _apiUsageService = apiUsageService;
        _context = context;
    }


    // Returns usage stats for all external APIs (requests used, remaining, percent, period dates).
    // Admin-only — exposes internal API quota data.
    [HttpGet]
    public async Task<IActionResult> GetAllUsageStats()
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return Unauthorized();
        if (!PermissionHelper.IsAdministrator(requesterUser)) return Forbid();

        var stats = await _apiUsageService.GetAllUsageStatsAsync();
        return Ok(stats);
    }


    // Returns static metadata for all external APIs (URLs, licensing, subscription plans).
    // Admin-only — keeps consistency with GetAllUsageStats.
    // No API keys are exposed; the DTO includes only a boolean RequiresApiKey flag.
    [HttpGet("metadata")]
    public async Task<IActionResult> GetAllApiMetadata()
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return Unauthorized();
        if (!PermissionHelper.IsAdministrator(requesterUser)) return Forbid();

        var metadata = ExternalApiRegistry.Apis.Values
            .Select(api => new ExternalApiMetadataDto
            {
                Name = api.Name,
                HomepageUrl = api.HomepageUrl,
                ApiInfoUrl = api.ApiInfoUrl,
                RequiresApiKey = api.ApiKeyConfigPath != null,
                DataRules = api.DataRules,
                SubscriptionPlan = api.CurrentPlan?.Name ?? "Unknown",
                PeriodType = api.CurrentPlan?.PeriodType ?? "Unknown",
                RequestLimit = api.CurrentPlan?.RequestLimit,
            })
            .ToList();

        return Ok(metadata);
    }
}

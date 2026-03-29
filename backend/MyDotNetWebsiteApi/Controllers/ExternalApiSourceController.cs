using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExternalApiSourceController : ControllerBase
{
    private readonly AppDbContext _context;

    public ExternalApiSourceController(AppDbContext context)
    {
        _context = context;
    }


    // Returns all external API sources — useful for admin management
    [HttpGet("all")]
    public async Task<IActionResult> GetAll()
    {
        var sources = await _context.ExternalApiSources
            .OrderBy(s => s.MediaTypeId)
            .Select(s => new ExternalApiSourceSummaryDto
            {
                Id = s.Id,
                ApiName = s.ApiName,
                MediaTypeId = s.MediaTypeId,
                IsActive = s.IsActive
            })
            .ToListAsync();

        return Ok(sources);
    }

    // Returns only the currently active source per media type — used by the frontend
    // to know which API is live when displaying search UI per media type
    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActive()
    {
        var activeSources = await _context.ExternalApiSources
            .Where(s => s.IsActive)
            .OrderBy(s => s.MediaTypeId)
            .Select(s => new ExternalApiSourceSummaryDto
            {
                Id = s.Id,
                ApiName = s.ApiName,
                MediaTypeId = s.MediaTypeId,
                IsActive = s.IsActive
            })
            .ToListAsync();

        return Ok(activeSources);
    }

    // Flips IsDisabledByAdmin for the given source. Admin-only.
    [HttpPatch("{id}/toggle-disabled")]
    public async Task<IActionResult> ToggleDisabled(int id)
    {
        var requesterUserId = User.RequireId();
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return Unauthorized();
        if (!PermissionHelper.IsAdministrator(requesterUser)) return Forbid();

        var source = await _context.ExternalApiSources.FindAsync(id);
        if (source == null) return NotFound();

        source.IsDisabledByAdmin = !source.IsDisabledByAdmin;
        await _context.SaveChangesAsync();

        return Ok(new { source.Id, source.ApiName, source.IsDisabledByAdmin });
    }

    // Flips UsePosterApi for the given source — requires the plan to have SupportsPosterApi. Admin-only.
    [HttpPatch("{id}/toggle-poster-api")]
    public async Task<IActionResult> TogglePosterApi(int id)
    {
        var requesterUserId = User.RequireId();
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return Unauthorized();
        if (!PermissionHelper.IsAdministrator(requesterUser)) return Forbid();

        var source = await _context.ExternalApiSources.FindAsync(id);
        if (source == null) return NotFound();

        source.UsePosterApi = !source.UsePosterApi;
        await _context.SaveChangesAsync();

        return Ok(new { source.Id, source.ApiName, source.UsePosterApi });
    }
}

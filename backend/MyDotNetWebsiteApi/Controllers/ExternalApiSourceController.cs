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
}

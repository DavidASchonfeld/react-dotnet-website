// Tracks and reports request counts for external APIs across their respective billing periods.
// Call TrackRequestAsync each time an external API search is made.
public interface IApiUsageService
{
    // Increments the request count for the given API in the current billing period.
    Task TrackRequestAsync(string apiName);

    // Returns usage stats for every known external API.
    Task<List<ApiUsageStatsDto>> GetAllUsageStatsAsync();
}

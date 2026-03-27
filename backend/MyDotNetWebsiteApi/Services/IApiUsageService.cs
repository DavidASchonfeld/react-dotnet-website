// Tracks and reports request counts for external APIs across their respective billing periods.
// Call TrackRequestAsync each time an external API search is made.
public interface IApiUsageService
{
    // Increments the request count for the given API in the current billing period.
    Task TrackRequestAsync(string apiName);

    // Returns true if the current period's request count has reached the auto-block threshold.
    Task<bool> IsAutoBlockedAsync(string apiName);

    // Returns usage stats for every known external API.
    Task<List<ApiUsageStatsDto>> GetAllUsageStatsAsync();

    // Returns historical usage buckets per API: last 30 days (Daily) or last 12 months (Monthly).
    Task<List<ApiUsageHistoryDto>> GetUsageHistoryAsync();
}

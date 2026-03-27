using Microsoft.EntityFrameworkCore;

public class ApiUsageService : IApiUsageService
{
    private readonly AppDbContext _context;

    // Derived from ExternalApiRegistry so there is exactly one place to add/update API config.
    // Note: Accesses plan data through CurrentPlan to support multi-tier plans.
    private static readonly Dictionary<string, (string PeriodType, int? Limit, int? WarningThreshold, int? AutoBlockThreshold, bool SupportsPosterApi)> _apiConfig =
        ExternalApiRegistry.Apis.ToDictionary(
            kvp => kvp.Key,
            kvp => (
                kvp.Value.CurrentPlan?.PeriodType ?? "Daily",
                kvp.Value.CurrentPlan?.RequestLimit,
                kvp.Value.CurrentPlan?.WarningThreshold,
                kvp.Value.CurrentPlan?.AutoBlockThreshold,
                kvp.Value.CurrentPlan?.SupportsPosterApi ?? false
            )
        );

    public ApiUsageService(AppDbContext context)
    {
        _context = context;
    }


    // Increments the request count for apiName in the current billing period.
    // Creates a new row if this is the first request in the period.
    // Silently does nothing if apiName is not in _apiConfig (e.g. an unrecognised API).
    public async Task TrackRequestAsync(string apiName)
    {
        if (!_apiConfig.TryGetValue(apiName, out var config)) return;

        var periodStart = GetCurrentPeriodStart(config.PeriodType);

        var record = await _context.ApiUsageRecords
            .FirstOrDefaultAsync(r => r.ApiName == apiName && r.PeriodStart == periodStart);

        if (record == null)
        {
            _context.ApiUsageRecords.Add(new ApiUsageRecord
            {
                ApiName = apiName,
                PeriodType = config.PeriodType,
                PeriodStart = periodStart,
                RequestCount = 1
            });
        }
        else
        {
            record.RequestCount++;
        }

        await _context.SaveChangesAsync();
    }


    // Returns true if the current period's request count has reached the auto-block threshold.
    public async Task<bool> IsAutoBlockedAsync(string apiName)
    {
        if (!_apiConfig.TryGetValue(apiName, out var config)) return false;
        if (!config.AutoBlockThreshold.HasValue) return false;

        var periodStart = GetCurrentPeriodStart(config.PeriodType);
        var record = await _context.ApiUsageRecords
            .FirstOrDefaultAsync(r => r.ApiName == apiName && r.PeriodStart == periodStart);

        return (record?.RequestCount ?? 0) >= config.AutoBlockThreshold.Value;
    }


    // Returns a stats snapshot for every API in _apiConfig.
    // RequestsUsed is 0 when no requests have been made in the current period.
    public async Task<List<ApiUsageStatsDto>> GetAllUsageStatsAsync()
    {
        var stats = new List<ApiUsageStatsDto>();

        var sourcesByApiName = await _context.ExternalApiSources
            .ToDictionaryAsync(s => s.ApiName);

        foreach (var kvp in _apiConfig)
        {
            var apiName = kvp.Key;
            var config = kvp.Value;
            var periodStart = GetCurrentPeriodStart(config.PeriodType);
            var periodEnd = GetPeriodEnd(config.PeriodType, periodStart);

            var record = await _context.ApiUsageRecords
                .FirstOrDefaultAsync(r => r.ApiName == apiName && r.PeriodStart == periodStart);

            var used = record?.RequestCount ?? 0;

            sourcesByApiName.TryGetValue(apiName, out var source);

            stats.Add(new ApiUsageStatsDto
            {
                ApiName = apiName,
                RequestsUsed = used,
                RequestLimit = config.Limit,
                RequestsRemaining = config.Limit.HasValue ? Math.Max(0, config.Limit.Value - used) : null,
                PercentUsed = config.Limit.HasValue && config.Limit.Value > 0
                    ? Math.Round((double)used / config.Limit.Value * 100, 1)
                    : null,
                IsApproachingLimit = config.WarningThreshold.HasValue && used >= config.WarningThreshold.Value,
                IsAutoBlocked = config.AutoBlockThreshold.HasValue && used >= config.AutoBlockThreshold.Value,
                AutoBlockThreshold = config.AutoBlockThreshold,
                WarningThreshold = config.WarningThreshold,
                PeriodType = config.PeriodType,
                PeriodStart = periodStart,
                PeriodEnd = periodEnd,
                ExternalApiSourceId = source?.Id ?? 0,
                IsDisabledByAdmin = source?.IsDisabledByAdmin ?? false,
                // Only expose SupportsPosterApi when the plan actually supports it; null hides the toggle in the UI.
                SupportsPosterApi = config.SupportsPosterApi ? true : (bool?)null,
                UsePosterApi = source?.UsePosterApi ?? false,
            });
        }

        return stats;
    }


    // Returns historical usage buckets for all APIs.
    // Daily: last 30 days (inclusive of today). Monthly: last 12 months (inclusive of this month).
    // Zero-fills any period with no recorded requests so the chart always has a contiguous series.
    public async Task<List<ApiUsageHistoryDto>> GetUsageHistoryAsync()
    {
        var result = new List<ApiUsageHistoryDto>();

        foreach (var kvp in _apiConfig)
        {
            var apiName = kvp.Key;
            var config  = kvp.Value;
            var currentPeriodStart = GetCurrentPeriodStart(config.PeriodType);

            // Look back 30 days for Daily APIs, 12 months for Monthly APIs
            var windowStart = config.PeriodType == "Monthly"
                ? currentPeriodStart.AddMonths(-11)
                : currentPeriodStart.AddDays(-29);

            // Single query per API — fetch all records in the window
            var records = await _context.ApiUsageRecords
                .Where(r => r.ApiName == apiName && r.PeriodStart >= windowStart)
                .OrderBy(r => r.PeriodStart)
                .Select(r => new { r.PeriodStart, r.RequestCount })
                .ToListAsync();

            // Build a dense list of all expected buckets, zero-filling periods with no record
            var periods = new List<ApiUsagePeriodDto>();
            var cursor  = windowStart;
            while (cursor <= currentPeriodStart)
            {
                var rec = records.FirstOrDefault(r => r.PeriodStart == cursor);
                periods.Add(new ApiUsagePeriodDto
                {
                    PeriodStart     = cursor,
                    PeriodType      = config.PeriodType,
                    RequestCount    = rec?.RequestCount ?? 0,
                    IsCurrentPeriod = cursor == currentPeriodStart,
                });
                cursor = config.PeriodType == "Monthly" ? cursor.AddMonths(1) : cursor.AddDays(1);
            }

            result.Add(new ApiUsageHistoryDto
            {
                ApiName            = apiName,
                RequestLimit       = config.Limit,
                WarningThreshold   = config.WarningThreshold,
                AutoBlockThreshold = config.AutoBlockThreshold,
                Periods            = periods,
            });
        }

        return result;
    }


    // Returns the UTC start of the current billing period for the given period type.
    private static DateTime GetCurrentPeriodStart(string periodType) => periodType switch
    {
        "Monthly" => new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc),
        _         => DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc),  // "Daily"
    };

    // Returns the UTC end (exclusive) of the billing period that starts at periodStart.
    private static DateTime GetPeriodEnd(string periodType, DateTime periodStart) => periodType switch
    {
        "Monthly" => periodStart.AddMonths(1),
        _         => periodStart.AddDays(1),  // "Daily"
    };
}

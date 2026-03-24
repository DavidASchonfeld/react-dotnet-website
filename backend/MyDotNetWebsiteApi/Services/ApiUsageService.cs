using Microsoft.EntityFrameworkCore;

public class ApiUsageService : IApiUsageService
{
    private readonly AppDbContext _context;

    // Per-API config: period type, optional request limit, optional warning threshold.
    // Limits and thresholds come from AppConstants so they stay in sync with the constants defined there.
    private static readonly Dictionary<string, (string PeriodType, int? Limit, int? WarningThreshold)> _apiConfig = new()
    {
        ["OMDB"]        = (AppConstants.OmdbPeriodType,        AppConstants.OmdbDailyRequestLimit,    AppConstants.OmdbDailyWarningThreshold),
        ["RAWG"]        = (AppConstants.RawgPeriodType,        AppConstants.RawgMonthlyRequestLimit,  AppConstants.RawgMonthlyWarningThreshold),
        ["TVMaze"]      = (AppConstants.TvMazePeriodType,      null, null),  // no official rate limit
        ["OpenLibrary"] = (AppConstants.OpenLibraryPeriodType, null, null),  // no official rate limit
    };

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
                PeriodType = config.PeriodType,
                PeriodStart = periodStart,
                PeriodEnd = periodEnd,
                ExternalApiSourceId = source?.Id ?? 0,
                IsDisabledByAdmin = source?.IsDisabledByAdmin ?? false,
                UseNonSearchQueryCache = source?.UseNonSearchQueryCache ?? true,
            });
        }

        return stats;
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

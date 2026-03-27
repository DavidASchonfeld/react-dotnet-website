// One period bucket for a single API's usage history.
public class ApiUsagePeriodDto
{
    public DateTime PeriodStart { get; set; }
    public string PeriodType { get; set; } = string.Empty;
    public int RequestCount { get; set; }
    public bool IsCurrentPeriod { get; set; }   // computed server-side so the frontend never needs to reconstruct period boundaries
}

// Historical usage + threshold data for one API; self-contained so the chart component needs no cross-referencing.
public class ApiUsageHistoryDto
{
    public string ApiName { get; set; } = string.Empty;
    public int? RequestLimit { get; set; }
    public int? WarningThreshold { get; set; }
    public int? AutoBlockThreshold { get; set; }
    public List<ApiUsagePeriodDto> Periods { get; set; } = [];
}

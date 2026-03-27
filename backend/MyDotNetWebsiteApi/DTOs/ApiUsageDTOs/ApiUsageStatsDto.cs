public class ApiUsageStatsDto
{
    public string ApiName { get; set; } = string.Empty;
    public int RequestsUsed { get; set; }
    public int? RequestLimit { get; set; }          // null = no configured limit for this API
    public int? RequestsRemaining { get; set; }     // null = no configured limit for this API
    public double? PercentUsed { get; set; }        // null = no configured limit for this API
    public bool IsApproachingLimit { get; set; }    // true if RequestsUsed >= the warning threshold
    public bool IsAutoBlocked { get; set; }         // true if RequestsUsed >= the auto-block threshold (computed)
    public int? AutoBlockThreshold { get; set; }    // null = no auto-block configured for this plan
    public int? WarningThreshold { get; set; }      // null = no warning configured for this plan
    public string PeriodType { get; set; } = string.Empty;  // "Daily" or "Monthly"
    public DateTime PeriodStart { get; set; }       // UTC start of the current billing period
    public DateTime PeriodEnd { get; set; }         // UTC end of the current billing period (exclusive)
    public int ExternalApiSourceId { get; set; }    // Id of the ExternalApiSource row for this API
    public bool IsDisabledByAdmin { get; set; }         // true when an admin has temporarily blocked this API
    public bool? SupportsPosterApi { get; set; }        // null = plan has no poster API tier; true = toggle button should be shown
    public bool UsePosterApi { get; set; }              // current per-source poster API toggle state
}

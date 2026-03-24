public class ApiUsageStatsDto
{
    public string ApiName { get; set; } = string.Empty;
    public int RequestsUsed { get; set; }
    public int? RequestLimit { get; set; }          // null = no configured limit for this API
    public int? RequestsRemaining { get; set; }     // null = no configured limit for this API
    public double? PercentUsed { get; set; }        // null = no configured limit for this API
    public bool IsApproachingLimit { get; set; }    // true if RequestsUsed >= the warning threshold
    public string PeriodType { get; set; } = string.Empty;  // "Daily" or "Monthly"
    public DateTime PeriodStart { get; set; }       // UTC start of the current billing period
    public DateTime PeriodEnd { get; set; }         // UTC end of the current billing period (exclusive)
}

/// <summary>
/// Configuration for API plans loaded from appsettings.json under "ApiPlanSettings".
/// Defines available plans for each API and which plan is currently selected.
/// </summary>
public class ApiPlanConfiguration
{
    /// <summary>
    /// Nested dictionary: API name → plan key → plan details.
    /// Example: Plans["RAWG"]["free-tier"] = { Name: "Free Tier", RequestLimit: 20000, ... }
    /// </summary>
    public Dictionary<string, Dictionary<string, ApiPlan>> Plans { get; set; } = new();

    /// <summary>
    /// Selects which plan is active for each API.
    /// Example: SelectedPlans["RAWG"] = "free-tier"
    /// </summary>
    public Dictionary<string, string> SelectedPlans { get; set; } = new();
}

/// <summary>
/// Represents a single subscription plan with rate limit details.
/// </summary>
public class ApiPlan
{
    public string Name { get; set; } = "";
    public string PeriodType { get; set; } = "";
    public int? RequestLimit { get; set; }
    public int? WarningThreshold { get; set; }
}

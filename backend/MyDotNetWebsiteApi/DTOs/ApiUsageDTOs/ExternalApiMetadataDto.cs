// Frontend-safe projection of ExternalApiMetadata.
// Deliberately omits ApiKeyConfigPath and WarningThreshold.
public class ExternalApiMetadataDto
{
    public string Name { get; set; } = string.Empty;
    public string HomepageUrl { get; set; } = string.Empty;
    public string ApiInfoUrl { get; set; } = string.Empty;
    public bool RequiresApiKey { get; set; }
    public string[] DataRules { get; set; } = [];
    public string SubscriptionPlan { get; set; } = string.Empty;
    public string PeriodType { get; set; } = string.Empty;
    public int? RequestLimit { get; set; }
}

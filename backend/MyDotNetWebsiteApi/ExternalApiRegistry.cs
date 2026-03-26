// Centralised metadata for every external API the app consumes.
// Plans and rate limits are loaded from appsettings.json via ApiPlanConfiguration.
// ApiKeyConfigPath is intentionally stored here so we know *which* APIs need
// keys, but it must NEVER be exposed to the frontend — use ExternalApiMetadataDto instead.

public record SubscriptionPlan
{
    public required string Name { get; init; }
    public required string PeriodType { get; init; }
    public int? RequestLimit { get; init; }
    public int? WarningThreshold { get; init; }
    // True when this plan tier grants access to the API's high-res poster endpoint.
    public bool SupportsPosterApi { get; init; } = false;
}

public record ExternalApiMetadata
{
    public required string Name { get; init; }
    public required string HomepageUrl { get; init; }
    public required string ApiInfoUrl { get; init; }
    public string? ApiKeyConfigPath { get; init; }
    public required string[] DataRules { get; init; }
    public required IReadOnlyDictionary<string, SubscriptionPlan> AvailablePlans { get; init; }
    public required string SelectedPlanKey { get; init; }

    // Safely retrieve the selected plan from available plans
    public SubscriptionPlan? CurrentPlan =>
        AvailablePlans.TryGetValue(SelectedPlanKey, out var plan) ? plan : null;
}

/// <summary>
/// Base API metadata without plan details. Plans are loaded from configuration.
/// </summary>
internal record ApiMetadataBase
{
    public required string Name { get; init; }
    public required string HomepageUrl { get; init; }
    public required string ApiInfoUrl { get; init; }
    public string? ApiKeyConfigPath { get; init; }
    public required string[] DataRules { get; init; }
}

public static class ExternalApiRegistry
{
    // Base API metadata (without plans — those come from configuration)
    private static readonly Dictionary<string, ApiMetadataBase> ApiMetadataBases = new()
    {
        ["OMDB"] = new ApiMetadataBase
        {
            Name = "OMDB",
            HomepageUrl = "https://www.omdbapi.com",
            ApiInfoUrl = "https://www.omdbapi.com",
            ApiKeyConfigPath = "ExternalApiSettings:OmdbApiKey",
            DataRules = ["CC BY-NC 4.0 — https://www.omdbapi.com/legal.htm"],
        },
        ["RAWG"] = new ApiMetadataBase
        {
            Name = "RAWG",
            HomepageUrl = "https://rawg.io",
            ApiInfoUrl = "https://rawg.io/apidocs",
            ApiKeyConfigPath = "ExternalApiSettings:RawgApiKey",
            DataRules =
            [
                "Free for personal use as long as you attribute RAWG as the source of the data and/or images and add an active hyperlink from every page where the data of RAWG is used.",
                "Free for commercial use for startups and hobby projects with not more than 100,000 monthly active users or 500,000 page views per month. If your project is larger than that, email us at api@rawg.io for commercial terms.",
                "No data redistribution. It would not be cool if you used our API to resell our data or make it available for other businesses. In other words, you may use the data with your API access only for your projects.",
                "API Legal Notice: We do not claim ownership of any of the images or data provided by the API. We remove infringing content when properly notified. Any data and/or images one might upload to RAWG is expressly granted a license to use. You are prohibited from using the images and/or data in connection with libelous, defamatory, obscene, pornographic, abusive or otherwise offensive content.",
            ],
        },
        ["TVMaze"] = new ApiMetadataBase
        {
            Name = "TVMaze",
            HomepageUrl = "https://www.tvmaze.com",
            ApiInfoUrl = "https://www.tvmaze.com/api",
            ApiKeyConfigPath = null,
            DataRules =
            [
                "CC BY-SA — https://www.tvmaze.com/api#licensing",
                "Must link back to TVMaze as the source of the data within your application or website.",
            ],
        },
        ["OpenLibrary"] = new ApiMetadataBase
        {
            Name = "OpenLibrary",
            HomepageUrl = "https://openlibrary.org",
            ApiInfoUrl = "https://openlibrary.org/developers/api",
            ApiKeyConfigPath = null,
            DataRules =
            [
                "AGPL v3+ — a non-profit Internet Archive initiative.",
                "Must include a User-Agent header with your application name and contact information.",
                "Prohibits HTML scraping, bulk data harvesting, and use as a backend for high-traffic commercial services.",
                "Prioritizes open-source and mission-aligned projects, library and education tools.",
            ],
        },
    };

    // Initialized at startup via InitializeFromConfiguration()
    private static IReadOnlyDictionary<string, ExternalApiMetadata>? _apis;

    public static IReadOnlyDictionary<string, ExternalApiMetadata> Apis =>
        _apis ?? throw new InvalidOperationException(
            "ExternalApiRegistry not initialized. Call InitializeFromConfiguration() during startup.");

    /// <summary>
    /// Initializes the API registry with plans loaded from configuration.
    /// Must be called during application startup (from Program.cs).
    /// </summary>
    public static void InitializeFromConfiguration(ApiPlanConfiguration planConfig)
    {
        var apis = new Dictionary<string, ExternalApiMetadata>();

        foreach (var (apiName, baseMetadata) in ApiMetadataBases)
        {
            if (!planConfig.Plans.TryGetValue(apiName, out var apiPlans))
            {
                throw new InvalidOperationException(
                    $"API '{apiName}' not found in ApiPlanSettings.Plans. Check appsettings.json configuration.");
            }

            if (!planConfig.SelectedPlans.TryGetValue(apiName, out var selectedPlanKey))
            {
                throw new InvalidOperationException(
                    $"API '{apiName}' not found in ApiPlanSettings.SelectedPlans. Check appsettings.json configuration.");
            }

            // Convert ApiPlan objects to SubscriptionPlan records
            var subscribptionPlans = apiPlans.ToDictionary(
                kvp => kvp.Key,
                kvp => new SubscriptionPlan
                {
                    Name = kvp.Value.Name,
                    PeriodType = kvp.Value.PeriodType,
                    RequestLimit = kvp.Value.RequestLimit,
                    WarningThreshold = kvp.Value.WarningThreshold,
                    SupportsPosterApi = kvp.Value.SupportsPosterApi,  // propagated from ApiPlan config
                }
            );

            apis[apiName] = new ExternalApiMetadata
            {
                Name = baseMetadata.Name,
                HomepageUrl = baseMetadata.HomepageUrl,
                ApiInfoUrl = baseMetadata.ApiInfoUrl,
                ApiKeyConfigPath = baseMetadata.ApiKeyConfigPath,
                DataRules = baseMetadata.DataRules,
                AvailablePlans = subscribptionPlans,
                SelectedPlanKey = selectedPlanKey,
            };
        }

        _apis = apis;
    }

    /// <summary>
    /// Validates that all registered APIs have selected plans that exist in their AvailablePlans.
    /// Throws InvalidOperationException if any API has an invalid SelectedPlanKey.
    /// </summary>
    public static void ValidateAllPlans()
    {
        foreach (var kvp in Apis)
        {
            var apiName = kvp.Key;
            var metadata = kvp.Value;

            if (metadata.CurrentPlan == null)
            {
                throw new InvalidOperationException(
                    $"API '{apiName}' has invalid SelectedPlanKey '{metadata.SelectedPlanKey}'. " +
                    $"Available plans: {string.Join(", ", metadata.AvailablePlans.Keys)}"
                );
            }
        }
    }
}

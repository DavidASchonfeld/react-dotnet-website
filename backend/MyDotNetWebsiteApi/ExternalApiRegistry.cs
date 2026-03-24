// Centralised metadata for every external API the app consumes.
// Rate-limit numbers come from AppConstants (single source of truth).
// ApiKeyConfigPath is intentionally stored here so we know *which* APIs need
// keys, but it must NEVER be exposed to the frontend — use ExternalApiMetadataDto instead.

public record ExternalApiMetadata
{
    public required string Name { get; init; }
    public required string HomepageUrl { get; init; }
    public required string ApiInfoUrl { get; init; }
    public string? ApiKeyConfigPath { get; init; }
    public required string[] DataRules { get; init; }
    public required string SubscriptionPlan { get; init; }
    public required string PeriodType { get; init; }
    public int? RequestLimit { get; init; }
    public int? WarningThreshold { get; init; }
}

public static class ExternalApiRegistry
{
    public static readonly IReadOnlyDictionary<string, ExternalApiMetadata> Apis =
        new Dictionary<string, ExternalApiMetadata>
        {
            ["OMDB"] = new ExternalApiMetadata
            {
                Name = "OMDB",
                HomepageUrl = "https://www.omdbapi.com",
                ApiInfoUrl = "https://www.omdbapi.com",
                ApiKeyConfigPath = "ExternalApiSettings:OmdbApiKey",
                DataRules = ["CC BY-NC 4.0 — https://www.omdbapi.com/legal.htm"],
                SubscriptionPlan = "$5/month - on Patreon / omdbapi.com",
                PeriodType = AppConstants.OmdbPeriodType,
                RequestLimit = AppConstants.OmdbDailyRequestLimit,
                WarningThreshold = AppConstants.OmdbDailyWarningThreshold,
            },

            ["RAWG"] = new ExternalApiMetadata
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
                SubscriptionPlan = "Free Tier",
                PeriodType = AppConstants.RawgPeriodType,
                RequestLimit = AppConstants.RawgMonthlyRequestLimit,
                WarningThreshold = AppConstants.RawgMonthlyWarningThreshold,
            },

            ["TVMaze"] = new ExternalApiMetadata
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
                SubscriptionPlan = "Free (public API)",
                PeriodType = AppConstants.TvMazePeriodType,
                RequestLimit = null,
                WarningThreshold = null,
            },

            ["OpenLibrary"] = new ExternalApiMetadata
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
                SubscriptionPlan = "Free",
                PeriodType = AppConstants.OpenLibraryPeriodType,
                RequestLimit = null,
                WarningThreshold = null,
            },
        };
}

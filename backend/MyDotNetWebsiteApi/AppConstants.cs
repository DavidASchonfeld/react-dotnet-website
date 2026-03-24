public static class AppConstants
{
    //// Pagination
    public const int DefaultPageSize = 10;

    //// Searching-Related Constants:

    // Server-side cap on # of search results — must stay in sync with frontend's SEARCH_DEFAULT_LIMIT (frontend/src/constants.ts).
    public const int SearchResultMaxLimit = 20;

    // Minimum characters required to trigger a search — must stay in sync with frontend's SEARCH_MIN_CHARS (frontend/src/constants.ts).
    public const int SearchMinQueryLength = 2;


    //// OMDB API (Movies)
    // Terms: Non-Commercial only — https://www.omdbapi.com/legal.htm
    // Home page: https://www.omdbapi.com
    public const int OmdbDailyRequestLimit = 250_000;      // 250,000 requests/day
    public const int OmdbDailyWarningThreshold = 225_000;  // 90% of daily limit — stay below this


    //// RAWG API (Video Games)
    // Terms: Non-Commercial only — https://rawg.io/terms
    // Home page: https://rawg.io
    public const int RawgMonthlyRequestLimit = 20_000;      // 20,000 requests/month
    public const int RawgMonthlyWarningThreshold = 18_000;  // 90% of monthly limit — stay below this


    //// Search Cache
    // Number of days before a cached search result is considered stale — must stay in sync with frontend's SEARCH_CACHE_STALE_DAYS (frontend/src/constants.ts).
    public const int SearchCacheStaleDays = 30;

    //// Non-Search Cache
    // Number of days before a cached detail-fetch result is considered stale — must stay in sync with frontend's NONSEARCH_CACHE_STALE_DAYS (frontend/src/constants.ts).
    public const int NonSearchCacheStaleDays = 30;


    //// API Usage Tracking — Period Types
    // Used by ApiUsageService to determine the reset cadence per API.
    public const string OmdbPeriodType = "Daily";           // resets at UTC midnight
    public const string RawgPeriodType = "Monthly";         // resets on the 1st of each UTC month
    public const string TvMazePeriodType = "Daily";         // no official limit — tracked for visibility
    public const string OpenLibraryPeriodType = "Daily";    // no official limit — tracked for visibility
}

public static class AppConstants
{
    //// Pagination
    public const int DefaultPageSize = 10;

    //// Searching-Related Constants:

    // Server-side cap on # of search results — must stay in sync with frontend's SEARCH_DEFAULT_LIMIT (frontend/src/constants.ts).
    public const int SearchResultMaxLimit = 20;

    // Minimum characters required to trigger a search — must stay in sync with frontend's SEARCH_MIN_CHARS (frontend/src/constants.ts).
    public const int SearchMinQueryLength = 2;


    //// API Usage Tracking — Period Types
    // Used by ApiUsageService to determine the reset cadence per API.
    public const string OmdbPeriodType = "Daily";    // resets at UTC midnight
    public const string RawgPeriodType = "Monthly";  // resets on the 1st of each UTC month
    // Add a new XxxPeriodType constant here when registering a new 3rd-party API.
}

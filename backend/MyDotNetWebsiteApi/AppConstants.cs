public static class AppConstants
{
    //// Searching-Related Constants:

    // Server-side cap on # of search results — ignore whatever limit the client sent.
    // Must stay in sync with frontend's SEARCH_DEFAULT_LIMIT (frontend/src/constants.ts).
    public const int SearchResultMaxLimit = 20;

    // Minimum characters required to trigger a search.
    // Must stay in sync with frontend's SEARCH_MIN_CHARS (frontend/src/constants.ts).
    public const int SearchMinQueryLength = 2;
}

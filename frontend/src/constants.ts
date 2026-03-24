export const EXPLORE_PAGE_ITEM_COUNT = 5;

// The window width (px) below which the top navbar auto-minimizes (Tailwind's "sm" breakpoint).
export const NAVBAR_AUTO_MINIMIZE_BREAKPOINT = 640;

// Swipe must travel this many px to trigger an action; shorter swipes snap back (same unit on laptops and phones)
export const AMOUNT_TO_SWIPE_HORIZONTALLY_TO_ACTIVATE_TRIGGER = 100;

// Number of days before a cached search result is considered stale — must stay in sync with backend's AppConstants.SearchCacheStaleDays (AppConstants.cs).
export const SEARCH_CACHE_STALE_DAYS = 30;

// Number of days before a cached detail-fetch result is considered stale — must stay in sync with backend's AppConstants.NonSearchCacheStaleDays (AppConstants.cs).
export const NONSEARCH_CACHE_STALE_DAYS = 30;

// Search defaults — must stay in sync with backend's AppConstants (AppConstants.cs)
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_CHARS = 2;      // Matches AppConstants.SearchMinQueryLength
export const SEARCH_DEFAULT_LIMIT = 10; // Per-keystroke result cap sent to the backend (backend also enforces its own cap)

// API-specific search sub-types shown in AdvancedSearch and SearchResultsPage.
// Keys match the ExternalApiSource.apiName values from the backend.
export const API_SUBTYPES: Record<string, { value: string; label: string }[]> = {
    OMDB: [
        { value: 'movie',   label: 'Movie'   },
        { value: 'series',  label: 'Series'  },
        { value: 'episode', label: 'Episode' },
    ],
    RAWG: [
        { value: 'game',      label: 'Game'      },
        { value: 'publisher', label: 'Publisher' },
        { value: 'developer', label: 'Developer' },
    ],
}
export const EXPLORE_PAGE_ITEM_COUNT = 5;

// The window width (px) below which the top navbar auto-minimizes (Tailwind's "sm" breakpoint).
export const NAVBAR_AUTO_MINIMIZE_BREAKPOINT = 640;

// Swipe must travel this many px to trigger an action; shorter swipes snap back (same unit on laptops and phones)
export const AMOUNT_TO_SWIPE_HORIZONTALLY_TO_ACTIVATE_TRIGGER = 100;

// Search defaults — must stay in sync with backend's AppConstants (AppConstants.cs)
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_CHARS = 2;      // Matches AppConstants.SearchMinQueryLength
export const SEARCH_DEFAULT_LIMIT = 10; // Per-keystroke result cap sent to the backend (backend also enforces its own cap)
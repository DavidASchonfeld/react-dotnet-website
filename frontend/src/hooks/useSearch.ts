// Debounced search hook.
//
// Usage:
//   const { results, isSearching, handleSearchChange, clearResults } =
//       useSearch<MediaItemSummary>((query) => searchMediaItems(token!, query, 10));
//
// The caller binds the token + service function before passing it in,
// so this hook stays Redux-free and works with any object type.
//
// TODO: Future global search bar
//

// Note on searchFn identity: Wrap it in a Callback
// If you define searchFn as an inline arrow function
// without useCallback, it will be a new reference on each render and will cause
// handleSearchChange to be regenerated. This is safe (the debounce timer is managed
// via ref, not function identity), but wrap searchFn in useCallback if you want to
// avoid the regeneration entirely.

// useRef: Standard pattenr for storing any mutable value that needs to survive re-renders but should not cause re-renders
// ----- For example: timers.
import { useState, useRef, useCallback } from 'react';
import { safeToast } from '../utils/safeToast';
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '../constants';

interface UseSearchOptions {
    debounceMs?: number;  // Default: SEARCH_DEBOUNCE_MS (300ms)
    minChars?: number;    // Default: SEARCH_MIN_CHARS (2) — must match backend's AppConstants.SearchMinQueryLength
}

export function useSearch<T>(
    searchFn: (query: string) => Promise<T[]>,
    options?: UseSearchOptions
) {
    const debounceMs = options?.debounceMs ?? SEARCH_DEBOUNCE_MS;
    const minChars = options?.minChars ?? SEARCH_MIN_CHARS;

    const [results, setResults] = useState<T[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [query, setQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search — fires debounceMs after the user stops typing.
    // Requires minChars+ characters (matching the backend's minimum).
    // Note: Debounce: a timer set so nobody can send from the frontend
    // supernaturally fast (that's what a scraper or AI might do,
    // which, besides security, might cause problems.)
    const handleSearchChange = useCallback((newQuery: string) => {
        
        // Every time a user types a character, handleSearchChange is called. 
        // This line cancels any previously scheduled search timer,
        // so later in this method, we can restart the timer.
        // As said below, debounce says we only can send the search after X milliseconds of no-aPI-calling.
        // Example:
        // User types "r"   → cancel nothing, schedule timer T1
        // User types "re"  → cancel T1,       schedule timer T2
        // User types "rea" → cancel T2,       schedule timer T3
        // [user stops typing for 300ms]
        // T3 fires → API call made with "rea"
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setQuery(newQuery);
        if (newQuery.length < minChars) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        // After canceling the old timer, this schedules a new one.
        // The actual API call (searchFn) only runs after debounceMs milliseconds of silence.
        // The timer id is saved to debounceRef.current so that the next keystoke
        // (like in line "if (debounceRef.current) clearTimeout(debounceRef.current);")
        // can cancel it again if it arrives before the timer firests.
        debounceRef.current = setTimeout(async () => {
            try {
                const data = await searchFn(newQuery);
                setResults(data);
            } catch {
                safeToast.error('Search failed');
            } finally {
                setIsSearching(false);
            }
        }, debounceMs);
    }, [searchFn, debounceMs, minChars]);

    // Clears results + pending timer — call this when a modal closes or edit mode exits
    const clearResults = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setResults([]);
        setQuery('');
        setIsSearching(false);
    }, []);

    return { results, isSearching, query, handleSearchChange, clearResults };
}

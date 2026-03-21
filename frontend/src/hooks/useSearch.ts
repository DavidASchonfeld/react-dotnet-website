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

import { useState, useRef, useCallback } from 'react';
import { safeToast } from '../utils/safeToast';

interface UseSearchOptions {
    debounceMs?: number;  // Default: 300
    minChars?: number;    // Default: 2
}

export function useSearch<T>(
    searchFn: (query: string) => Promise<T[]>,
    options?: UseSearchOptions
) {
    const debounceMs = options?.debounceMs ?? 300;
    const minChars = options?.minChars ?? 2;

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
        
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setQuery(newQuery);
        if (newQuery.length < minChars) {
            setResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
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

import { SEARCH_MIN_CHARS } from '../constants'

export type SearchType = 'media' | 'tags' | 'lists'

/**
 * Returns true when a search is valid to fire/display.
 * - Non-media (tags/lists): always true — no query required.
 * - Media: query must meet SEARCH_MIN_CHARS, and if apiSourceId is supplied it must be non-null.
 */
export function canSearch(
    query: string,
    searchType: SearchType,
    apiSourceId?: number | null,
): boolean {
    if (searchType !== 'media') return true
    if (apiSourceId !== undefined && apiSourceId === null) return false
    return query.length >= SEARCH_MIN_CHARS
}

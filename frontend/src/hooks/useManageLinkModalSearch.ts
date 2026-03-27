// Encapsulates all data-fetching, pagination, and search logic for ManageLinkModal.
//
// Two-mode behaviour (mirrors the SearchPage "mine" no-query pattern):
//   - Empty search bar  → getMyMediaLists / getMyCustomTags   (show all user's items)
//   - Query ≥ SEARCH_MIN_CHARS → lazy search endpoints, mineOnly=true
//
// Usage:
//   const modalSearch = useManageLinkModalSearch(activeModalType, showModal)
//   <ManageLinkModal {...modalSearch} initialLinkedIds={...} onAdd={...} onRemove={...} ... />

import { useState } from 'react'
import {
    useGetMyMediaListsQuery,
    useGetMyCustomTagsQuery,
    useLazySearchMediaListsQuery,
    useLazySearchCustomTagsQuery,
} from '../services/apiSlice'
import type { FilterState, SearchType } from '../components/SearchBarWithFilters'
import { SEARCH_MIN_CHARS, SEARCH_DEFAULT_LIMIT } from '../constants'
import { MediaListCategory } from '../types/enums'

const EXCLUDED_LIST_CATEGORIES = [MediaListCategory.ReadingStatus, MediaListCategory.Featured]

interface ManageLinkModalSearchResult {
    candidates: { id: string; firstString: string; secondString?: string }[]
    candidatesLoading: boolean
    pagination: { page: number; hasNextPage: boolean; hasPreviousPage: boolean; totalPages?: number }
    onSearch: (query: string, filters: FilterState, bypassCache: boolean) => void
    onPageChange: (newPage: number) => void
}

export function useManageLinkModalSearch(
    activeType: SearchType, // 'lists' | 'tags' — drives which queries fire
    enabled: boolean        // false while the modal is closed; prevents background fetches
): ManageLinkModalSearchResult {
    const [page, setPage] = useState(1)
    const [query, setQuery] = useState('')
    const shouldFetch = query.length >= SEARCH_MIN_CHARS // true once user has typed enough to search

    // Derived-state pattern: wipe page + query mid-render when activeType changes.
    // This is React's recommended alternative to useEffect+setState for prop-driven resets
    // (one synchronous re-render, no extra effect pass or cascade).
    const [prevActiveType, setPrevActiveType] = useState(activeType)
    if (prevActiveType !== activeType) {
        setPrevActiveType(activeType)
        setPage(1)
        setQuery('')
    }

    // No-query mode: fetch all the user's lists (skipped while a search query is active)
    const { data: myListsResult, isFetching: myListsFetching } = useGetMyMediaListsQuery(
        { page },
        { skip: !enabled || activeType !== 'lists' || shouldFetch }
    )
    // No-query mode: fetch all the user's tags (skipped while a search query is active)
    const { data: myTagsResult, isFetching: myTagsFetching } = useGetMyCustomTagsQuery(
        { page },
        { skip: !enabled || activeType !== 'tags' || shouldFetch }
    )

    // Search mode: lazy so they only fire when explicitly triggered inside onSearch / onPageChange
    const [triggerSearchLists, { data: listSearchData, isFetching: isSearchingLists }] = useLazySearchMediaListsQuery()
    const [triggerSearchTags, { data: tagSearchData, isFetching: isSearchingTags }] = useLazySearchCustomTagsQuery()

    // Called by ManageLinkModal's search bar on submit (bypassCache not needed here)
    function onSearch(newQuery: string, filters: FilterState) {
        setQuery(newQuery)
        setPage(1) // always reset to page 1 on a new search
        if (newQuery.length >= SEARCH_MIN_CHARS) {
            if (filters.searchType === 'lists') triggerSearchLists({ query: newQuery, limit: SEARCH_DEFAULT_LIMIT, mineOnly: true, page: 1 })
            else triggerSearchTags({ query: newQuery, limit: SEARCH_DEFAULT_LIMIT, mineOnly: true, page: 1 })
        }
    }

    // Called by ManageLinkModal's PaginationControls
    function onPageChange(newPage: number) {
        setPage(newPage)
        if (shouldFetch) {
            // Re-run the active search at the new page
            if (activeType === 'lists') triggerSearchLists({ query, limit: SEARCH_DEFAULT_LIMIT, mineOnly: true, page: newPage })
            else triggerSearchTags({ query, limit: SEARCH_DEFAULT_LIMIT, mineOnly: true, page: newPage })
        }
        // No-query path: changing `page` causes useGetMyMediaListsQuery/useGetMyCustomTagsQuery to re-fire automatically
    }

    // Switch between "all mine" items and search results depending on whether a query is active
    const candidates = activeType === 'lists'
        ? (shouldFetch ? listSearchData ?? [] : myListsResult?.items ?? [])
            .filter(l => !EXCLUDED_LIST_CATEGORIES.includes(l.category))
            .map(l => ({ id: String(l.id), firstString: l.name, secondString: l.description ?? undefined }))
        : (shouldFetch ? tagSearchData ?? [] : myTagsResult?.items ?? [])
            .map(t => ({ id: String(t.id), firstString: t.name }))

    // Next-page exists if the last batch was full (search) or there are more pages in the paginated result (no-query)
    const hasNextPage = shouldFetch
        ? activeType === 'lists'
            ? (listSearchData?.length ?? 0) === SEARCH_DEFAULT_LIMIT
            : (tagSearchData?.length ?? 0) === SEARCH_DEFAULT_LIMIT
        : activeType === 'lists'
            ? page < (myListsResult?.totalPages ?? 1)
            : page < (myTagsResult?.totalPages ?? 1)

    const pagination = {
        page,
        hasNextPage,
        hasPreviousPage: page > 1,
        // totalPages is only known in no-query mode (search results don't return a total count)
        totalPages: shouldFetch
            ? undefined
            : activeType === 'lists' ? myListsResult?.totalPages : myTagsResult?.totalPages,
    }

    return {
        candidates,
        candidatesLoading: isSearchingLists || isSearchingTags || myListsFetching || myTagsFetching,
        pagination,
        onSearch,
        onPageChange,
    }
}

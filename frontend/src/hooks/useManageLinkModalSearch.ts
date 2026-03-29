import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'
import {
    useGetMyMediaListsQuery,
    useGetMyCustomTagsQuery,
    useLazySearchMediaListsQuery,
    useLazySearchCustomTagsQuery,
    useLazySearchExternalApiQuery,
    useGetActiveApiSourcesQuery,
} from '../services/apiSlice'
import { SEARCH_DEFAULT_LIMIT } from '../constants'
import { MediaListCategory } from '../types/enums'
import type { ExternalApiSourceSummary } from '../types/externalApiSource'
import type { ExternalApiSearchResult } from '../types/externalApiSearch'
import type { FilterState, SearchType } from '../components/SearchBarWithFilters'
import type { DetailItemType } from '../components/modals/detail_panels/DetailSidePanel'

// ---- useManageLinkModalSearch ----
// Encapsulates all data-fetching, pagination, and search logic for ManageLinkModal.
//
// Three-mode behaviour:
//   'lists' / 'tags':
//     - Before first search   -> getMyMediaLists / getMyCustomTags  (show user's own items)
//     - After any search      -> lazy search endpoints (empty query returns all matching items)
//   'media':
//     - Always lazy external-API search (no "show all" mode; results only appear after a search)
//     - Also returns activeApiSources, currentApiSource, and mediaSearchResults
//       so the caller's onAdd handler can upsert MediaApiRef correctly.
//
// Usage:
//   const modalSearch = useManageLinkModalSearch(activeModalType, showModal)
//   <ManageLinkModal {...modalSearch} initialLinkedIds={...} onAdd={...} onRemove={...} ... />

const EXCLUDED_LIST_CATEGORIES = [MediaListCategory.VisitingStatus, MediaListCategory.Featured]

// Candidate shape — includes optional detail metadata so the modal can open a side panel
export interface Candidate {
    id: string;
    firstString: string;
    secondString?: string;
    photographOnLeft?: string;
    previewThumbnailUrls?: string[];  // mediaList only — used to render a collage thumbnail
    detailType?: DetailItemType;   // drives which detail panel to show
    apiSourceName?: string;        // mediaApiRef only — needed for route link
}

export interface ManageLinkModalSearchResult {
    candidates: Candidate[]
    candidatesLoading: boolean
    // undefined in 'media' mode before the first search (so ManageLinkModal hides pagination)
    pagination: { page: number; hasNextPage: boolean; hasPreviousPage: boolean; totalPages?: number } | undefined
    onSearch: (query: string, filters: FilterState, bypassCache: boolean) => void
    onPageChange: (newPage: number) => void
    // Media-mode only (undefined when activeType is 'lists' or 'tags')
    activeApiSources?: ExternalApiSourceSummary[]
    currentApiSource?: ExternalApiSourceSummary | null
    mediaSearchResults?: ExternalApiSearchResult[]
}

export function useManageLinkModalSearch(
    activeType: SearchType, // 'lists' | 'tags' | 'media' — drives which queries fire
    enabled: boolean        // false while the modal is closed; prevents background fetches
): ManageLinkModalSearchResult {
    // Admins can manage all public tags/lists, so they bypass the mineOnly filter
    const isAdmin = useSelector((state: RootState) => state.auth.roleLevel) === 'Administrator'
    const [page, setPage] = useState(1)
    const [query, setQuery] = useState('')
    // searchMode: true once user has explicitly submitted a search (even with empty text)
    const [searchMode, setSearchMode] = useState(false)

    // Derived-state pattern: wipe page + query mid-render when activeType changes.
    // This is React's recommended alternative to useEffect+setState for prop-driven resets
    // (one synchronous re-render, no extra effect pass or cascade).
    const [prevActiveType, setPrevActiveType] = useState(activeType)
    const [currentApiSource, setCurrentApiSource] = useState<ExternalApiSourceSummary | null>(null)
    const [lastMediaSearchParams, setLastMediaSearchParams] = useState<{ query: string; mediaTypeId: number } | null>(null)
    // tracks the last submitted mineOnly so pagination can reuse the same scope
    const [mineOnly, setMineOnly] = useState(false)
    if (prevActiveType !== activeType) {
        setPrevActiveType(activeType)
        setPage(1)
        setQuery('')
        setSearchMode(false)
        setCurrentApiSource(null)
        setLastMediaSearchParams(null)
        setMineOnly(false)
    }

    // --- Lists / tags mode ---

    // No-query mode: fetch all the user's lists (skipped once the user submits a search)
    const { data: myListsResult, isFetching: myListsFetching } = useGetMyMediaListsQuery(
        { page },
        { skip: !enabled || activeType !== 'lists' || searchMode }
    )
    // No-query mode: fetch all the user's tags (skipped once the user submits a search)
    const { data: myTagsResult, isFetching: myTagsFetching } = useGetMyCustomTagsQuery(
        { page },
        { skip: !enabled || activeType !== 'tags' || searchMode }
    )

    // Search mode: lazy so they only fire when explicitly triggered inside onSearch / onPageChange
    const [triggerSearchLists, { data: listSearchData, isFetching: isSearchingLists }] = useLazySearchMediaListsQuery()
    const [triggerSearchTags, { data: tagSearchData, isFetching: isSearchingTags }] = useLazySearchCustomTagsQuery()

    // --- Media mode ---

    const { data: activeApiSources } = useGetActiveApiSourcesQuery(undefined, {
        skip: !enabled || activeType !== 'media',
    })
    const [triggerSearchMedia, { data: mediaSearchData, isFetching: isSearchingMedia }] = useLazySearchExternalApiQuery()
    const mediaResults = mediaSearchData?.data ?? []

    // Called by ManageLinkModal's search bar on submit (bypassCache not needed here)
    function onSearch(newQuery: string, filters: FilterState) {
        if (activeType === 'media') {
            const source = activeApiSources?.find(s => s.id === filters.apiSourceId) ?? activeApiSources?.[0]
            if (!source) return
            setCurrentApiSource(source)
            setPage(1) // always reset to page 1 on a new search
            setLastMediaSearchParams({ query: newQuery, mediaTypeId: source.mediaTypeId })
            triggerSearchMedia({ query: newQuery, mediaTypeId: source.mediaTypeId, limit: SEARCH_DEFAULT_LIMIT, page: 1 })
            return
        }
        setQuery(newQuery)
        setPage(1) // always reset to page 1 on a new search
        // For lists/tags, allow empty query (returns all matching items)
        const isMineOnly = activeType === 'tags'
            ? !isAdmin  // Admins can apply/manage any public tag; others only their own
            : filters.subtype === 'mine'  // Lists: respect the user's scope filter
        setMineOnly(isMineOnly)
        setSearchMode(true)
        if (filters.searchType === 'lists') triggerSearchLists({ query: newQuery, limit: SEARCH_DEFAULT_LIMIT, mineOnly: isMineOnly, page: 1 })
        else triggerSearchTags({ query: newQuery, limit: SEARCH_DEFAULT_LIMIT, mineOnly: isMineOnly, page: 1 })
    }

    // Called by ManageLinkModal's PaginationControls
    function onPageChange(newPage: number) {
        setPage(newPage)
        if (activeType === 'media') {
            if (lastMediaSearchParams) {
                triggerSearchMedia({ ...lastMediaSearchParams, limit: SEARCH_DEFAULT_LIMIT, page: newPage })
            }
            return
        }
        if (searchMode) {
            // Re-run the active search at the new page
            if (activeType === 'lists') triggerSearchLists({ query, limit: SEARCH_DEFAULT_LIMIT, mineOnly, page: newPage })
            else triggerSearchTags({ query, limit: SEARCH_DEFAULT_LIMIT, mineOnly, page: newPage })
        }
        // No-query path: changing `page` causes useGetMyMediaListsQuery/useGetMyCustomTagsQuery to re-fire automatically
    }

    // --- Media mode early return ---

    if (activeType === 'media') {
        return {
            candidates: mediaResults.map(r => ({
                id: r.externalId,
                firstString: r.name,
                secondString: r.creatorName ?? undefined,
                photographOnLeft: r.thumbnailUrl ?? undefined,
                detailType: 'mediaApiRef' as DetailItemType,
                // store the source so the panel can build a route link
                apiSourceName: currentApiSource?.apiName ?? '',
            })),
            candidatesLoading: isSearchingMedia,
            // Hide pagination until the first search has been made
            pagination: lastMediaSearchParams ? {
                page,
                hasNextPage: mediaResults.length >= SEARCH_DEFAULT_LIMIT,
                hasPreviousPage: page > 1,
            } : undefined,
            onSearch,
            onPageChange,
            activeApiSources,
            currentApiSource,
            mediaSearchResults: mediaResults,
        }
    }

    // --- Lists / tags mode ---

    // Switch between "all mine" items and search results depending on whether user has searched
    const candidates: Candidate[] = activeType === 'lists'
        ? (searchMode ? listSearchData ?? [] : myListsResult?.items ?? [])
            .filter(l => !EXCLUDED_LIST_CATEGORIES.includes(l.category))
            .map(l => ({ id: String(l.id), firstString: l.name, secondString: l.description ?? undefined, previewThumbnailUrls: l.previewThumbnailUrls, detailType: 'mediaList' as DetailItemType }))
        : (searchMode ? tagSearchData ?? [] : myTagsResult?.items ?? [])
            // Admins can manage all public tags; others only see their own
            .filter(t => t.canEdit || isAdmin)
            .map(t => ({ id: String(t.id), firstString: t.name, detailType: 'tag' as DetailItemType }))

    // Next-page exists if the last batch was full (search) or there are more pages in the paginated result (no-query)
    const hasNextPage = searchMode
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
        totalPages: searchMode
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

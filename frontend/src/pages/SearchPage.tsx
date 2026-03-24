import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'
import {
    useSearchExternalApiQuery,
    useFindOrCreateMediaApiRefMutation,
    useGetActiveApiSourcesQuery,
    useSearchCustomTagsQuery,
    useSearchMediaListsQuery,
} from '../services/apiSlice'
import AnimatedPage from '../components/AnimatedPage'
import SearchBar from '../components/SearchBar'
import RowItemStyling from '../components/RowItemStyling'
import RowItemContent from '../components/RowItemContent'
import { CacheStatusPill } from '../components/CacheStatusPill'
import type { ExternalApiSearchResult } from '../types/externalApiSearch'
import { SEARCH_MIN_CHARS, SEARCH_DEFAULT_LIMIT, API_SUBTYPES } from '../constants'

const PAGE_SIZE = SEARCH_DEFAULT_LIMIT

const SEARCH_TYPES = [
    { id: 'media', label: 'Media' },
    { id: 'tags',  label: 'Tags'  },
    { id: 'lists', label: 'Lists' },
] as const

type SearchType = 'media' | 'tags' | 'lists'
type SearchScope = 'all' | 'mine'

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const { roleLevel } = useSelector((state: RootState) => state.auth)

    // Parse URL parameters
    const query = searchParams.get('q') ?? ''
    const apiSourceIdParam = searchParams.get('api')
    const subtypeParam = searchParams.get('subtype') ?? undefined
    const pageParam = searchParams.get('page')
    const showFiltersParam = searchParams.get('showFilters') === 'true'
    const page = Math.max(1, parseInt(pageParam ?? '1') || 1)

    // Determine if filters should be open by default
    const shouldShowFilters = showFiltersParam || !query
    const [isFiltersOpen, setIsFiltersOpen] = useState(shouldShowFilters)

    const urlSearchType = (searchParams.get('type') ?? 'media') as SearchType
    const urlScope = (searchParams.get('scope') ?? 'all') as SearchScope

    // Local state for filters — these don't trigger searches when changed
    const [filters, setFilters] = useState({
        searchType: urlSearchType,
        scope: urlScope,
        apiSourceId: apiSourceIdParam ? parseInt(apiSourceIdParam) : null,
        subtype: subtypeParam,
    })

    const { data: activeSources } = useGetActiveApiSourcesQuery()

    // Derive apiSourceId from filter state, falling back to first available source
    const effectiveLocalApiSourceId = filters.apiSourceId ?? activeSources?.[0]?.id ?? null

    // Use URL-based filters for actual search queries (these are set when user submits)
    const searchType = urlSearchType
    const scope = urlScope
    const parsedApiSourceId = apiSourceIdParam ? parseInt(apiSourceIdParam) : null
    const apiSourceId = (parsedApiSourceId && !isNaN(parsedApiSourceId))
        ? parsedApiSourceId
        : (activeSources?.[0]?.id ?? null)

    const selectedSource = activeSources?.find(s => s.id === apiSourceId)
    const mediaTypeId = selectedSource?.mediaTypeId ?? null
    const availableSubtypes = selectedSource ? (API_SUBTYPES[selectedSource.apiName] ?? []) : []
    const activeSubtype = availableSubtypes.find(s => s.value === subtypeParam)?.value ?? undefined

    // Sync filter state when URL params change (e.g., browser back/forward)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setFilters({
            searchType: urlSearchType,
            scope: urlScope,
            apiSourceId: apiSourceIdParam ? parseInt(apiSourceIdParam) : null,
            subtype: subtypeParam,
        })
    }, [urlSearchType, urlScope, apiSourceIdParam, subtypeParam])

    const isModerator = roleLevel === 'Moderator' || roleLevel === 'Administrator'
    const shouldFetch = query.length >= SEARCH_MIN_CHARS

    // API queries
    const { data: mediaResults, isLoading: mediaLoading, isFetching: mediaFetching } =
        useSearchExternalApiQuery(
            { query, mediaTypeId: mediaTypeId!, limit: PAGE_SIZE, page, subtype: activeSubtype },
            { skip: !shouldFetch || searchType !== 'media' || mediaTypeId === null }
        )

    const { data: tagResults, isLoading: tagsLoading, isFetching: tagsFetching } =
        useSearchCustomTagsQuery(
            { query, limit: PAGE_SIZE, mineOnly: scope === 'mine' },
            { skip: !shouldFetch || searchType !== 'tags' }
        )

    const { data: listResults, isLoading: listsLoading, isFetching: listsFetching } =
        useSearchMediaListsQuery(
            { query, limit: PAGE_SIZE, mineOnly: scope === 'mine' },
            { skip: !shouldFetch || searchType !== 'lists' }
        )

    const [findOrCreate] = useFindOrCreateMediaApiRefMutation()

    // Handlers for form controls — these update filter state only (no search triggered)
    const handleApiSourceChange = (id: number) => {
        setFilters(prev => ({ ...prev, apiSourceId: id, subtype: undefined }))
    }

    const handleSubtypeChange = (newSubtype: string) => {
        setFilters(prev => ({ ...prev, subtype: newSubtype || undefined }))
    }

    const handleTypeChange = (newType: SearchType) => {
        setFilters(prev => ({
            ...prev,
            searchType: newType,
            ...(newType !== 'media' && { apiSourceId: null, subtype: undefined })
        }))
    }

    const handleScopeChange = (newScope: SearchScope) => {
        setFilters(prev => ({ ...prev, scope: newScope }))
    }

    const handleFilterSearch = () => {
        if (query.length < SEARCH_MIN_CHARS) return
        // Apply filter state to URL and trigger search
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            params.set('type', filters.searchType)
            params.set('scope', filters.scope)
            params.set('page', '1')
            if (filters.searchType === 'media' && effectiveLocalApiSourceId !== null) {
                params.set('api', String(effectiveLocalApiSourceId))
            } else {
                params.delete('api')
            }
            if (filters.searchType === 'media' && filters.subtype) {
                params.set('subtype', filters.subtype)
            } else {
                params.delete('subtype')
            }
            params.delete('showFilters')
            return params
        })
        setIsFiltersOpen(false)
    }

    // Media results handlers
    const handleMediaResultClick = async (result: ExternalApiSearchResult) => {
        if (mediaTypeId === null || apiSourceId === null) return
        const source = activeSources?.find(s => s.id === apiSourceId)
        if (!source) return

        try {
            const created = await findOrCreate({
                externalApiSourceId: source.id,
                externalId: result.externalId,
                name: result.name,
                mediaTypeId,
                creatorName: result.creatorName,
                publishedDate: result.publishedDate,
            }).unwrap()
            navigate(`/mediaapiref/${created.id}`)
        } catch {
            // Error toast is handled by baseQueryWithErrorHandling
        }
    }

    const handleSearchSubmit = (newQuery: string) => {
        // Apply filter state to URL when user submits search
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            params.set('q', newQuery)
            params.set('type', filters.searchType)
            params.set('scope', filters.scope)
            params.set('page', '1')
            if (filters.searchType === 'media' && effectiveLocalApiSourceId !== null) {
                params.set('api', String(effectiveLocalApiSourceId))
            } else {
                params.delete('api')
            }
            if (filters.searchType === 'media' && filters.subtype) {
                params.set('subtype', filters.subtype)
            } else {
                params.delete('subtype')
            }
            params.delete('showFilters')
            return params
        })
    }

    const handlePageChange = (newPage: number) => {
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            params.set('page', String(newPage))
            return params
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Derived display state
    const isLoading = mediaLoading || mediaFetching || tagsLoading || tagsFetching || listsLoading || listsFetching
    const mediaHasResults = mediaResults && mediaResults.data.length > 0
    const tagsHasResults = tagResults && tagResults.length > 0
    const listsHasResults = listResults && listResults.length > 0
    const hasNextPage = mediaResults && mediaResults.data.length === PAGE_SIZE
    const hasPrevPage = page > 1

    return (
        <AnimatedPage>
        <div className="page">
            <h1 className="h1-styling">Search</h1>

            {/* Search bar with filters toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors self-start"

                    // Uses CSS because className (aka Tailwind) did not have the exact dimensions
                    // This is to ensure this button is the exact same height as the SearchBar
                    style={{ width: '30px', height: '30px' }}
                    title={isFiltersOpen ? 'Hide filters' : 'Show filters'}
                    aria-label={isFiltersOpen ? 'Hide filters' : 'Show filters'}
                >
                    <span className="text-xs transition-transform" style={{
                        transform: isFiltersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        display: 'inline-block'
                    }}>
                        ▼
                    </span>
                </button>
                <SearchBar
                    mode="on-submit"
                    isTop={false}
                    effectiveMinimized={false}
                    defaultQuery={query}
                    defaultApiSourceId={apiSourceId ?? undefined}
                    onSubmit={handleSearchSubmit}
                    showApiSourcePills={false}
                />
            </div>

            {/* Collapsible Advanced Filters */}
                {isFiltersOpen && (
                <div className="mt-4 p-4 border border-border rounded-lg bg-surface">
                <div className="space-y-4">
                    {/* Search type selector */}
                    <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Type</p>
                        <div className="flex flex-wrap gap-2">
                            {SEARCH_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleTypeChange(t.id)}
                                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                        filters.searchType === t.id
                                            ? 'bg-primary text-white border-primary'
                                            : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API source selector */}
                    {filters.searchType === 'media' && activeSources && activeSources.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">API</p>
                            <div className="flex flex-wrap gap-2">
                                {activeSources.map(source => (
                                    <button
                                        key={source.id}
                                        onClick={() => handleApiSourceChange(source.id)}
                                        className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                            effectiveLocalApiSourceId === source.id
                                                ? 'bg-primary text-white border-primary'
                                                : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                                        }`}
                                    >
                                        {source.apiName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subtype selector */}
                    {filters.searchType === 'media' && availableSubtypes.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Search for
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {availableSubtypes.map(sub => (
                                    <button
                                        key={sub.value}
                                        onClick={() => handleSubtypeChange(sub.value === filters.subtype ? '' : sub.value)}
                                        className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                            filters.subtype === sub.value
                                                ? 'bg-primary/20 text-primary border-primary/40'
                                                : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                                        }`}
                                    >
                                        {sub.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Scope selector */}
                    {filters.searchType !== 'media' && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Scope</p>
                            <div className="flex gap-2">
                                {(['all', 'mine'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleScopeChange(s)}
                                        className={`px-3 py-1 rounded-full border text-sm transition-colors capitalize ${
                                            filters.scope === s
                                                ? 'bg-primary text-white border-primary'
                                                : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin/Moderator section */}
                    {isModerator && (
                        <div className="mt-6 rounded-xl border border-border p-4 bg-surface">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-semibold">
                                    {roleLevel === 'Administrator' ? 'ADMIN' : 'MOD'}
                                </span>
                                <p className="text-sm font-semibold text-text">Moderation Filters</p>
                            </div>
                            <p className="text-sm text-text/50">
                                Additional filters for moderators and administrators will appear here.
                            </p>
                        </div>
                    )}

                    {/* Search button */}
                    <button
                        onClick={handleFilterSearch}
                        disabled={query.length < SEARCH_MIN_CHARS}
                        className="btn btn-primary w-full py-2 disabled:opacity-40"
                    >
                        Search
                    </button>
                </div>
                </div>
                )}

            {/* Results section */}
            <div className="mt-4">
                {/* No query entered */}
                {!shouldFetch && (
                    <p className="text-text/50 text-sm">
                        {searchType === 'media'
                            ? 'Search for movies, games, books, and more'
                            : `Search for ${searchType}.`}
                    </p>
                )}

                {/* Loading */}
                {shouldFetch && isLoading && (
                    <p className="text-text/50 text-sm">Searching…</p>
                )}

                {/* Media results */}
                {searchType === 'media' && shouldFetch && !isLoading && (
                    <>
                        {mediaResults && mediaResults.data.length === 0 && (
                            <p className="text-text/50 text-sm">No results for "{query}".</p>
                        )}
                        {mediaHasResults && (
                            <>
                                <p className="text-xs text-text/40 mb-2">
                                    Page {page}{hasNextPage ? '' : ' (end)'}
                                </p>
                                <div className="rounded-lg border border-border overflow-hidden">
                                    {mediaResults.data.map(result => (
                                        <RowItemStyling
                                            key={result.externalId}
                                            onClick={() => handleMediaResultClick(result)}
                                        >
                                            <RowItemContent
                                                firstString={result.name}
                                                secondString={result.creatorName ?? undefined}
                                                photographOnLeft={result.thumbnailUrl ?? undefined}
                                                thirdString={
                                                    result.publishedDate
                                                        ? new Date(result.publishedDate).getFullYear().toString()
                                                        : undefined
                                                }
                                                larger
                                            />
                                        </RowItemStyling>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                    <button
                                        className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-40"
                                        disabled={!hasPrevPage}
                                        onClick={() => handlePageChange(page - 1)}
                                    >
                                        ← Prev
                                    </button>
                                    <span className="text-sm text-text/60">Page {page}</span>
                                    <button
                                        className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-40"
                                        disabled={!hasNextPage}
                                        onClick={() => handlePageChange(page + 1)}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Cache status for media */}
                {searchType === 'media' && shouldFetch && !isLoading && mediaResults && (
                    <CacheStatusPill cacheMetadata={mediaResults.cacheMetadata} />
                )}

                {/* Tags results */}
                {searchType === 'tags' && shouldFetch && !isLoading && (
                    <>
                        {tagResults && tagResults.length === 0 && (
                            <p className="text-text/50 text-sm">No tags found for "{query}".</p>
                        )}
                        {tagsHasResults && (
                            <div className="rounded-lg border border-border overflow-hidden">
                                {tagResults.map(tag => (
                                    <RowItemStyling
                                        key={tag.id}
                                        onClick={() => navigate(`/tags/${tag.id}/items`)}
                                    >
                                        <RowItemContent
                                            firstString={tag.name}
                                            secondString={String(tag.visibilityStatus)}
                                        />
                                    </RowItemStyling>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Lists results */}
                {searchType === 'lists' && shouldFetch && !isLoading && (
                    <>
                        {listResults && listResults.length === 0 && (
                            <p className="text-text/50 text-sm">No lists found for "{query}".</p>
                        )}
                        {listsHasResults && (
                            <div className="rounded-lg border border-border overflow-hidden">
                                {listResults.map(list => (
                                    <RowItemStyling
                                        key={list.id}
                                        onClick={() => navigate(`/medialist/${list.id}`)}
                                    >
                                        <RowItemContent firstString={list.name} />
                                    </RowItemStyling>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
        </AnimatedPage>
    )
}

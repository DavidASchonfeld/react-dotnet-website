import { useRef } from 'react'
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
    const detailsRef = useRef<HTMLDetailsElement>(null)

    // Parse URL parameters
    const query = searchParams.get('q') ?? ''
    const apiSourceIdParam = searchParams.get('api')
    const subtypeParam = searchParams.get('subtype') ?? undefined
    const pageParam = searchParams.get('page')
    const showFiltersParam = searchParams.get('showFilters') === 'true'
    const page = Math.max(1, parseInt(pageParam ?? '1') || 1)

    const searchType = (searchParams.get('type') ?? 'media') as SearchType
    const scope = (searchParams.get('scope') ?? 'all') as SearchScope

    const { data: activeSources } = useGetActiveApiSourcesQuery()

    // Derive apiSourceId
    const parsedApiSourceId = apiSourceIdParam ? parseInt(apiSourceIdParam) : null
    const apiSourceId = (parsedApiSourceId && !isNaN(parsedApiSourceId))
        ? parsedApiSourceId
        : (activeSources?.[0]?.id ?? null)

    const selectedSource = activeSources?.find(s => s.id === apiSourceId)
    const mediaTypeId = selectedSource?.mediaTypeId ?? null
    const availableSubtypes = selectedSource ? (API_SUBTYPES[selectedSource.apiName] ?? []) : []
    const activeSubtype = availableSubtypes.find(s => s.value === subtypeParam)?.value ?? undefined

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

    // Handlers for form controls
    const handleApiSourceChange = (id: number) => {
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            params.set('api', String(id))
            params.delete('subtype')
            params.set('page', '1')
            return params
        })
    }

    const handleSubtypeChange = (newSubtype: string) => {
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            if (newSubtype) {
                params.set('subtype', newSubtype)
            } else {
                params.delete('subtype')
            }
            params.set('page', '1')
            return params
        })
    }

    const handleTypeChange = (newType: SearchType) => {
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            params.set('type', newType)
            params.set('page', '1')
            if (newType !== 'media') {
                params.delete('api')
                params.delete('subtype')
            }
            return params
        })
    }

    const handleScopeChange = (newScope: SearchScope) => {
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            params.set('scope', newScope)
            params.set('page', '1')
            return params
        })
    }

    const handleFilterSearch = () => {
        if (query.length < SEARCH_MIN_CHARS) return
        // Remove showFilters param and auto-close the details element
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            params.delete('showFilters')
            return params
        })
        if (detailsRef.current) {
            detailsRef.current.open = false
        }
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
        const effectiveApiSourceId = apiSourceId
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            params.set('q', newQuery)
            params.set('type', searchType)
            params.set('scope', scope)
            params.set('page', '1')
            if (searchType === 'media' && effectiveApiSourceId) {
                params.set('api', String(effectiveApiSourceId))
            }
            if (searchType === 'media' && activeSubtype) {
                params.set('subtype', activeSubtype)
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

    // Determine if filters should be open by default
    const shouldShowFilters = showFiltersParam || (!query && query === '')

    return (
        <AnimatedPage>
        <div className="page">
            <h1 className="h1-styling">Search</h1>

            {/* Search bar */}
            <SearchBar
                mode="on-submit"
                isTop={false}
                effectiveMinimized={false}
                defaultQuery={query}
                defaultApiSourceId={apiSourceId ?? undefined}
                onSubmit={handleSearchSubmit}
                showApiSourcePills={false}
            />

            {/* Collapsible Advanced Filters */}
            <details
                ref={detailsRef}
                open={shouldShowFilters}
                className="mt-4 p-4 border border-border rounded-lg bg-surface cursor-pointer group"
            >
                <summary className="text-sm font-semibold text-text cursor-pointer hover:text-primary transition-colors">
                    Advanced Filters
                </summary>

                <div className="mt-4 space-y-4">
                    {/* Search type selector */}
                    <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Type</p>
                        <div className="flex flex-wrap gap-2">
                            {SEARCH_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleTypeChange(t.id)}
                                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                        searchType === t.id
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
                    {searchType === 'media' && activeSources && activeSources.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">API</p>
                            <div className="flex flex-wrap gap-2">
                                {activeSources.map(source => (
                                    <button
                                        key={source.id}
                                        onClick={() => handleApiSourceChange(source.id)}
                                        className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                            apiSourceId === source.id
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
                    {searchType === 'media' && availableSubtypes.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Search for
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {availableSubtypes.map(sub => (
                                    <button
                                        key={sub.value}
                                        onClick={() => handleSubtypeChange(sub.value === activeSubtype ? '' : sub.value)}
                                        className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                            activeSubtype === sub.value
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
                    {searchType !== 'media' && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Scope</p>
                            <div className="flex gap-2">
                                {(['all', 'mine'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleScopeChange(s)}
                                        className={`px-3 py-1 rounded-full border text-sm transition-colors capitalize ${
                                            scope === s
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
            </details>

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

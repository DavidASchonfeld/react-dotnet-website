import { useSearchParams, useNavigate } from 'react-router-dom'
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
import type { ExternalApiSearchResult } from '../types/externalApiSearch'
import { SEARCH_MIN_CHARS, SEARCH_DEFAULT_LIMIT, API_SUBTYPES } from '../constants'

const PAGE_SIZE = SEARCH_DEFAULT_LIMIT

// Search type options displayed as tabs at the top of results
const SEARCH_TYPES = [
    { id: 'media', label: 'Media' },
    { id: 'tags',  label: 'Tags'  },
    { id: 'lists', label: 'Lists' },
] as const

type SearchType = 'media' | 'tags' | 'lists'
type SearchScope = 'all' | 'mine'

export default function SearchResultsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    const query = searchParams.get('q') ?? ''
    const apiSourceIdParam = searchParams.get('api')
    const subtypeParam = searchParams.get('subtype') ?? undefined
    const pageParam = searchParams.get('page')
    const page = Math.max(1, parseInt(pageParam ?? '1') || 1)

    // New URL params: type (media/tags/lists) and scope (all/mine); defaults keep backward compat
    const searchType = (searchParams.get('type') ?? 'media') as SearchType
    const scope = (searchParams.get('scope') ?? 'all') as SearchScope

    const { data: activeSources } = useGetActiveApiSourcesQuery()

    // Derive apiSourceId from URL or fall back to first active source
    const parsedApiSourceId = apiSourceIdParam ? parseInt(apiSourceIdParam) : null
    const apiSourceId = (parsedApiSourceId && !isNaN(parsedApiSourceId))
        ? parsedApiSourceId
        : (activeSources?.[0]?.id ?? null)

    // Derive mediaTypeId from the selected API source (needed for search endpoint and findOrCreate)
    const selectedSource = activeSources?.find(s => s.id === apiSourceId)
    const mediaTypeId = selectedSource?.mediaTypeId ?? null

    // Subtypes available for the currently selected API
    const availableSubtypes = selectedSource ? (API_SUBTYPES[selectedSource.apiName] ?? []) : []
    const activeSubtype = availableSubtypes.find(s => s.value === subtypeParam)?.value ?? undefined

    const shouldFetch = query.length >= SEARCH_MIN_CHARS

    // ---- Media search (external API) ----
    const { data: mediaResults, isLoading: mediaLoading, isFetching: mediaFetching } =
        useSearchExternalApiQuery(
            { query, mediaTypeId: mediaTypeId!, limit: PAGE_SIZE, page, subtype: activeSubtype },
            { skip: !shouldFetch || searchType !== 'media' || mediaTypeId === null }
        )

    // ---- Tags search ----
    const { data: tagResults, isLoading: tagsLoading, isFetching: tagsFetching } =
        useSearchCustomTagsQuery(
            { query, limit: PAGE_SIZE, mineOnly: scope === 'mine' },
            { skip: !shouldFetch || searchType !== 'tags' }
        )

    // ---- Lists search ----
    const { data: listResults, isLoading: listsLoading, isFetching: listsFetching } =
        useSearchMediaListsQuery(
            { query, limit: PAGE_SIZE, mineOnly: scope === 'mine' },
            { skip: !shouldFetch || searchType !== 'lists' }
        )

    const [findOrCreate] = useFindOrCreateMediaApiRefMutation()

    // Navigate to a media item's detail page after finding/creating the DB record
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

    // Preserve all current URL params when submitting a new query
    const handleSearchSubmit = (newQuery: string, newApiSourceId?: number) => {
        const effectiveApiSourceId = newApiSourceId ?? apiSourceId
        setSearchParams({
            q: newQuery,
            type: searchType,
            scope,
            ...(searchType === 'media' && effectiveApiSourceId ? { api: String(effectiveApiSourceId) } : {}),
            ...(searchType === 'media' && activeSubtype ? { subtype: activeSubtype } : {}),
            page: '1',
        })
    }

    // Switching API source — resets subtype since each API has different subtypes
    const handleApiSourceChange = (newApiSourceId: number) => {
        setSearchParams({ q: query, type: searchType, scope, api: String(newApiSourceId), page: '1' })
    }

    // Switching subtype filter
    const handleSubtypeChange = (newSubtype: string) => {
        const params: Record<string, string> = { q: query, type: searchType, scope, page: '1' }
        if (apiSourceId) params.api = String(apiSourceId)
        if (newSubtype) params.subtype = newSubtype
        setSearchParams(params)
    }

    // Switching search type tab (Media/Tags/Lists) resets page and clears api/subtype if leaving Media
    const handleTypeChange = (newType: SearchType) => {
        const params: Record<string, string> = { q: query, type: newType, scope, page: '1' }
        if (newType === 'media' && apiSourceId) params.api = String(apiSourceId)
        setSearchParams(params)
    }

    // Pagination is only used for Media results (tags/lists results are a single page)
    const handlePageChange = (newPage: number) => {
        const params: Record<string, string> = { q: query, type: searchType, scope, page: String(newPage) }
        if (apiSourceId) params.api = String(apiSourceId)
        if (activeSubtype) params.subtype = activeSubtype
        setSearchParams(params)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Derive display state per type
    const isLoading_ = mediaLoading || mediaFetching || tagsLoading || tagsFetching || listsLoading || listsFetching
    const mediaHasResults = mediaResults && mediaResults.length > 0
    const tagsHasResults  = tagResults  && tagResults.length  > 0
    const listsHasResults = listResults && listResults.length > 0
    const hasNextPage = mediaResults && mediaResults.length === PAGE_SIZE
    const hasPrevPage = page > 1

    return (
        <AnimatedPage>
        <div className="page">
            <h1 className="h1-styling">Search</h1>

            {/* Search bar (on-submit mode) — API source pills hidden here; handled below */}
            <SearchBar
                mode="on-submit"
                isTop={false}
                effectiveMinimized={false}
                defaultQuery={query}
                defaultApiSourceId={apiSourceId ?? undefined}
                onSubmit={handleSearchSubmit}
                showApiSourcePills={false}
            />

            {/* Search type tabs: Media | Tags | Lists */}
            <div className="flex flex-wrap gap-2 mt-3">
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

            {/* API source pills — only shown in Media mode */}
            {searchType === 'media' && activeSources && activeSources.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
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
            )}

            {/* Subtype pills — shown when the selected API has subtypes */}
            {searchType === 'media' && availableSubtypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                    {availableSubtypes.map(sub => (
                        <button
                            key={sub.value}
                            onClick={() => handleSubtypeChange(sub.value)}
                            className={`px-2.5 py-0.5 rounded-full border text-xs transition-colors ${
                                activeSubtype === sub.value
                                    ? 'bg-primary/20 text-primary border-primary/40'
                                    : 'border-border text-text/50 hover:border-primary/40 hover:text-text/80'
                            }`}
                        >
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Scope indicator for Tags/Lists — reminds user which filter is active */}
            {searchType !== 'media' && scope === 'mine' && (
                <p className="text-xs text-text/50 mt-1">Showing only your {searchType}</p>
            )}

            {/* Results area */}
            <div className="mt-4">

                {/* No query entered yet */}
                {!shouldFetch && (
                    <p className="text-text/50 text-sm">Search for {searchType === 'media' ? 'movies, games, books, and more' : searchType}.</p>
                )}

                {/* Loading */}
                {shouldFetch && isLoading_ && (
                    <p className="text-text/50 text-sm">Searching…</p>
                )}

                {/* ---- Media results ---- */}
                {searchType === 'media' && shouldFetch && !isLoading_ && (
                    <>
                        {mediaResults && mediaResults.length === 0 && (
                            <p className="text-text/50 text-sm">No results for "{query}".</p>
                        )}
                        {mediaHasResults && (
                            <>
                                <p className="text-xs text-text/40 mb-2">
                                    Page {page}{hasNextPage ? '' : ' (end)'}
                                </p>
                                <div className="rounded-lg border border-border overflow-hidden">
                                    {mediaResults.map(result => (
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
                                {/* Pagination (media only — tags/lists return a single page) */}
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

                {/* ---- Tags results ---- */}
                {searchType === 'tags' && shouldFetch && !isLoading_ && (
                    <>
                        {tagResults && tagResults.length === 0 && (
                            <p className="text-text/50 text-sm">No tags found for "{query}".</p>
                        )}
                        {tagsHasResults && (
                            <div className="rounded-lg border border-border overflow-hidden">
                                {tagResults.map(tag => (
                                    // Clicking a tag navigates to its items page
                                    <RowItemStyling
                                        key={tag.id}
                                        onClick={() => navigate(`/tags/${tag.id}/items`)}
                                    >
                                        <RowItemContent
                                            firstString={tag.name}
                                            secondString={tag.visibilityStatus}
                                        />
                                    </RowItemStyling>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ---- Lists results ---- */}
                {searchType === 'lists' && shouldFetch && !isLoading_ && (
                    <>
                        {listResults && listResults.length === 0 && (
                            <p className="text-text/50 text-sm">No lists found for "{query}".</p>
                        )}
                        {listsHasResults && (
                            <div className="rounded-lg border border-border overflow-hidden">
                                {listResults.map(list => (
                                    // Clicking a list navigates to its detail page
                                    <RowItemStyling
                                        key={list.id}
                                        onClick={() => navigate(`/medialist/${list.id}`)}
                                    >
                                        <RowItemContent
                                            firstString={list.name}
                                        />
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

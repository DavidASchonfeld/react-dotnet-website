import { useSearchParams, useNavigate } from 'react-router-dom'
import {
    useSearchExternalApiQuery,
    useFindOrCreateMediaApiRefMutation,
    useGetAllApprovedMediaTypesQuery,
    useGetActiveApiSourcesQuery,
} from '../services/apiSlice'
import AnimatedPage from '../components/AnimatedPage'
import SearchBar from '../components/SearchBar'
import RowItemStyling from '../components/RowItemStyling'
import RowItemContent from '../components/RowItemContent'
import type { ExternalApiSearchResult } from '../types/externalApiSearch'
import { SEARCH_MIN_CHARS, SEARCH_DEFAULT_LIMIT } from '../constants'

const PAGE_SIZE = SEARCH_DEFAULT_LIMIT

export default function SearchResultsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    const query = searchParams.get('q') ?? ''
    const mediaTypeIdParam = searchParams.get('mediaType')
    const pageParam = searchParams.get('page')
    const page = Math.max(1, parseInt(pageParam ?? '1') || 1)

    const { data: mediaTypes } = useGetAllApprovedMediaTypesQuery()
    const { data: activeSources } = useGetActiveApiSourcesQuery()

    // Derive mediaTypeId: use URL param if valid, otherwise fall back to first type
    const parsedMediaTypeId = mediaTypeIdParam ? parseInt(mediaTypeIdParam) : null
    const mediaTypeId = (parsedMediaTypeId && !isNaN(parsedMediaTypeId))
        ? parsedMediaTypeId
        : (mediaTypes?.[0]?.id ?? null)

    const shouldFetch = query.length >= SEARCH_MIN_CHARS && mediaTypeId !== null

    const { data: results, isLoading, isFetching } = useSearchExternalApiQuery(
        { query, mediaTypeId: mediaTypeId!, limit: PAGE_SIZE, page },
        { skip: !shouldFetch }
    )

    const [findOrCreate] = useFindOrCreateMediaApiRefMutation()

    const handleResultClick = async (result: ExternalApiSearchResult) => {
        if (mediaTypeId === null) return
        const activeSource = activeSources?.find(s => s.mediaTypeId === mediaTypeId)
        if (!activeSource) return

        try {
            const created = await findOrCreate({
                externalApiSourceId: activeSource.id,
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

    const handleSearchSubmit = (newQuery: string, newMediaTypeId: number) => {
        setSearchParams({ q: newQuery, mediaType: String(newMediaTypeId), page: '1' })
    }

    const handleMediaTypeChange = (newMediaTypeId: number) => {
        setSearchParams({ q: query, mediaType: String(newMediaTypeId), page: '1' })
    }

    const handlePageChange = (newPage: number) => {
        setSearchParams({ q: query, mediaType: String(mediaTypeId ?? ''), page: String(newPage) })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const isLoading_ = isLoading || isFetching
    const hasResults = results && results.length > 0
    // Heuristic: if we got a full page back, there may be more
    const hasNextPage = results && results.length === PAGE_SIZE
    const hasPrevPage = page > 1

    return (
        <AnimatedPage>
        <div className="page">
            <h1 className="h1-styling">Search</h1>

            {/* Search bar (on-submit mode) */}
            <SearchBar
                mode="on-submit"
                isTop={false}
                effectiveMinimized={false}
                defaultQuery={query}
                defaultMediaTypeId={mediaTypeId ?? undefined}
                onSubmit={handleSearchSubmit}
            />

            {/* Media type filter tabs */}
            {mediaTypes && mediaTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {mediaTypes.map(type => (
                        <button
                            key={type.id}
                            onClick={() => handleMediaTypeChange(type.id)}
                            className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                mediaTypeId === type.id
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                            }`}
                        >
                            {type.icon} {type.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Results area */}
            <div className="mt-4">
                {/* No query yet */}
                {!shouldFetch && (
                    <p className="text-text/50 text-sm">Search for movies, games, books, and more.</p>
                )}

                {/* Loading */}
                {shouldFetch && isLoading_ && (
                    <p className="text-text/50 text-sm">Searching…</p>
                )}

                {/* Empty */}
                {shouldFetch && !isLoading_ && results && results.length === 0 && (
                    <p className="text-text/50 text-sm">No results for "{query}".</p>
                )}

                {/* Results list */}
                {hasResults && !isLoading_ && (
                    <>
                        <p className="text-xs text-text/40 mb-2">
                            Page {page}{hasNextPage ? '' : ' (end)'}
                        </p>

                        <div className="rounded-lg border border-border overflow-hidden">
                            {results.map(result => (
                                <RowItemStyling
                                    key={result.externalId}
                                    onClick={() => handleResultClick(result)}
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

                        {/* Pagination */}
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
            </div>
        </div>
        </AnimatedPage>
    )
}

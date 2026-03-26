import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'
import {
    useSearchExternalApiQuery,
    useFindOrCreateMediaApiRefMutation,
    useGetActiveApiSourcesQuery,
    useSearchCustomTagsQuery,
    useSearchMediaListsQuery,
    useLazySearchMediaListsQuery,
    useLazySearchCustomTagsQuery,
    useAddMediaApiRefToListByExternalRefMutation,
    useRemoveMediaApiRefFromListByExternalRefMutation,
    useAddTagToMediaApiRefMutation,
    useRemoveTagFromMediaApiRefMutation,
} from '../services/apiSlice'
import AnimatedPage from '../components/AnimatedPage'
import SearchBarWithFilters from '../components/SearchBarWithFilters'
import type { FilterState, SearchType } from '../components/SearchBarWithFilters'
import RowItemStyling from '../components/row_item_related/RowItemStyling'
import RowItemContent from '../components/row_item_related/RowItemContent'
import { AdminItemStatusPanel } from '../components/administrator_related/AdminItemStatusPanel'
import type { ExternalApiSearchResult } from '../types/externalApiSearch'
import { SEARCH_MIN_CHARS, SEARCH_DEFAULT_LIMIT, API_SUBTYPES } from '../constants'
import ManageLinkModal from '../components/modals/ManageLinkModal'
import { routes } from '../utils/routes'
import { mediaApiRefActions } from '../utils/menuActions'

const PAGE_SIZE = SEARCH_DEFAULT_LIMIT

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

    const shouldShowFilters = showFiltersParam || !query

    const urlSearchType = (searchParams.get('type') ?? 'media') as SearchType
    // For media: API-specific subtype. For tags/lists: scope ('all' | 'mine'), defaulting to 'all'.
    const subtypeForNonMedia = subtypeParam ?? 'all'

    const { data: activeSources } = useGetActiveApiSourcesQuery()

    const parsedApiSourceId = apiSourceIdParam ? parseInt(apiSourceIdParam) : null
    const apiSourceId = (parsedApiSourceId && !isNaN(parsedApiSourceId))
        ? parsedApiSourceId
        : (activeSources?.[0]?.id ?? null)

    const selectedSource = activeSources?.find(s => s.id === apiSourceId)
    const mediaTypeId = selectedSource?.mediaTypeId ?? null
    const availableSubtypes = selectedSource ? (API_SUBTYPES[selectedSource.apiName] ?? []) : []
    const activeSubtype = availableSubtypes.find(s => s.value === subtypeParam)?.value ?? undefined

    const isAdmin = roleLevel === 'Administrator'
    const isModerator = roleLevel === 'Moderator' || roleLevel === 'Administrator'
    const shouldFetch = query.length >= SEARCH_MIN_CHARS

    const [activeBypassCache, setActiveBypassCache] = useState(false)

    // Link modal state — opened by clicking "+" on a media result
    const [selectedResult, setSelectedResult] = useState<ExternalApiSearchResult | null>(null)
    // Tracks which type is active so the modal remounts on switch (fresh linkedIds)
    const [activeModalType, setActiveModalType] = useState<SearchType>('lists')

    // Lazy queries + mutations for the link modal
    const [triggerSearchLists, { data: listSearchData, isFetching: isSearchingLists }] = useLazySearchMediaListsQuery()
    const [triggerSearchTags, { data: tagSearchData, isFetching: isSearchingTags }] = useLazySearchCustomTagsQuery()
    const [addToListByExternalRef] = useAddMediaApiRefToListByExternalRefMutation()
    const [removeFromListByExternalRef] = useRemoveMediaApiRefFromListByExternalRefMutation()
    const [addTag] = useAddTagToMediaApiRefMutation()
    const [removeTag] = useRemoveTagFromMediaApiRefMutation()

    // API queries
    const { data: mediaResults, isLoading: mediaLoading, isFetching: mediaFetching } =
        useSearchExternalApiQuery(
            { query, mediaTypeId: mediaTypeId!, limit: PAGE_SIZE, page, subtype: activeSubtype, bypassCache: isAdmin && activeBypassCache },
            { skip: !shouldFetch || urlSearchType !== 'media' || mediaTypeId === null }
        )

    const { data: tagResults, isLoading: tagsLoading, isFetching: tagsFetching } =
        useSearchCustomTagsQuery(
            { query, limit: PAGE_SIZE, mineOnly: subtypeForNonMedia === 'mine' },
            { skip: !shouldFetch || urlSearchType !== 'tags' }
        )

    const { data: listResults, isLoading: listsLoading, isFetching: listsFetching } =
        useSearchMediaListsQuery(
            { query, limit: PAGE_SIZE, mineOnly: subtypeForNonMedia === 'mine' },
            { skip: !shouldFetch || urlSearchType !== 'lists' }
        )

    const [findOrCreate] = useFindOrCreateMediaApiRefMutation()

    const handleSearch = (newQuery: string, filters: FilterState, bypassCache: boolean) => {
        setActiveBypassCache(bypassCache)
        setSearchParams(prev => {
            const params = new URLSearchParams(prev)
            params.set('q', newQuery)
            params.set('type', filters.searchType)
            params.set('page', '1')
            if (filters.searchType === 'media' && filters.apiSourceId !== null) {
                params.set('api', String(filters.apiSourceId))
            } else {
                params.delete('api')
            }
            // For media: store API subtype. For tags/lists: store scope — omit 'all' (it's the default).
            if (filters.subtype && filters.subtype !== 'all') {
                params.set('subtype', filters.subtype)
            } else {
                params.delete('subtype')
            }
            params.delete('scope')
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

            <SearchBarWithFilters
                query={query}
                defaultApiSourceId={apiSourceId ?? null}
                urlFilters={{ searchType: urlSearchType, apiSourceId: parsedApiSourceId, subtype: urlSearchType === 'media' ? subtypeParam : subtypeForNonMedia }}
                activeApiSources={activeSources}
                isModerator={isModerator}
                isAdmin={isAdmin}
                roleLevel={roleLevel}
                shouldShowFilters={shouldShowFilters}
                onSearch={handleSearch}
            />

            {/* Results section */}
            <div className="mt-4">
                {/* No query entered */}
                {!shouldFetch && (
                    <p className="text-text/50 text-sm">
                        {urlSearchType === 'media'
                            ? 'Search for movies, games, books, and more'
                            : `Search for ${urlSearchType}.`}
                    </p>
                )}

                {/* Loading */}
                {shouldFetch && isLoading && (
                    <p className="text-text/50 text-sm">Searching…</p>
                )}

                {/* Media results */}
                {urlSearchType === 'media' && shouldFetch && !isLoading && (
                    <>
                        {mediaResults && (
                            <AdminItemStatusPanel cacheMetadata={mediaResults.cacheMetadata} showRefInDb={false} />
                        )}

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
                                        <RowItemStyling key={result.externalId}>
                                            <RowItemContent
                                                firstString={
                                                    result.publishedDate
                                                        ? `${result.name} (${new Date(result.publishedDate).getFullYear()})`
                                                        : result.name
                                                }
                                                secondString={result.creatorName ?? undefined}
                                                photographOnLeft={result.thumbnailUrl ?? undefined}
                                                larger
                                                onClick={() => navigate(routes.mediaApiRef(selectedSource!.apiName, result.externalId))}
                                                onMenuClick={mediaApiRefActions({
                                                    apiName: selectedSource!.apiName,
                                                    externalId: result.externalId,
                                                    name: result.name,
                                                    navigate,
                                                    onManageListsTagsOpen: () => {
                                                        setSelectedResult(result)
                                                        setActiveModalType('lists')
                                                    },
                                                })}
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

                {/* Tags results */}
                {urlSearchType === 'tags' && shouldFetch && !isLoading && (
                    <>
                        {tagResults && tagResults.length === 0 && (
                            <p className="text-text/50 text-sm">No tags found for "{query}".</p>
                        )}
                        {tagsHasResults && (
                            <div className="rounded-lg border border-border overflow-hidden">
                                {tagResults.map(tag => (
                                    <RowItemStyling
                                        key={tag.id}
                                        onClick={() => navigate(routes.tagItems(tag.id))}
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
                {urlSearchType === 'lists' && shouldFetch && !isLoading && (
                    <>
                        {listResults && listResults.length === 0 && (
                            <p className="text-text/50 text-sm">No lists found for "{query}".</p>
                        )}
                        {listsHasResults && (
                            <div className="rounded-lg border border-border overflow-hidden">
                                {listResults.map(list => (
                                    <RowItemStyling
                                        key={list.id}
                                        onClick={() => navigate(routes.mediaList(list.id))}
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

        {/* Link modal — add selected media result to a list or tag it */}
        {selectedResult && (
            <ManageLinkModal
                key={activeModalType}  // remount on type switch so linkedIds reset
                modalTitle={activeModalType === 'lists' ? 'Add to Lists' : 'Tag this Item'}
                allowedSearchTypes={['lists', 'tags']}
                onSearch={(query, filters) => {
                    if (filters.searchType !== activeModalType) setActiveModalType(filters.searchType)
                    if (filters.searchType === 'lists') triggerSearchLists({ query, limit: SEARCH_DEFAULT_LIMIT });
                    else triggerSearchTags({ query, limit: SEARCH_DEFAULT_LIMIT });
                }}
                candidates={activeModalType === 'lists'
                    ? (listSearchData ?? []).map(l => ({ id: String(l.id), firstString: l.name, secondString: l.description ?? undefined }))
                    : (tagSearchData ?? []).map(t => ({ id: String(t.id), firstString: t.name }))}
                candidatesLoading={isSearchingLists || isSearchingTags}
                initialLinkedIds={[]}  // unknown without findOrCreate; empty is safe
                onAdd={async (id) => {
                    const source = activeSources?.find(s => s.mediaTypeId === mediaTypeId)
                    if (!source) return
                    if (activeModalType === 'lists') {
                        // Single backend call: finds or creates the MediaApiRef then links it idempotently
                        await addToListByExternalRef({
                            listId: parseInt(id),
                            data: {
                                externalApiSourceId: source.id,
                                externalId: selectedResult.externalId,
                                name: selectedResult.name,
                                mediaTypeId: mediaTypeId!,
                                creatorName: selectedResult.creatorName,
                                publishedDate: selectedResult.publishedDate,
                                thumbnailUrl: selectedResult.thumbnailUrl,
                            },
                        }).unwrap()
                    } else {
                        // Tags: ensure MediaApiRef exists first, then tag it
                        const ref = await findOrCreate({
                            externalApiSourceId: source.id,
                            externalId: selectedResult.externalId,
                            name: selectedResult.name,
                            mediaTypeId: mediaTypeId!,
                            creatorName: selectedResult.creatorName,
                            publishedDate: selectedResult.publishedDate,
                            thumbnailUrl: selectedResult.thumbnailUrl,
                        }).unwrap()
                        await addTag({ tagId: parseInt(id), mediaApiRefId: ref.id }).unwrap()
                    }
                }}
                onRemove={async (id) => {
                    const source = activeSources?.find(s => s.mediaTypeId === mediaTypeId)
                    if (!source) return
                    if (activeModalType === 'lists') {
                        // Single backend call: finds the MediaApiRef by external key and removes idempotently
                        await removeFromListByExternalRef({
                            listId: parseInt(id),
                            externalApiSourceId: source.id,
                            externalId: selectedResult.externalId,
                        }).unwrap()
                    } else {
                        // Tags: ensure MediaApiRef exists first, then untag it
                        const ref = await findOrCreate({
                            externalApiSourceId: source.id,
                            externalId: selectedResult.externalId,
                            name: selectedResult.name,
                            mediaTypeId: mediaTypeId!,
                            creatorName: selectedResult.creatorName,
                            publishedDate: selectedResult.publishedDate,
                            thumbnailUrl: selectedResult.thumbnailUrl,
                        }).unwrap()
                        await removeTag({ tagId: parseInt(id), mediaApiRefId: ref.id }).unwrap()
                    }
                }}
                removeConfirmTitle={activeModalType === 'lists' ? 'Remove from list?' : 'Remove tag?'}
                getRemoveConfirmMessage={(item) => `Remove "${item.firstString}"?`}
                onClose={() => setSelectedResult(null)}
            />
        )}

        </AnimatedPage>
    )
}

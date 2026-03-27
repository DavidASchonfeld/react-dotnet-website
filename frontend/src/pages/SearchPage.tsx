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
    useAddMediaApiRefToListByExternalRefMutation,
    useRemoveMediaApiRefFromListByExternalRefMutation,
    useAddTagToMediaApiRefMutation,
    useRemoveTagFromMediaApiRefMutation,
    useGetMyMediaListsQuery,
    useCreateMediaListMutation,
    useDeleteMediaListMutation,
    useGetMyCustomTagsQuery,
    useCreateCustomTagMutation,
    usePatchCustomTagMutation,
    useDeleteCustomTagMutation,
} from '../services/apiSlice'
import AnimatedPage from '../components/AnimatedPage'
import SearchBarWithFilters from '../components/SearchBarWithFilters'
import type { FilterState, SearchType } from '../components/SearchBarWithFilters'
import RowItemStyling from '../components/row_item_related/RowItemStyling'
import RowItemContent from '../components/row_item_related/RowItemContent'
import ListCollageThumb from '../components/ListCollageThumb'
import { AdminItemStatusPanel } from '../components/administrator_related/AdminItemStatusPanel'
import type { ExternalApiSearchResult } from '../types/externalApiSearch'
import { SEARCH_MIN_CHARS, SEARCH_DEFAULT_LIMIT, API_SUBTYPES, DEFAULT_SITE_SEARCH_SUBTYPE } from '../constants'
import ManageLinkModal from '../components/modals/ManageLinkModal'
import { useManageLinkModalSearch } from '../hooks/useManageLinkModalSearch'
import NameAndDescriptionModal from '../components/modals/NameAndDescriptionModal'
import ConfirmModal from '../components/modals/ConfirmModal'
import BadgePill from '../components/BadgePill'
import { routes } from '../utils/routes'
import { mediaApiRefActions, mediaListActions, tagActions } from '../utils/menuActions'
import { mediaApiRefToRowItemProps } from '../utils/mediaApiRefAdapter'
import { VisibilityStatus, MediaListCategory } from '../types/enums'

const PAGE_SIZE = SEARCH_DEFAULT_LIMIT

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const { roleLevel } = useSelector((state: RootState) => state.auth)
    const isAdmin = roleLevel === 'Administrator'

    // Parse URL parameters
    const query = searchParams.get('q') ?? ''
    const apiSourceIdParam = searchParams.get('api')
    const subtypeParam = searchParams.get('subtype') ?? undefined
    const pageParam = searchParams.get('page')
    const showFiltersParam = searchParams.get('showFilters') === 'true'
    const page = Math.max(1, parseInt(pageParam ?? '1') || 1)

    const urlSearchType = (searchParams.get('type') ?? 'media') as SearchType

    const shouldShowFilters = showFiltersParam || (!query && urlSearchType === 'media')
    // For media: API-specific subtype. For tags/lists: scope ('all' | 'mine'), defaulting to 'all'.
    const subtypeForNonMedia = subtypeParam ?? DEFAULT_SITE_SEARCH_SUBTYPE

    const { data: activeSources } = useGetActiveApiSourcesQuery()

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

    const [activeBypassCache, setActiveBypassCache] = useState(false)

    // Link modal state — opened by clicking "+" on a media result
    const [selectedResult, setSelectedResult] = useState<ExternalApiSearchResult | null>(null)
    // Tracks which type is active so the modal remounts on switch (fresh linkedIds)
    const [activeModalType, setActiveModalType] = useState<SearchType>('lists')

    // All search/pagination logic for the modal — candidates, loading, pagination, onSearch, onPageChange
    const modalSearch = useManageLinkModalSearch(activeModalType, !!selectedResult)
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
            { query, limit: PAGE_SIZE, mineOnly: subtypeForNonMedia === 'mine', page },
            { skip: !shouldFetch || urlSearchType !== 'tags' }
        )

    const { data: listResults, isLoading: listsLoading, isFetching: listsFetching } =
        useSearchMediaListsQuery(
            { query, limit: PAGE_SIZE, mineOnly: subtypeForNonMedia === 'mine', page },
            { skip: !shouldFetch || urlSearchType !== 'lists' }
        )

    const [findOrCreate] = useFindOrCreateMediaApiRefMutation()

    // ── My Lists (mine+no-query state) ────────────────────────────────────
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [listToDelete, setListToDelete] = useState<{ id: number; name: string } | null>(null)
    const [createList] = useCreateMediaListMutation()
    const [deleteList] = useDeleteMediaListMutation()

    const { data: myListsResult, isLoading: myListsLoading } = useGetMyMediaListsQuery(
        { page },
        { skip: urlSearchType !== 'lists' || subtypeForNonMedia !== 'mine' || shouldFetch }
    )

    async function handleCreateMediaList(name: string, description: string, visibility: VisibilityStatus) {
        try {
            const newList = await createList({ name, description: description || undefined, visibilityStatus: visibility }).unwrap()
            setShowCreateModal(false)
            navigate(routes.mediaList(newList.id))

        } catch (err) {
            console.error(err)
        }
    }

    async function confirmDelete() {
        if (listToDelete === null) return
        try {
            await deleteList(listToDelete.id).unwrap()
            setListToDelete(null)
        } catch (err) {
            console.error(err)
            setListToDelete(null)
        }
    }

    // ── My Tags (mine+no-query state) ─────────────────────────────────────
    const [showCreateTagModal, setShowCreateTagModal] = useState(false)
    const [editingTag, setEditingTag] = useState<{ id: number; name: string; description?: string | null; visibilityStatus?: VisibilityStatus } | null>(null)
    const [tagToDelete, setTagToDelete] = useState<{ id: number; name: string } | null>(null)
    const [createTag] = useCreateCustomTagMutation()
    const [patchTag] = usePatchCustomTagMutation()
    const [deleteTag] = useDeleteCustomTagMutation()

    const { data: myTagsResult, isLoading: myTagsLoading } = useGetMyCustomTagsQuery(
        { page },
        { skip: urlSearchType !== 'tags' || subtypeForNonMedia !== 'mine' || shouldFetch }
    )

    async function handleCreateTag(name: string, description: string, visibility: VisibilityStatus) {
        await createTag({ name: name.trim(), description: description.trim() || undefined, visibilityStatus: visibility }).unwrap()
        setShowCreateTagModal(false)
    }

    async function handleEditTag(name: string, description: string, visibility: VisibilityStatus) {
        if (!editingTag) return
        await patchTag({ tagId: editingTag.id, data: { name: name.trim(), description: description || undefined, visibilityStatus: visibility } }).unwrap()
        setEditingTag(null)
    }

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
            if (filters.subtype && filters.subtype !== DEFAULT_SITE_SEARCH_SUBTYPE) {
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
    const isListsSearch = urlSearchType === 'lists'
    const isTagsSearch = urlSearchType === 'tags'
    const isMineMode = subtypeForNonMedia === 'mine'
    const isLoading = mediaLoading || mediaFetching || tagsLoading || tagsFetching || listsLoading || listsFetching
    const mediaHasResults = mediaResults && mediaResults.data.length > 0
    const tagsHasResults = tagResults && tagResults.length > 0
    const listsHasResults = listResults && listResults.length > 0
    const hasNextPage = mediaResults && mediaResults.data.length === PAGE_SIZE
    const tagsHasNextPage = tagResults && tagResults.length === PAGE_SIZE
    const listsHasNextPage = listResults && listResults.length === PAGE_SIZE
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
                {!shouldFetch && !isListsSearch && !(isTagsSearch && isMineMode) && (
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
                                        <RowItemStyling key={result.externalId} variant="larger">
                                            <RowItemContent
                                                {...mediaApiRefToRowItemProps(result, { includeYear: false, secondStringField: 'date' })}
                                                larger
                                                onClick={() => navigate(routes.mediaApiRef(selectedSource!.apiName, result.externalId))}
                                                onMenuClick={mediaApiRefActions({
                                                    apiName: selectedSource!.apiName,
                                                    externalId: result.externalId,
                                                    name: result.name,
                                                    navigate,
                                                    onManageListsOpen: () => {
                                                        setSelectedResult(result)
                                                        setActiveModalType('lists')
                                                    },
                                                    onManageTagsOpen: () => {
                                                        setSelectedResult(result)
                                                        setActiveModalType('tags')
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
                                        onClick={() => navigate(routes.tag(tag.id))}
                                    >
                                        <RowItemContent
                                            firstString={tag.name}
                                            secondString={String(tag.visibilityStatus)}
                                            {...(isMineMode ? {
                                                onMenuClick: tagActions({
                                                    id: tag.id,
                                                    name: tag.name,
                                                    navigate,
                                                    // Only show edit/delete when the user can actually perform those actions
                                                    ...((tag.canEdit || (isAdmin && tag.visibilityStatus === VisibilityStatus.Public)) ? {
                                                        onEditOpen: () => setEditingTag({ id: tag.id, name: tag.name, description: tag.description, visibilityStatus: tag.visibilityStatus }),
                                                        onDeleteOpen: () => setTagToDelete({ id: tag.id, name: tag.name }),
                                                    } : {}),
                                                })
                                            } : {})}
                                        />
                                    </RowItemStyling>
                                ))}
                            </div>
                        )}
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
                                disabled={!tagsHasNextPage}
                                onClick={() => handlePageChange(page + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    </>
                )}

                {/* Tags — Create button (mine mode only) */}
                {isTagsSearch && isMineMode && (
                    <button className="btn btn-secondary w-fit" onClick={() => setShowCreateTagModal(true)}>
                        + Create Tag
                    </button>
                )}

                {/* Tags — no-query state: show all user's tags */}
                {isTagsSearch && isMineMode && !shouldFetch && (
                    <>
                        {myTagsLoading && <p className="text-text/50 text-sm">Loading your tags…</p>}
                        {!myTagsLoading && myTagsResult && myTagsResult.items.length === 0 && (
                            <p className="text-text/50 text-sm">You have no tags yet.</p>
                        )}
                        {!myTagsLoading && myTagsResult && myTagsResult.items.length > 0 && (
                            <div className="rounded-lg border border-border overflow-hidden">
                                {myTagsResult.items.map(tag => (
                                    <RowItemStyling key={tag.id}>
                                        <RowItemContent
                                            firstString={tag.name}
                                            secondString={tag.visibilityStatus === VisibilityStatus.Public ? 'Public' : 'Private'}
                                            onClick={() => navigate(routes.tag(tag.id))}
                                            onMenuClick={tagActions({
                                                id: tag.id,
                                                name: tag.name,
                                                navigate,
                                                // Only show edit/delete when the user can actually perform those actions
                                                ...((tag.canEdit || (isAdmin && tag.visibilityStatus === VisibilityStatus.Public)) ? {
                                                    onEditOpen: () => setEditingTag({ id: tag.id, name: tag.name, description: tag.description, visibilityStatus: tag.visibilityStatus }),
                                                    onDeleteOpen: () => setTagToDelete({ id: tag.id, name: tag.name }),
                                                } : {}),
                                            })}
                                        />
                                    </RowItemStyling>
                                ))}
                            </div>
                        )}
                    </>
                )}
                {isTagsSearch && isMineMode && !shouldFetch && myTagsResult && myTagsResult.totalPages > 1 && (
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
                            disabled={page >= myTagsResult.totalPages}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            Next →
                        </button>
                    </div>
                )}

                {/* Lists — Create button (mine mode only) */}
                {isListsSearch && isMineMode && (
                    <button className="btn btn-secondary w-fit" onClick={() => setShowCreateModal(true)}>
                        + Create List
                    </button>
                )}

                {/* Lists — no-query state: show all user's lists */}
                {isListsSearch && isMineMode && !shouldFetch && (
                    <>
                        {myListsLoading && (
                            <p className="text-text/50 text-sm">Loading your lists…</p>
                        )}
                        {!myListsLoading && myListsResult && myListsResult.items.length === 0 && (
                            <p className="text-text/50 text-sm">You have no lists yet.</p>
                        )}
                        {!myListsLoading && myListsResult && myListsResult.items.length > 0 && (
                            <div className="rounded-lg border border-border overflow-hidden">
                                {myListsResult.items.map(list => (
                                    <RowItemStyling key={list.id} variant="larger">
                                        <RowItemContent
                                            firstString={list.name}
                                            secondString={`${list.itemCount} items`}
                                            customLeftElement={<ListCollageThumb urls={list.previewThumbnailUrls} />}
                                            thirdString={list.description ?? undefined}
                                            larger
                                            labelPill={list.category !== MediaListCategory.Standard ? <BadgePill label={
                                                list.category === MediaListCategory.ReadingStatus ? "Reading Status" :
                                                list.category === MediaListCategory.Library ? "Library" :
                                                list.category === MediaListCategory.Featured ? "Featured" : ""
                                            } /> : undefined}
                                            onClick={() => navigate(routes.mediaList(list.id))}
                                            onMenuClick={mediaListActions({
                                                id: list.id,
                                                name: list.name,
                                                navigate,
                                                // Only Standard lists can be deleted; all other categories are protected
                                                ...(list.category === MediaListCategory.Standard ? { onDeleteOpen: () => setListToDelete({ id: list.id, name: list.name }) } : {}),
                                            })}
                                        />
                                    </RowItemStyling>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {isListsSearch && isMineMode && !shouldFetch && myListsResult && myListsResult.totalPages > 1 && (
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
                            disabled={page >= myListsResult.totalPages}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            Next →
                        </button>
                    </div>
                )}

                {/* Lists — no-query state: all-lists mode placeholder */}
                {isListsSearch && !isMineMode && !shouldFetch && (
                    <p className="text-text/50 text-sm">Search for lists.</p>
                )}

                {/* Lists — search results */}
                {isListsSearch && shouldFetch && !isLoading && (
                    <>
                        {listResults && listResults.length === 0 && (
                            <p className="text-text/50 text-sm">No lists found for "{query}".</p>
                        )}
                        {listsHasResults && (
                            <div className="rounded-lg border border-border overflow-hidden">
                                {listResults.map(list => (
                                    <RowItemStyling key={list.id}>
                                        <RowItemContent
                                            firstString={list.name}
                                            customLeftElement={<ListCollageThumb urls={list.previewThumbnailUrls} />}
                                            onClick={() => navigate(routes.mediaList(list.id))}
                                            onMenuClick={mediaListActions({
                                                id: list.id,
                                                name: list.name,
                                                navigate,
                                            })}
                                        />
                                    </RowItemStyling>
                                ))}
                            </div>
                        )}
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
                                disabled={!listsHasNextPage}
                                onClick={() => handlePageChange(page + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* Link modal — add selected media result to a list or tag it */}
        {selectedResult && (
            <ManageLinkModal
                key={activeModalType}  // remount on type switch so linkedIds reset
                modalTitle={activeModalType === 'lists' ? 'Add to Lists' : 'Tag this Item'}
                allowedSearchTypes={[activeModalType]}
                focusedItem={{ firstString: selectedResult.name, secondString: selectedResult.creatorName ?? undefined, photographOnLeft: selectedResult.thumbnailUrl ?? undefined }}
                noteInput={activeModalType === 'tags' ? { label: 'Note (optional)', placeholder: 'Why are you applying this tag?' } : undefined}
                {...modalSearch}
                initialLinkedIds={[]}  // unknown without findOrCreate; empty is safe
                onAdd={async (id, note) => {
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
                        await addTag({ tagId: parseInt(id), mediaApiRefId: ref.id, note }).unwrap()
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

        {showCreateModal && (
            <NameAndDescriptionModal
                mode="create"
                onConfirm={handleCreateMediaList}
                onCancel={() => setShowCreateModal(false)}
            />
        )}

        {showCreateTagModal && (
            <NameAndDescriptionModal
                mode="create"
                showDescription={true}
                showVisibility={true}
                onConfirm={handleCreateTag}
                onCancel={() => setShowCreateTagModal(false)}
            />
        )}

        {editingTag !== null && (
            <NameAndDescriptionModal
                mode="edit"
                initialName={editingTag.name}
                initialDescription={editingTag.description}
                initialVisibility={editingTag.visibilityStatus}
                onConfirm={handleEditTag}
                onCancel={() => setEditingTag(null)}
            />
        )}

        {listToDelete !== null && (
            <ConfirmModal
                title={`Delete "${listToDelete.name}"?`}
                message="This cannot be undone."
                confirmLabel="Delete"
                onConfirm={confirmDelete}
                onCancel={() => setListToDelete(null)}
            />
        )}

        {tagToDelete !== null && (
            <ConfirmModal
                title={`Delete tag "${tagToDelete.name}"?`}
                message="This will remove the tag from all items it has been applied to."
                confirmLabel="Delete"
                onConfirm={async () => {
                    await deleteTag(tagToDelete.id)
                    setTagToDelete(null)
                }}
                onCancel={() => setTagToDelete(null)}
            />
        )}

        </AnimatedPage>
    )
}

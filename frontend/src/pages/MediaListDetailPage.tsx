// React Libraries
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// dnd-kit
import { DndContext, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

// My Code
import type { RootState } from '../store/store';
import {
    useGetMediaListDetailQuery,
    useAddMediaApiRefToListMutation,
    useRemoveMediaApiRefFromListMutation,
    usePatchListBasicInfoMutation,
    useReorderMediaListItemsMutation,
    useLazySearchExternalApiQuery,
    useFindOrCreateMediaApiRefMutation,
    useGetActiveApiSourcesQuery,
} from '../services/apiSlice';
import type { MediaApiRefSummary } from '../types/mediaApiRef';
import { MediaListCategory, VisibilityStatus } from '../types/enums';
import { mediaApiRefToRowItemProps } from '../utils/mediaApiRefAdapter';
import MediaTypeLabel from '../components/MediaTypeLabel';
import BadgePill from '../components/BadgePill';
import SwipeReorderRowItem from '../components/row_item_related/SwipeReorderRowItem';
import RowItemContent from '../components/row_item_related/RowItemContent';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { SEARCH_DEFAULT_LIMIT } from '../constants';
import type { ExternalApiSourceSummary } from '../types/externalApiSource';
import NameAndDescriptionModal from '../components/modals/NameAndDescriptionModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import AnimatedPage from '../components/AnimatedPage';
import BackButton from '../components/BackButton';
import ItemActionsButton from '../components/row_item_related/ItemActionsButton';
import ManageLinkModal from '../components/modals/ManageLinkModal';
import type { DetailItemType } from '../components/modals/detail_panels/DetailSidePanel';
import ListCollageThumb from '../components/ListCollageThumb';
import { routes } from '../utils/routes';
import { makeShareAction, makeGoToDetailsAction, mediaListActions } from '../utils/menuActions';
import { RoleAbilitiesInfoPanel } from '../components/administrator_related/RoleAbilitiesInfoPanel';



export default function MediaListDetailPage() {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { token, roleLevel } = useSelector((state: RootState) => state.auth);
    // Derived from the user's own roleLevel (already in Redux), not from DTO fields
    const isModOrAdmin = roleLevel === 'Moderator' || roleLevel === 'Administrator';
    const isAdmin = roleLevel === 'Administrator';

    const mediaListId = parseInt(id ?? '');
    // RTK Query auto-fetches on mount and auto-cleans cache on unmount.
    // skip=true when the id is invalid to avoid a bad request.
    const { data: selectedMediaListDetail, isLoading, error, refetch } = useGetMediaListDetailQuery(
        mediaListId,
        { skip: isNaN(mediaListId) }
    );

    const [addItemMutation] = useAddMediaApiRefToListMutation();
    const [removeItemMutation] = useRemoveMediaApiRefFromListMutation();
    const [patchListMutation] = usePatchListBasicInfoMutation();
    const [reorderMutation] = useReorderMediaListItemsMutation();
    const [findOrCreate] = useFindOrCreateMediaApiRefMutation();

    // Active API sources tell us which ExternalApiSourceId to use per media type
    const { data: activeApiSources } = useGetActiveApiSourcesQuery();

    // Local state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddBrowsePanel, setShowAddBrowsePanel] = useState(false);

    // Tracks the API source chosen in the last search (needed by onAdd to find-or-create)
    const [currentApiSource, setCurrentApiSource] = useState<ExternalApiSourceSummary | null>(null);
    // Lazy external API search — triggered on SearchBarWithFilters submit
    const [triggerSearch, { data: searchData, isFetching: isSearching }] = useLazySearchExternalApiQuery();
    // Pagination state for the ManageLinkModal search results
    const [searchPage, setSearchPage] = useState(1);
    const [lastSearchParams, setLastSearchParams] = useState<{ query: string; mediaTypeId: number } | null>(null);

    // This is about showing/not showing the modal
    // for confirming if a user wants to remove the selected item in the <ConfirmModal> section
    // from the current MediaList
    const [confirmRemoveItem, setConfirmRemoveItem] = useState<{ id: number; name: string } | null>(null);

    // Local ordered list — kept in sync with the Redux store, updated optimistically on drag
    const [orderedItems, setOrderedItems] = useState<MediaApiRefSummary[]>([]);
    // Shown as an inline banner when a drag-reorder fails to save; cleared on dismiss
    const [reorderError, setReorderError] = useState<string | null>(null);



    // Sync local orderedItems whenever the RTK Query cache updates listContent
    useEffect(() => {
        if (selectedMediaListDetail?.listContent) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOrderedItems(selectedMediaListDetail.listContent);
        }
    }, [selectedMediaListDetail?.listContent]);


    if (isLoading && !selectedMediaListDetail) return <div>Loading...</div>;
    if (error) return <div>Error loading list</div>;
    if (!selectedMediaListDetail) return null;

    // Admin can fully manage (edit, add/remove contents) any public list they don't own
    const adminCanEditPublic = isAdmin && selectedMediaListDetail.visibilityStatus === VisibilityStatus.Public;
    const canEditOrAdmin = selectedMediaListDetail.canEdit || adminCanEditPublic;

    function handleToggleEditMode() {
        if (isEditMode) setShowAddBrowsePanel(false);
        setIsEditMode(prev => !prev);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Compute the new order first so we can use it both for the optimistic UI update
        // and for the API call without needing to read state a second time.
        const oldIndex = orderedItems.findIndex(i => i.id === active.id);
        const newIndex = orderedItems.findIndex(i => i.id === over.id);
        const reordered = arrayMove(orderedItems, oldIndex, newIndex);

        // Optimistic update: show the new order immediately.
        setOrderedItems(reordered);

        // Persist to the backend. On failure: re-fetch the real server order and show a banner.
        reorderMutation({
            mediaListId,
            orderedItemIds: reordered.map(i => i.id),
        })
            .unwrap()
            .catch(() => {
                setReorderError('Failed to save new order. The list has been restored.');
                // Manually refetch since a failed mutation does not invalidate tags
                refetch();
            });
    }


    // Shared fallback item list used by both error boundaries
    // swipeDisabled=true -> buttons always visible (no swipe needed)
    // dragDisabled=true  -> no drag handles
    function renderFallbackItems(swipeDisabled: boolean, dragDisabled: boolean) {
        return orderedItems.map(item => (
            <SwipeReorderRowItem
                key={item.id}
                id={item.id}
                isEditMode={isEditMode}
                dragDisabled={dragDisabled}
                swipeDisabled={swipeDisabled}
                swipeLeftAction={{ label: '🗑 Delete', onPress: () => setConfirmRemoveItem({ id: item.id, name: item.name }) }}
                swipeRightAction={{ label: '📑 Details', onPress: () => navigate(routes.mediaApiRef(item.apiSourceName, item.externalId)) }}
            >
                <RowItemContent
                    {...mediaApiRefToRowItemProps(item, { includeYear: false, secondStringField: 'date' })}
                    labelPill={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
                    onMenuClick={[
                        makeShareAction(item.name, routes.mediaApiRef(item.apiSourceName, item.externalId)),
                        makeGoToDetailsAction(navigate, routes.mediaApiRef(item.apiSourceName, item.externalId)),
                        { icon: '⛓️‍💥', label: 'Remove from List', onClick: () => setConfirmRemoveItem({ id: item.id, name: item.name }) },
                    ]}
                />
            </SwipeReorderRowItem>
        ));
    }


    // token is kept for the guard below: if the user somehow loses auth mid-session,
    // this prevents accidentally sending requests without a token.
    void token;

    return (
        <AnimatedPage>
        <div className = "page">
            {/* -- Reorder error banner -- */}
            {reorderError && (
                <div className="error-banner">
                    <span>{reorderError}</span>
                    <button onClick={() => setReorderError(null)} className="btn btn-secondary w-fit ml-4 font-bold">✕</button>
                </div>
            )}

            {/* -- Header -- */}
            <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                    <BackButton />
                    {canEditOrAdmin && (
                        <button
                            className="btn btn-secondary w-fit"
                            onClick={handleToggleEditMode}>
                            {isEditMode ? 'Exit "Edit Mode"' : 'Edit'}
                        </button>
                    )}

                </div>
                <ItemActionsButton
                    buttonClassName="btn btn-secondary w-10 h-10 flex items-center justify-center"
                    firstString={selectedMediaListDetail.name}
                    secondString={selectedMediaListDetail.description ?? undefined}
                    onMenuClick={mediaListActions({
                        id: mediaListId,
                        name: selectedMediaListDetail.name,
                        navigate,
                        // Owner and admin (on public lists) can manage list contents and edit basic info
                        ...(canEditOrAdmin ? { onManageListContentsOpen: () => { setShowAddBrowsePanel(true); } } : {}),
                        includeGoToDetails: false,
                        ...(canEditOrAdmin ? { onEditBasicInfoOpen: () => setIsEditModalOpen(true) } : {}),
                    })}
                />
            </div>

            {/* -- List Info -- */}
            <h1 className="h1-styling">{selectedMediaListDetail.name}</h1>
            {/* Collage thumbnail — first 4 items' images in a 2×2 square grid; centered horizontally */}
            {orderedItems.length > 0 && (
                <div className="w-32 h-32 rounded overflow-hidden my-2 mx-auto">
                    <ListCollageThumb
                        urls={orderedItems.slice(0, 4).map(i => i.thumbnailUrl).filter((u): u is string => !!u)}
                    />
                </div>
            )}
            {/* Show a category badge for any non-Standard list */}
            {selectedMediaListDetail.category === MediaListCategory.VisitingStatus && <BadgePill label="Visiting Status" />}
            {selectedMediaListDetail.category === MediaListCategory.Library && <BadgePill label="Library" />}
            {selectedMediaListDetail.category === MediaListCategory.Featured && <BadgePill label="Featured" />}

            {/* Visibility toggle — shown to mod/admin, derived from their own roleLevel */}
            {isModOrAdmin && (
                <button
                    className="btn btn-secondary w-fit text-sm mt-1"
                    onClick={() => patchListMutation({
                        mediaListId,
                        data: {
                            visibilityStatus: selectedMediaListDetail.visibilityStatus === VisibilityStatus.Public
                                ? VisibilityStatus.Private
                                : VisibilityStatus.Public,
                        },
                    })}
                >
                    {selectedMediaListDetail.visibilityStatus === VisibilityStatus.Public ? 'Set Private' : 'Make Public'}
                </button>
            )}

            <RoleAbilitiesInfoPanel />

            <br />
            <p>{selectedMediaListDetail.description}</p>
            <br/>


            {/* -- List Content -- */}
            {/*
                Boundary nesting:
                  SwipeErrorBoundary (outermost)
                    |-- DragListErrorBoundary
                          |-- DndContext (normal operation — drag + swipe)

                If react-swipeable crashes  -->  SwipeErrorBoundary fallback: swipeDisabled=true (buttons always visible)
                If dnd-kit crashes          -->  DragListErrorBoundary fallback: dragDisabled=true (no drag handles)
            */}
            <ErrorBoundary
                label="SwipeList"
                fallback={
                    <div className="rounded-lg border border-border overflow-hidden">
                        {renderFallbackItems(true, false)}
                    </div>
                }
            >
                <ErrorBoundary
                    label="DragList"
                    fallback={
                        <div className="rounded-lg border border-border overflow-hidden">
                            {renderFallbackItems(false, true)}
                        </div>
                    }
                >
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                        <SortableContext
                            items={orderedItems.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="rounded-lg border border-border overflow-hidden">
                                {orderedItems.map(item => (
                                    <SwipeReorderRowItem
                                        key={item.id}
                                        id={item.id}
                                        isEditMode={isEditMode}
                                        swipeLeftAction={{ label: '🗑 Delete', onPress: () => setConfirmRemoveItem({ id: item.id, name: item.name }) }}
                                        swipeRightAction={{ label: '📑 Details', onPress: () => navigate(routes.mediaApiRef(item.apiSourceName, item.externalId)) }}
                                    >
                                        <RowItemContent
                                            firstString={item.name}
                                            secondString={item.creatorName ?? undefined}
                                            labelPill={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
                                            photographOnLeft={item.thumbnailUrl ?? undefined}
                                            onMenuClick={[
                                                makeShareAction(item.name, routes.mediaApiRef(item.apiSourceName, item.externalId)),
                                                makeGoToDetailsAction(navigate, routes.mediaApiRef(item.apiSourceName, item.externalId)),
                                                { icon: '⛓️‍💥', label: 'Remove from List', onClick: () => setConfirmRemoveItem({ id: item.id, name: item.name }) },
                                            ]}
                                        />
                                    </SwipeReorderRowItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </ErrorBoundary>
            </ErrorBoundary>

            {/* -- Add Item Modal — SearchBarWithFilters drives API source/type; find-or-creates MediaApiRef on selection -- */}
            {showAddBrowsePanel && (
                <ManageLinkModal
                    modalTitle="Add Items to List"
                    allowedSearchTypes={['media']}
                    focusedItem={{ firstString: selectedMediaListDetail.name, secondString: selectedMediaListDetail.description ?? undefined }}
                    activeApiSources={activeApiSources}
                    defaultApiSourceId={activeApiSources?.[0]?.id ?? null}
                    onSearch={(query, filters) => {
                        const source = activeApiSources?.find(s => s.id === filters.apiSourceId)
                            ?? activeApiSources?.[0];
                        if (!source) return;
                        setCurrentApiSource(source);
                        setSearchPage(1);
                        setLastSearchParams({ query, mediaTypeId: source.mediaTypeId });
                        triggerSearch({ query, mediaTypeId: source.mediaTypeId, limit: SEARCH_DEFAULT_LIMIT, page: 1 });
                    }}
                    candidates={
                        [...new Map(
                            (searchData?.data ?? []).map(item => [item.externalId, item])
                        ).values()]
                        .map(item => ({
                            id: item.externalId,
                            firstString: item.name,
                            secondString: item.creatorName ?? undefined,
                            labelPill: <MediaTypeLabel mediaTypeId={currentApiSource?.mediaTypeId ?? 1} />,
                            photographOnLeft: item.thumbnailUrl ?? undefined,
                            detailType: 'mediaApiRef' as DetailItemType,       // enables ⓘ detail panel
                            apiSourceName: currentApiSource?.apiName ?? '',     // needed for detail panel route link
                        }))
                    }
                    candidatesLoading={isSearching}
                    initialLinkedIds={selectedMediaListDetail.listContent.map(i => i.externalId)}
                    pagination={lastSearchParams ? {
                        page: searchPage,
                        hasNextPage: (searchData?.data?.length ?? 0) >= SEARCH_DEFAULT_LIMIT,
                        hasPreviousPage: searchPage > 1,
                    } : undefined}
                    onPageChange={(p) => {
                        if (!lastSearchParams) return;
                        setSearchPage(p);
                        triggerSearch({ query: lastSearchParams.query, mediaTypeId: lastSearchParams.mediaTypeId, limit: SEARCH_DEFAULT_LIMIT, page: p });
                    }}
                    onAdd={async (externalId) => {
                        const item = searchData?.data.find(r => r.externalId === externalId);
                        if (!currentApiSource || !item) return;

                        // Upsert: find existing or create new MediaApiRef from this external API result
                        const ref = await findOrCreate({
                            externalApiSourceId: currentApiSource.id,
                            externalId: item.externalId,
                            name: item.name,
                            mediaTypeId: currentApiSource.mediaTypeId,
                            creatorName: item.creatorName,
                            publishedDate: item.publishedDate,
                            thumbnailUrl: item.thumbnailUrl,
                        }).unwrap();

                        await addItemMutation({ listId: mediaListId, mediaApiRefId: ref.id }).unwrap();
                    }}
                    onRemove={async (externalId) => {
                        // Find the MediaApiRef in the list by matching externalId
                        const listItem = selectedMediaListDetail.listContent.find(
                            i => i.externalId === externalId
                        );
                        if (listItem) {
                            await removeItemMutation({ listId: mediaListId, mediaApiRefId: listItem.id }).unwrap();
                        }
                    }}
                    removeConfirmTitle="Remove item from list?"
                    getRemoveConfirmMessage={(item) => `Remove "${item.firstString}" from this list?`}
                    onClose={() => setShowAddBrowsePanel(false)}
                />
            )}

            {/* Edit MediaList's Basic Info Modal */}
            {isEditModalOpen && (
                <NameAndDescriptionModal
                    mode="edit"
                    initialName={selectedMediaListDetail.name}
                    initialDescription={selectedMediaListDetail.description}
                    initialVisibility={selectedMediaListDetail.visibilityStatus}
                    onConfirm={async (name, description, visibility) => {
                        try {
                            await patchListMutation({ mediaListId, data: { name, description, visibilityStatus: visibility } }).unwrap();
                        } catch (err) {
                            console.error(err);
                        }
                        setIsEditModalOpen(false);
                    }}
                    onCancel={() => setIsEditModalOpen(false)}
                />
            )}

            {/* Confirm Modal for Removing Item from List */}
            {confirmRemoveItem && (
                <ConfirmModal
                    title={`Remove "${confirmRemoveItem.name}"`}
                    message="This item will be removed from the list."
                    confirmLabel="Remove"
                    onConfirm={async () => {
                        try {
                            await removeItemMutation({ listId: mediaListId, mediaApiRefId: confirmRemoveItem.id }).unwrap();
                        } catch (err) {
                            console.error(err);
                        }
                        setConfirmRemoveItem(null);
                    }}
                    onCancel={() => setConfirmRemoveItem(null)}
                />
            )}
        </div>
        </AnimatedPage>
    );
}

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
import type { ExternalApiSearchResult } from '../types/externalApiSearch';
import MediaTypeLabel from '../components/MediaTypeLabel';
import SwipeReorderRowItem from '../components/SwipeReorderRowItem';
import RowItemStyling from '../components/RowItemStyling';
import RowItemContent from '../components/RowItemContent';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { SEARCH_DEFAULT_LIMIT } from '../constants';
import { useSearch } from '../hooks/useSearch';
import MediaListFormModal from '../components/modals/MediaListFormModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import ItemSettingsDrawerModal, { SettingsRow } from '../components/modals/ItemSettingsDrawerModal';
import AnimatedPage from '../components/AnimatedPage';
import ManageLinkModal from '../components/modals/ManageLinkModal';



export default function MediaListDetailPage() {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { token } = useSelector((state: RootState) => state.auth);

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
    const [triggerSearchExternalApi] = useLazySearchExternalApiQuery();
    const [findOrCreate] = useFindOrCreateMediaApiRefMutation();

    // Active API sources tell us which ExternalApiSourceId to use per media type
    const { data: activeApiSources } = useGetActiveApiSourcesQuery();

    // Local state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddBrowsePanel, setShowAddBrowsePanel] = useState(false);

    // Which media type to search in when adding items (default: Movie = 1)
    const [searchMediaTypeId, setSearchMediaTypeId] = useState<number>(1);

    // Server-side search state for the Add Item modal (searches external APIs)
    const {
        results: searchResults,
        isSearching,
        handleSearchChange,
        clearResults: clearSearchResults,
    } = useSearch<ExternalApiSearchResult>(
        async (query) => (await triggerSearchExternalApi({
            query,
            mediaTypeId: searchMediaTypeId,
            limit: SEARCH_DEFAULT_LIMIT,
        }).unwrap()).data
    );

    // This is about showing/not showing the modal
    // for confirming if a user wants to remove the selected item in the <ConfirmModal> section
    // from the current MediaList
    const [confirmRemoveItem, setConfirmRemoveItem] = useState<{ id: number; name: string } | null>(null);

    const [settingsItem, setSettingsItem] = useState<MediaApiRefSummary | null>(null);

    // Local ordered list — kept in sync with the Redux store, updated optimistically on drag
    const [orderedItems, setOrderedItems] = useState<MediaApiRefSummary[]>([]);
    // Shown as an inline banner when a drag-reorder fails to save; cleared on dismiss
    const [reorderError, setReorderError] = useState<string | null>(null);



    // navigator.share = the native iOS/Android/desktop share sheet (like Spotify).
    // This is the default Share popup that you see whenever you click Share on your iPhone.
    // Supported on Chrome/Safari/Edge on macOS & Windows, but NOT Firefox desktop.
    // When unavailable, the button becomes a "Copy Link" button instead.
    const canNativeShare = typeof navigator.share === 'function';



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


    const existingIds = new Set(selectedMediaListDetail?.listContent.map(i => i.id));

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
                swipeRightAction={{ label: '📑 Details', onPress: () => navigate(`/mediaapiref/${item.id}`) }}
            >
                <RowItemContent
                    firstString={item.name}
                    secondString={item.creatorName ?? undefined}
                    labelPill={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
                />
            </SwipeReorderRowItem>
        ));
    }


    const preview = settingsItem ? (
        <RowItemStyling>
            <RowItemContent
                firstString={settingsItem.name}
                secondString={settingsItem.creatorName ?? undefined}
                labelPill={<MediaTypeLabel mediaTypeId={settingsItem.mediaTypeId} faded={true} />}
            />
        </RowItemStyling>
    ) : undefined;


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
            <div className="flex flex-wrap gap-2">
                <button
                    className="btn btn-secondary w-fit"
                    onClick={() => navigate("/my-medialists")}
                >⬅︎ Back to My Lists</button>
                {selectedMediaListDetail.canEdit && (
                    <button
                        className="btn btn-secondary w-fit"
                        onClick={handleToggleEditMode}>
                        {isEditMode ? 'Exit "Edit Mode"' : 'Edit'}
                    </button>
                )}
                {isEditMode && (
                    <button
                        className="btn btn-secondary w-fit"
                        onClick={() => setIsEditModalOpen(true)}>
                        Edit List's Basic Info
                    </button>
                )}
            </div>

            {/* -- List Info -- */}
            <h1 className="h1-styling">{selectedMediaListDetail.name}</h1>
            {selectedMediaListDetail.isDefault && (
                <span className="text-xs px-2 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] select-none">
                    Default List
                </span>
            )}
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
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {renderFallbackItems(true, false)}
                    </div>
                }
            >
                <ErrorBoundary
                    label="DragList"
                    fallback={
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {renderFallbackItems(false, true)}
                        </div>
                    }
                >
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                        <SortableContext
                            items={orderedItems.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                {orderedItems.map(item => (
                                    <SwipeReorderRowItem
                                        key={item.id}
                                        id={item.id}
                                        isEditMode={isEditMode}
                                        swipeLeftAction={{ label: '🗑 Delete', onPress: () => setConfirmRemoveItem({ id: item.id, name: item.name }) }}
                                        swipeRightAction={{ label: '📑 Details', onPress: () => navigate(`/mediaapiref/${item.id}`) }}
                                        onOptionsPress={() => setSettingsItem(item)}
                                    >
                                        <RowItemContent
                                            firstString={item.name}
                                            secondString={item.creatorName ?? undefined}
                                            labelPill={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
                                        />
                                    </SwipeReorderRowItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </ErrorBoundary>
            </ErrorBoundary>

            {/* -- Add Item to List — press to open the search modal (Edit Mode only) */}
            {isEditMode && !showAddBrowsePanel && (
                <button
                className = "btn btn-secondary w-fit"
                onClick={() => {
                    clearSearchResults();
                    setShowAddBrowsePanel(true);
                }}>+ Add Item</button>
            )}

            {/* -- Add Item Modal — searches external APIs; find-or-creates MediaApiRef on selection -- */}
            {isEditMode && showAddBrowsePanel && (
                <div className="flex flex-col gap-2">
                    {/* Media type selector — controls which external API to search */}
                    <div className="flex flex-wrap gap-2">
                        {activeApiSources?.map(source => (
                            <button
                                key={source.id}
                                className={`btn ${searchMediaTypeId === source.mediaTypeId ? 'btn-primary' : 'btn-secondary'} w-fit`}
                                onClick={() => {
                                    setSearchMediaTypeId(source.mediaTypeId);
                                    clearSearchResults();
                                }}
                            >
                                <MediaTypeLabel mediaTypeId={source.mediaTypeId} />
                            </button>
                        ))}
                    </div>

                    <ManageLinkModal
                        modalTitle="Add Items to List"
                        searchPlaceholder="Search by name (min. 2 characters)..."
                        onSearchChange={handleSearchChange}

                        // searchResults are raw ExternalApiSearchResult items from the external API
                        candidates={searchResults
                            .map(item => ({
                                id: item.externalId,
                                primaryLabel: item.name,
                                secondaryLabel: item.creatorName ?? undefined,
                                labelComponent: <MediaTypeLabel mediaTypeId={searchMediaTypeId} />,
                            }))}
                        candidatesLoading={isSearching}
                        initialLinkedIds={[...existingIds].map(String)}
                        onAdd={async (externalId) => {
                            const item = searchResults.find(r => r.externalId === externalId)!;
                            const activeSource = activeApiSources?.find(s => s.mediaTypeId === searchMediaTypeId);
                            if (!activeSource) return;

                            // Upsert: find existing or create new MediaApiRef from this external API result
                            const ref = await findOrCreate({
                                externalApiSourceId: activeSource.id,
                                externalId: item.externalId,
                                name: item.name,
                                mediaTypeId: searchMediaTypeId,
                                creatorName: item.creatorName,
                                publishedDate: item.publishedDate,
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
                        getRemoveConfirmMessage={(item) => `Remove "${item.primaryLabel}" from this list?`}
                        onClose={() => setShowAddBrowsePanel(false)}
                    />
                </div>
            )}

            {/* Edit MediaList's Basic Info Modal */}
            {isEditModalOpen && (
                <MediaListFormModal
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

            {/* MediaApiRef Settings Modal */}
            <ItemSettingsDrawerModal
                open={!!settingsItem}
                onClose={() => setSettingsItem(null)}
                preview={preview}
            >
                {(close) => (<>
                    <SettingsRow
                        icon="🔗"
                        label={canNativeShare ? "Share" : "Copy Link"}
                        onClick={() => {
                            const url = `${window.location.origin}/mediaapiref/${settingsItem!.id}`;
                            if (canNativeShare) {
                                navigator.share({ title: settingsItem!.name, url }).catch(() => {});
                            } else {
                                navigator.clipboard.writeText(url).catch(() => {});
                            }
                            close();
                        }}
                    />
                    <SettingsRow
                        icon="📄"
                        label="Go to Details"
                        onClick={() => { navigate(`/mediaapiref/${settingsItem!.id}`); close(); }}
                    />
                    <SettingsRow
                        icon="⛓️‍💥"
                        label="Remove from List"
                        onClick={() => { setConfirmRemoveItem({ id: settingsItem!.id, name: settingsItem!.name }); close(); }}
                    />
                </>)}
            </ItemSettingsDrawerModal>

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

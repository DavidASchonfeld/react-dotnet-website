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
    useAddMediaItemToListMutation,
    useRemoveMediaItemFromListMutation,
    usePatchListBasicInfoMutation,
    useReorderMediaListItemsMutation,
    useLazySearchMediaItemsQuery,
} from '../services/apiSlice';
import type { MediaItemSummary } from '../types/mediaItem';
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

    const [addItemMutation] = useAddMediaItemToListMutation();
    const [removeItemMutation] = useRemoveMediaItemFromListMutation();
    const [patchListMutation] = usePatchListBasicInfoMutation();
    const [reorderMutation] = useReorderMediaListItemsMutation();
    const [triggerSearchMediaItems] = useLazySearchMediaItemsQuery();


    // Local state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddBrowsePanel, setShowAddBrowsePanel] = useState(false);

    // Server-side search state for the Add Item modal
    const {
        results: searchResults,
        isSearching,
        handleSearchChange,
        clearResults: clearSearchResults,
    } = useSearch<MediaItemSummary>(
        async (query) => await triggerSearchMediaItems({ query, limit: SEARCH_DEFAULT_LIMIT }).unwrap()
    );

    // This is about showing/not showing the modal
    // for confirming if a user wants to remove the selected MediaItem in the <ConfirmModal> section
    // from the current MediaList
    // The actual dispatch to remove is located later in this file,
    const [confirmRemoveItem, setConfirmRemoveItem] = useState<{ id: number; name: string } | null>(null);

    const [settingsItem, setSettingsItem] = useState<MediaItemSummary | null>(null);

    // Local ordered list — kept in sync with the Redux store, updated optimistically on drag
    const [orderedItems, setOrderedItems] = useState<MediaItemSummary[]>([]);
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
                swipeRightAction={{ label: '📑 Details', onPress: () => navigate(`/mediaitem/${item.id}`) }}
            >
                <RowItemContent
                    firstString={item.name}
                    labelPill={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
                />
            </SwipeReorderRowItem>
        ));
    }


    // This is using the ternary operator:
    // const theVariable = if_this_is_true ? "set_this_value" : "otherwise_set_value"

    // If the settingsItem is set (aka the variable that the settingsMenu will focus on)
    // then build the RowItem component
    // otherwise, set the "preview" variable to undefined

    const preview = settingsItem ? (
        <RowItemStyling>
            <RowItemContent
                firstString={settingsItem.name}
                secondString={'TODO: ADD CREATORS'}
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
                                        swipeRightAction={{ label: '📑 Details', onPress: () => navigate(`/mediaitem/${item.id}`) }}
                                        onOptionsPress={() => setSettingsItem(item)}
                                    >
                                        <RowItemContent
                                            firstString={item.name}
                                            secondString={'TODO: ADD CREATORS'}
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

            {/* -- Add Item Modal — server-side search per keystroke; no Redux mediaItems used here -- */}
            {isEditMode && showAddBrowsePanel && (
                <ManageLinkModal
                    modalTitle="Add Items to List"
                    searchPlaceholder="Search by name (min. 2 characters)..."
                    onSearchChange={handleSearchChange}

                    // searchResults is a tool from my hook for searching
                    //  this is the search results,which calls/retrieves info from the backend
                    candidates={searchResults
                        .map(item => ({
                            id: String(item.id),
                            primaryLabel: item.name,
                            labelComponent: <MediaTypeLabel mediaTypeId={item.mediaTypeId} />,
                        }))}
                    candidatesLoading={isSearching}
                    initialLinkedIds={[...existingIds].map(String)}
                    onAdd={async (itemId) => {
                    // RTK Query mutations handle what is/is not in a mediaList (and sends those commands to backend)
                    //  Note: Here in onAdd (and in onRemove), mutations are only used to add/remove mediaItem from a mediaList
                    // Here, mutations are NOT used/involved in search results
                        const item = searchResults.find(i => String(i.id) === itemId)!;
                        await addItemMutation({ listId: mediaListId, mediaItemId: item.id }).unwrap();
                    }}
                    onRemove={async (itemId) => {
                        await removeItemMutation({ listId: mediaListId, mediaItemId: parseInt(itemId) }).unwrap();
                    }}
                    removeConfirmTitle="Remove item from list?"
                    getRemoveConfirmMessage={(item) => `Remove "${item.primaryLabel}" from this list?`}
                    onClose={() => setShowAddBrowsePanel(false)}
                />
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

            {/* MediaItem Settings Modal */}
            <ItemSettingsDrawerModal

                // !! casts the variable into a bool
                // here open = true if I have a settingsItem in memory
                open={!!settingsItem}

                // onClose: pass in a function that it calls once it is finished closing.
                //  In this case, I am passing in () => setSettingsItem(null),
                //  which tells it that right after closing, run the code setSettingsItem(null) immediately
                // (technically, after the MediaItemSettingsModal finishes animating its exit animation)
                onClose={() => setSettingsItem(null)}
                preview={preview}
            >

                {/* This is a function which takes "close" as a parameter and returns JSX.
                {(close) => <SomeRow />}
                In MediaItemSettingsModal.tsx, it doesn't render the JSX items directly,
                but instead treats them as one big function with a parameter to call MediaItemSettingsModal's close function.
                {children(close)}
                This is the only way give the passed-in JSX items
                the ability to call MediaItemSettingsModal's exclusive/private function.
                */}
                {/* Render prop: the only way to access close() from here, since it is
                a local variable inside MediaItemSettingsModal — not reachable any other way.
                The modal calls children(close), handing us its close so our rows can trigger
                the animated close sequence instead of abruptly destroying the modal. */}

                {/*
                    JSX (JavaScript XML) is what we always "return" in React components.
                    (Technically, we could also return, null, a number and a few other small variable types)
                */}

                {(close) => (<>
                    <SettingsRow
                        icon="🔗"
                        label={canNativeShare ? "Share" : "Copy Link"}
                        onClick={() => {
                            const url = `${window.location.origin}/mediaitem/${settingsItem!.id}`;
                            if (canNativeShare) {
                                // .catch() swallows the AbortError thrown when the user
                                // dismisses the native share sheet without sharing.
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
                        onClick={() => { navigate(`/mediaitem/${settingsItem!.id}`); close(); }}
                    />
                    <SettingsRow
                        icon="⛓️‍💥"
                        label="Remove from List"
                        onClick={() => { setConfirmRemoveItem({ id: settingsItem!.id, name: settingsItem!.name }); close(); }}
                    />
                    {/* TODO: Implement this page: navigate(`/mediaitem/${settingsItwm!.id}/creators`);
                    <SettingsRow
                        icon="👤"
                        label="View Creators"
                        onClick={() => { navigate(`/mediaitem/${settingsItem!.id}/creators`); close(); }}
                    /> */}
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
                            await removeItemMutation({ listId: mediaListId, mediaItemId: confirmRemoveItem.id }).unwrap();
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

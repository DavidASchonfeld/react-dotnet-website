// React Libraries
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// dnd-kit
import { DndContext, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

// My Code
import type { RootState, AppDispatch } from '../store/store';
import {
    fetchListDetail,
    clearSelectedListDetail,
    addItemToList,
    patchBasicInfoList,
    removeItemFromList,
    reorderItemsInList,
} from '../store/mediaListsSlice';
import type { MediaItemSummary } from '../types/mediaItem';
import MediaTypeLabel from '../components/MediaTypeLabel';
import SwipeReorderRowItem from '../components/SwipeReorderRowItem';
import RowItemStyling from '../components/RowItemStyling';
import RowItemContent from '../components/RowItemContent';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { fetchRandomMediaItems } from '../store/mediaItemsSlice';
import MediaListFormModal from '../components/modals/MediaListFormModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import ItemSettingsDrawerModal, { SettingsRow } from '../components/modals/ItemSettingsDrawerModal';
import AnimatedPage from '../components/AnimatedPage';
import { safeToast } from '../utils/safeToast';



export default function MediaListDetailPage() {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();


    const { selectedMediaListDetail, status, error } = useSelector((state: RootState) => state.mediaLists);
    const mediaItems = useSelector((state: RootState) => state.mediaItems.mediaItems);
    const { token } = useSelector((state: RootState) => state.auth);

    const dispatch = useDispatch<AppDispatch>();


    // Local state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddBrowsePanel, setShowAddBrowsePanel] = useState(false);
    const [searchBarContent, setSearchBarContent] = useState('');

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







    useEffect(() => {
        dispatch(fetchListDetail({ token: token!, mediaListId: parseInt(id!) }));

        return () => {
            dispatch(clearSelectedListDetail());
        };
    }, [dispatch, token, id]);

    // Sync local orderedItems whenever the Redux store updates listContent
    useEffect(() => {
        if (selectedMediaListDetail?.listContent) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOrderedItems(selectedMediaListDetail.listContent);
        }
    }, [selectedMediaListDetail?.listContent]);


    if (status === 'loading') return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!selectedMediaListDetail) return null;


    const mediaListId = selectedMediaListDetail.id;
    const existingIds = new Set(selectedMediaListDetail?.listContent.map(i => i.id));
    const filteredCandidates = mediaItems.filter(
        item => !existingIds.has(item.id) &&
        item.name.toLowerCase().includes(searchBarContent.toLowerCase())
    );

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
        dispatch(reorderItemsInList({
            token: token!,
            mediaListId,
            orderedItemIds: reordered.map(i => i.id),
        }))
            .unwrap()
            .catch(() => {
                setReorderError('Failed to save new order. The list has been restored.');
                dispatch(fetchListDetail({ token: token!, mediaListId: parseInt(id!) }));
            });
    }


    // Shared fallback item list used by both error boundaries
    // swipeDisabled=true → buttons always visible (no swipe needed)
    // dragDisabled=true  → no drag handles
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
                    emojiIcon={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
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
                emojiIcon={<MediaTypeLabel mediaTypeId={settingsItem.mediaTypeId} faded={true} />}
            />
        </RowItemStyling>
    ) : undefined;








    return (
        <AnimatedPage>
        <div className = "page">
            {/* -- Reorder error banner -- */}
            {reorderError && (
                <div className="bg-red-100 text-red-800 px-4 py-2 flex justify-between items-center">
                    <span>{reorderError}</span>
                    <button onClick={() => setReorderError(null)} className="btn btn-secondary w-fit ml-4 font-bold">✕</button>
                </div>
            )}

            {/* -- Header -- */}
            <button
                    className="btn btn-secondary w-fit"
                    onClick={() => navigate("/my-medialists")}
                >⬅︎ Back to My Lists</button>



            {selectedMediaListDetail.canEdit && (
                <button
                className="btn btn-secondary w-fit "
                onClick={handleToggleEditMode}>
                    {isEditMode ? 'Exit "Edit Mode"' : 'Edit'}
                </button>
            )}

            {/* -- List Info -- */}
            <h1 className="h1-styling">{selectedMediaListDetail.name}</h1>
            <br />
            <p>{selectedMediaListDetail.description}</p>
            <br/>
            {isEditMode && <button 
                className = "btn btn-secondary w-fit"
                onClick={() => setIsEditModalOpen(true)}>Edit List's Basic Info</button>}

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
                                            emojiIcon={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
                                        />
                                    </SwipeReorderRowItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </ErrorBoundary>
            </ErrorBoundary>

            {/* -- Add Item to List  --press to show "Add Items" Browser Panel (Edit Mode only) */}
            {isEditMode && !showAddBrowsePanel && (
                <button
                className = "btn btn-secondary w-fit"
                onClick={() => {
                    setShowAddBrowsePanel(true);
                    if (mediaItems.length === 0) dispatch(fetchRandomMediaItems({ token: token!, amount: 5 }));
                }}>+ Add Item (Browse Panel)</button>
            )}

            {/* -- "Add Items" Browser Panel -- */}
            {isEditMode && showAddBrowsePanel && (
                <AnimatedPage>
                <div className="modal-panel">
                    
                    <h3>Add an Item</h3>
                    <input
                        placeholder="Search (this random list) by name..."
                        value={searchBarContent}
                        onChange={(e) => setSearchBarContent(e.target.value)}
                    />

                    <button
                        className="btn btn-secondary w-fit "
                        onClick={() => dispatch(fetchRandomMediaItems({ token: token!, amount: 5 }))}>
                        Browse More Random MediaItems
                    </button>

                    <button
                    className="btn btn-secondary w-fit "
                    onClick={() => setShowAddBrowsePanel(false)}>Cancel</button>

                    {filteredCandidates.map(item => (
                        <div key={item.id}>
                            <span>{item.name}</span>
                            <MediaTypeLabel mediaTypeId={item.mediaTypeId} />
                            <button
                            className="btn btn-secondary w-fit"
                            onClick={async () => {
                                try {
                                    await dispatch(addItemToList({ token: token!, mediaListId, mediaItemId: item.id, mediaItem: item })).unwrap();
                                    safeToast.success('Item added');
                                } catch {
                                    safeToast.error('Failed to add item');
                                }
                            }}>
                                Add
                            </button>
                        </div>
                    ))}
                    
                </div>
                </AnimatedPage>
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
                            await dispatch(patchBasicInfoList({ token: token!, mediaListId, data: { name, description, visibilityStatus: visibility } })).unwrap();
                            safeToast.success('List updated');
                        } catch {
                            safeToast.error('Failed to update list');
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
                        label="Remove from list - Button to be implemented"
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
                            await dispatch(removeItemFromList({ token: token!, mediaListId, mediaItemId: confirmRemoveItem.id })).unwrap();
                            safeToast.success('Item removed');
                        } catch {
                            safeToast.error('Failed to remove item');
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

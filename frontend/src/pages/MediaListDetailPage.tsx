// React Libraries
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import SortableMediaItem from '../components/SortableMediaItem';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { fetchRandomMediaItems } from '../store/mediaItemsSlice';
import MediaListFormModal from '../components/modals/MediaListFormModal';
import ConfirmModal from '../components/modals/ConfirmModal';



export default function MediaListDetailPage() {

    const { id } = useParams<{ id: string }>();

    const { selectedMediaListDetail, status, error } = useSelector((state: RootState) => state.mediaLists);
    const mediaItems = useSelector((state: RootState) => state.mediaItems.mediaItems);
    const { token } = useSelector((state: RootState) => state.auth);

    const dispatch = useDispatch<AppDispatch>();


    // Local state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddBrowsePanel, setShowAddBrowsePanel] = useState(false);
    const [searchBarContent, setSearchBarContent] = useState('');
    const [confirmRemoveItem, setConfirmRemoveItem] = useState<{ id: number; name: string } | null>(null);

    // Local ordered list — kept in sync with the Redux store, updated optimistically on drag
    const [orderedItems, setOrderedItems] = useState<MediaItemSummary[]>([]);
    // Shown as an inline banner when a drag-reorder fails to save; cleared on dismiss
    const [reorderError, setReorderError] = useState<string | null>(null);

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
            <SortableMediaItem
                key={item.id}
                item={item}
                isEditMode={isEditMode}
                dragDisabled={dragDisabled}
                swipeDisabled={swipeDisabled}
                onRequestDelete={setConfirmRemoveItem}
            />
        ));
    }


    return (
        <div>
            {/* -- Reorder error banner -- */}
            {reorderError && (
                <div className="bg-red-100 text-red-800 px-4 py-2 flex justify-between items-center">
                    <span>{reorderError}</span>
                    <button onClick={() => setReorderError(null)} className="ml-4 font-bold">✕</button>
                </div>
            )}

            {/* -- Header -- */}
            <Link to="/my-medialists">⬅︎ Back to My Lists</Link>
            {selectedMediaListDetail.canEdit && (
                <button onClick={handleToggleEditMode}>
                    {isEditMode ? 'Exit "Edit Mode"' : 'Edit'}
                </button>
            )}

            {/* -- List Info -- */}
            <h1>{selectedMediaListDetail.name}</h1>
            <p>{selectedMediaListDetail.description}</p>
            {isEditMode && <button onClick={() => setIsEditModalOpen(true)}>Edit List's Basic Info</button>}

            {/* -- List Content -- */}
            {/*
                Boundary nesting:
                  SwipeErrorBoundary (outermost)
                    └── DragListErrorBoundary
                          └── DndContext (normal operation — drag + swipe)

                If react-swipeable crashes  → SwipeErrorBoundary fallback: swipeDisabled=true (buttons always visible)
                If dnd-kit crashes          → DragListErrorBoundary fallback: dragDisabled=true (no drag handles)
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
                                    <SortableMediaItem
                                        key={item.id}
                                        item={item}
                                        isEditMode={isEditMode}
                                        onRequestDelete={setConfirmRemoveItem}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </ErrorBoundary>
            </ErrorBoundary>

            {/* -- Add Item to List  --press to show "Add Items" Browser Panel (Edit Mode only) */}
            {isEditMode && !showAddBrowsePanel && (
                <button onClick={() => {
                    setShowAddBrowsePanel(true);
                    if (mediaItems.length === 0) dispatch(fetchRandomMediaItems({ token: token!, amount: 5 }));
                }}>+ Add Item (Browse Panel)</button>
            )}

            {/* -- "Add Items" Browser Panel -- */}
            {isEditMode && showAddBrowsePanel && (
                <div>
                    <h3>Add an Item</h3>
                    <input
                        placeholder="Search by name..."
                        value={searchBarContent}
                        onChange={(e) => setSearchBarContent(e.target.value)}
                    />

                    <button onClick={() => dispatch(fetchRandomMediaItems({ token: token!, amount: 5 }))}>
                        Browse More Random MediaItems
                    </button>

                    <button onClick={() => setShowAddBrowsePanel(false)}>Cancel</button>

                    {filteredCandidates.map(item => (
                        <div key={item.id}>
                            <span>{item.name}</span>
                            <MediaTypeLabel mediaTypeId={item.mediaTypeId} />
                            <button onClick={() => dispatch(addItemToList({ token: token!, mediaListId, mediaItemId: item.id, mediaItem: item }))}>
                                Add
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit MediaList's Basic Info Modal */}
            {isEditModalOpen && (
                <MediaListFormModal
                    mode="edit"
                    initialName={selectedMediaListDetail.name}
                    initialDescription={selectedMediaListDetail.description}
                    initialVisibility={selectedMediaListDetail.visibilityStatus}
                    onConfirm={(name, description, visibility) => {
                        dispatch(patchBasicInfoList({ token: token!, mediaListId, data: { name, description, visibilityStatus: visibility } }));
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
                    onConfirm={() => {
                        dispatch(removeItemFromList({ token: token!, mediaListId, mediaItemId: confirmRemoveItem.id }));
                        setConfirmRemoveItem(null);
                    }}
                    onCancel={() => setConfirmRemoveItem(null)}
                />
            )}
        </div>
    );
}

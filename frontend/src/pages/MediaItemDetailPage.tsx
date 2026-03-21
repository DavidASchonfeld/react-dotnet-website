// React Libraries
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// My Code
import type { RootState, AppDispatch } from '../store/store';
import { clearSelectedMediaItemDetail} from '../store/mediaItemsSlice';
import MediaTypeLabel from '../components/MediaTypeLabel';
import { fetchMediaItemDetail, patchMediaItemBasicInfoTHUNK } from '../store/mediaItemsSlice';
import MediaItemFormModal from '../components/modals/MediaItemFormModal';
import RowItemContent from '../components/RowItemContent';
import RowItemStyling from '../components/RowItemStyling';
import AnimatedPage from '../components/AnimatedPage';
import { addMediaItemToList, removeMediaItemFromList, searchMediaLists } from '../services/mediaListService';
import { useSearch } from '../hooks/useSearch';
import { getMediaItemLists } from '../services/mediaItemService';
import ManageLinkModal from '../components/modals/ManageLinkModal';
import ItemSettingsDrawerModal, { SettingsRow } from '../components/modals/ItemSettingsDrawerModal';
import { safeToast } from '../utils/safeToast';
import type { MediaListSummary } from '../types/mediaList';



export default function MediaItemDetailPage() {


    // useParams() reads the :id from the URL
    // Ex: /mediaitem/42 -> id ="42". (passed as a string)
    // Explanation for line below:
    // Left-Side:
    //     Equivalent of doing:
    //          const params = useParams();
    //          const id = params.id;
    // Right-Side:
    //      <{id: string}>  This is a TypeScript generic.
    //      It is telling TypeScript that
    //      this object is a TypeScript type shape
    //      (very similar to a JSON object)
    //      with only 1 parameter
    //      called "id" with type "string".
    const { id } = useParams<{ id: string }>();

    // Get Details of selected MediaItem from store (aka Redux)(and if store doesn't have it, it will send commands to Service which will send HTTP requests to backend)
    const { selectedMediaItemDetail, status, error } = useSelector((state: RootState) => state.mediaItems);

    const { token } = useSelector((state: RootState) => state.auth);

    const dispatch = useDispatch<AppDispatch>();

    const navigate = useNavigate();

    // navigator.share = the native iOS/Android/desktop share sheet (like Spotify).
    // This is the default Share popup that you see whenever you click Share on your iPhone.
    // Supported on Chrome/Safari/Edge on macOS & Windows, but NOT Firefox desktop.
    // When unavailable, the button becomes a "Copy Link" button instead.
    const canNativeShare = typeof navigator.share === 'function';

    const [isEditMode, setIsEditMode] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);


    //// Objects for ManageLinkModal.tsx Component

    // States + Selectors
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [memberListIds, setMemberListIds] = useState<Set<number> | null>(null);
    const [modifiableListIds, setModifiableListIds] = useState<Set<number> | null>(null);
    const [listsLoading, setListsLoading] = useState(false);

    // Server-side list search state for ManageLinkModal
    const {
        results: listSearchResults,
        isSearching: isListSearching,
        handleSearchChange: handleListSearchChange,
    } = useSearch<MediaListSummary>((query) => searchMediaLists(token!, query, 10));

    // Function to call List Membership directly from API,
    // bypassing Redux
    async function loadMembership(){
        if (!token) return;
        setListsLoading(true);
        try {
            // Single request: returns only the lists that contain this item,
            // each with canEdit already set by the backend.
            const memberLists = await getMediaItemLists(token, parseInt(id!));
            const ids = new Set<number>();
            const modIds = new Set<number>();
            memberLists.forEach(l => {
                ids.add(l.id);
                if (l.canEdit) modIds.add(l.id);
            });
            setMemberListIds(ids);
            setModifiableListIds(modIds);
        } catch {
            safeToast.error('Failed to load list membership');
        } finally {
            setListsLoading(false);
        }
    }

    function getButtonLabel(): string {
        if (listsLoading || memberListIds === null) return 'Add to List';

        // Only count lists the current user can actually modify.
        // (modifiableListIds is populated from MediaListDetail.canEdit in loadMembership)
        const modifiableCount = [...memberListIds].filter(lid => modifiableListIds?.has(lid)).length;

        if (modifiableCount === 0) return 'Add to List';
        if (modifiableCount === 1){
            // We can't look up the list name from Redux anymore (fetchMyLists was removed),
            // so fall back to the count string for the single-list case too.
            return "Saved to 1 list";
        }

        // Else, if the item is in 2+ modifiable lists:
        return `Saved to ${modifiableCount} lists`;
    }

    // Runs only once (unless any of its dependencies (dispatch, token, id) changes)
    useEffect(()=> {
        // Since this function is here in the useEffect() body,
        // it runs as soon as this component is rendered (aka shown on the screen.)
        dispatch(fetchMediaItemDetail({token: token!, mediaItemId: parseInt(id!)}));

        // Cleanup: When the user navigates from this page,
        // let's clear the stored detailed list.
        // This prevents seeing the previous list's data
        // when loading/navigating to a different list.

        if (token){
            loadMembership();
        }

        // () => {} means that this function runs when this component unmounts (aka leaves the screen)
        return () => {
            dispatch(clearSelectedMediaItemDetail());
        };


    }, [dispatch, token, id]);




    if (status === 'loading') return <div>Loading...</div>
    if (error) return <div>{error}</div>
    if (!selectedMediaItemDetail) return null

    return (
        <AnimatedPage>
        <div className = "page">

            <RowItemStyling>
                <RowItemContent
                    firstString={selectedMediaItemDetail.name}
                    secondString={'TODO: ADD CREATORS'}
                    labelPill={<MediaTypeLabel mediaTypeId={selectedMediaItemDetail.mediaTypeId} faded={true} />}
                />
            </RowItemStyling>

            {/* -- Header -- */}
            <div className="flex flex-wrap gap-2">
                <button
                    className="btn btn-secondary w-fit"
                    onClick={() => navigate(-1)}>
                    ⬅︎ Back
                </button>
                {selectedMediaItemDetail.canEdit && (
                    <button
                        className="btn btn-secondary w-fit"
                        onClick={() => setIsEditMode(prev => !prev)}>
                        {isEditMode ? 'Exit "Edit Mode"' : 'Edit'}
                    </button>
                )}
                <button
                    className="btn btn-secondary w-fit"
                    onClick={() => setSettingsOpen(true)}>
                    ⋯
                </button>
            </div>

            {isEditMode ? (
                <>
                    {/* Edit Mode */}
                    <MediaItemFormModal
                        existingItem={selectedMediaItemDetail}
                        onConfirm = {(name, description, mediaTypeId, publishedDateTime) => {
                            dispatch(patchMediaItemBasicInfoTHUNK({
                                token: token!,
                                mediaItemId: selectedMediaItemDetail.id,
                                data: {name, description, mediaTypeId, publishedDateTime}
                            }));
                            setIsEditMode(false);
                        }}
                        onCancel = { () => setIsEditMode(false)}
                    />
                </>
            ) : (
                <>
                    {/* View Mode */}
                    <h1>{selectedMediaItemDetail.name}</h1>
                    <MediaTypeLabel mediaTypeId={selectedMediaItemDetail.mediaTypeId} />
                    <p>{selectedMediaItemDetail.description}</p>

                    {/*If .publishedDateTime is null,
                    then the new Date() constructor will output the default date (like January 1970 or something)
                    which would∂ be wrong. So, this will only show the publishedDate
                    if it is stored */}
                    {selectedMediaItemDetail.publishedDateTime && (
                        <p>{new Date(selectedMediaItemDetail.publishedDateTime).toLocaleDateString()}</p>
                    )}
                </>
            )}

            {showLinkModal && (
                <ManageLinkModal
                    modalTitle='Add/Remove from List'
                    searchPlaceholder='Search your lists (min. 2 characters)...'
                    onSearchChange={handleListSearchChange}
                    candidates={listSearchResults.map(l => ({
                        id: l.id.toString(),
                        primaryLabel: l.name,
                        secondaryLabel: l.description ?? undefined,
                        countLabel: `${l.itemCount} items`,
                        hasModifyLinkAccess: l.canEdit
                    }))}
                    candidatesLoading={isListSearching}
                    // Convert Set<number> → Set<string> at the modal boundary
                    initialLinkedIds={new Set([...(memberListIds ?? new Set())].map(String))}
                    onAdd={async (itemId) => {
                        // itemId is the list's id (as string); selectedMediaItemDetail.id is the item being linked
                        await addMediaItemToList(token!, parseInt(itemId), selectedMediaItemDetail!.id, {})
                    }}
                    onRemove={async (itemId) => {
                        await removeMediaItemFromList(token!, parseInt(itemId), selectedMediaItemDetail!.id);
                    }}
                    removeConfirmTitle="Remove item from list?"
                    getRemoveConfirmMessage={(item) =>
                        `Remove "${selectedMediaItemDetail?.name}" from "${item.primaryLabel}"?`
                    }
                    onClose={(updatedIds) => {
                        // Convert Set<string> → Set<number> back from the modal boundary
                        setMemberListIds(new Set([...updatedIds].map(Number)));
                        setShowLinkModal(false)
                    }}
                />
            )}

            {/* MediaItem Settings Drawer */}
            {/* !! casts the variable into a bool — open = true if settingsOpen is true */}
            <ItemSettingsDrawerModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            >
                {/* Render prop: the only way to access close() from here, since it is
                a local variable inside ItemSettingsDrawerModal — not reachable any other way.
                The modal calls children(close), handing us its close so our rows can trigger
                the animated close sequence instead of abruptly destroying the modal. */}
                {(close) => (<>
                    <SettingsRow
                        icon="🔗"
                        label={canNativeShare ? "Share" : "Copy Link"}
                        onClick={() => {
                            const url = `${window.location.origin}/mediaitem/${selectedMediaItemDetail.id}`;
                            if (canNativeShare) {
                                // .catch() swallows the AbortError thrown when the user
                                // dismisses the native share sheet without sharing.
                                navigator.share({ title: selectedMediaItemDetail.name, url }).catch(() => {});
                            } else {
                                navigator.clipboard.writeText(url).catch(() => {});
                            }
                            close();
                        }}
                    />
                    <SettingsRow
                        icon="📋"
                        label={getButtonLabel()}
                        onClick={() => { setShowLinkModal(true); close(); }}
                    />
                    {selectedMediaItemDetail.canEdit && (
                        <SettingsRow
                            icon="✏️"
                            label={isEditMode ? 'Exit "Edit Mode"' : 'Edit'}
                            onClick={() => { setIsEditMode(prev => !prev); close(); }}
                        />
                    )}
                </>)}
            </ItemSettingsDrawerModal>


        </div>
        </AnimatedPage>
    )


}

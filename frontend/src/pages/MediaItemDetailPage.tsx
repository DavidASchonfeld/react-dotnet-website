// React Libraries
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// My Code
import type { RootState } from '../store/store';
import MediaTypeLabel from '../components/MediaTypeLabel';
import {
    useGetMediaItemDetailQuery,
    usePatchMediaItemBasicInfoMutation,
    useAddMediaItemToListMutation,
    useRemoveMediaItemFromListMutation,
    useLazyGetMediaItemListsQuery,
    useLazyGetMyMediaListsQuery,
    useLazySearchMediaListsQuery,
} from '../services/apiSlice';
import MediaItemFormModal from '../components/modals/MediaItemFormModal';
import RowItemContent from '../components/RowItemContent';
import RowItemStyling from '../components/RowItemStyling';
import AnimatedPage from '../components/AnimatedPage';
import { useSearch } from '../hooks/useSearch';
import { SEARCH_DEFAULT_LIMIT } from '../constants';
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

    const { token } = useSelector((state: RootState) => state.auth);

    const navigate = useNavigate();

    // navigator.share = the native iOS/Android/desktop share sheet (like Spotify).
    // This is the default Share popup that you see whenever you click Share on your iPhone.
    // Supported on Chrome/Safari/Edge on macOS & Windows, but NOT Firefox desktop.
    // When unavailable, the button becomes a "Copy Link" button instead.
    const canNativeShare = typeof navigator.share === 'function';

    const mediaItemId = parseInt(id ?? '');
    // RTK Query auto-fetches on mount and auto-cleans cache on unmount.
    // skip=true when the id is invalid to avoid a bad request.
    const { data: selectedMediaItemDetail, isLoading, error } = useGetMediaItemDetailQuery(
        mediaItemId,
        { skip: isNaN(mediaItemId) }
    );

    const [patchMediaItem] = usePatchMediaItemBasicInfoMutation();
    const [addItemToList] = useAddMediaItemToListMutation();
    const [removeItemFromList] = useRemoveMediaItemFromListMutation();
    const [triggerGetMediaItemLists] = useLazyGetMediaItemListsQuery();
    const [triggerGetMyLists] = useLazyGetMyMediaListsQuery();
    const [triggerSearchMediaLists] = useLazySearchMediaListsQuery();

    const [isEditMode, setIsEditMode] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);


    //// Objects for ManageLinkModal.tsx Component

    // States + Selectors
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [memberListIds, setMemberListIds] = useState<Set<number> | null>(null);
    const [modifiableListIds, setModifiableListIds] = useState<Set<number> | null>(null);
    const [listsLoading, setListsLoading] = useState(false);

    // Pre-loaded owned lists for Tab 1 of ManageLinkModal (loaded lazily when modal opens)
    const [ownedLists, setOwnedLists] = useState<MediaListSummary[]>([]);
    const [ownedListsLoading, setOwnedListsLoading] = useState(false);

    // Server-side search across all visible lists for ManageLinkModal Tab 2
    // (no ownedByUserId filter = all visible lists; Tab 1's owned list IDs are excluded client-side to avoid duplicates)
    const {
        results: listSearchResults,
        isSearching: isListSearching,
        handleSearchChange: handleListSearchChange,
    } = useSearch<MediaListSummary>(
        async (query) => await triggerSearchMediaLists({ query, limit: SEARCH_DEFAULT_LIMIT }).unwrap()
    );

    // Function to call List Membership directly from API,
    // bypassing Redux
    async function loadMembership(){
        if (!token) return;
        setListsLoading(true);
        try {
            // Single request: returns only the lists that contain this item,
            // each with canEdit already set by the backend.
            const memberLists = await triggerGetMediaItemLists(parseInt(id!)).unwrap();
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

    // Loads all lists owned by the current user — pre-fills Tab 1 "My Lists" in ManageLinkModal.
    // Called lazily when the modal opens (not on page load) to avoid an extra request on every page visit.
    async function loadOwnedLists(){
        if (!token) return;
        setOwnedListsLoading(true);
        try {
            const lists = await triggerGetMyLists().unwrap();
            setOwnedLists(lists);
        } catch {
            safeToast.error('Failed to load your lists');
        } finally {
            setOwnedListsLoading(false);
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

    // Runs only once (unless any of its dependencies (token, id) change).
    // RTK Query handles fetching selectedMediaItemDetail automatically — no dispatch needed.
    // RTK Query also handles cleanup on unmount — no clearSelectedMediaItemDetail needed.
    useEffect(()=> {
        if (token){
            loadMembership();
        }
    }, [token, id]);



    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error loading item</div>
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
                        onConfirm = {async (name, description, mediaTypeId, publishedDateTime) => {
                            await patchMediaItem({
                                mediaItemId: selectedMediaItemDetail.id,
                                data: { name, description, mediaTypeId, publishedDateTime }
                            }).unwrap();
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
                    searchPlaceholder='Search (min. 2 characters)...'
                    onSearchChange={handleListSearchChange}
                    tabs={[
                        {
                            // Tab 1 "My Lists": pre-loaded owned lists — shown immediately, filtered client-side by the modal's search bar
                            label: 'My Lists',
                            candidates: ownedLists.map(l => ({
                                id: l.id.toString(),
                                primaryLabel: l.name,
                                secondaryLabel: l.description ?? undefined,
                                countLabel: `${l.itemCount} items`,
                                hasModifyLinkAccess: true,  // user owns these, always editable
                            })),
                        },
                        {
                            // Tab 2 "Non-Owned Lists": server-side search results
                            label: 'Non-Owned Lists',
                            candidates: listSearchResults
                                .filter(l => !ownedLists.some(o => o.id === l.id))
                                .map(l => ({
                                    id: l.id.toString(),
                                    primaryLabel: l.name,
                                    secondaryLabel: l.description ?? undefined,
                                    countLabel: `${l.itemCount} items`,
                                    hasModifyLinkAccess: l.canEdit,
                                })),
                        },
                    ]}
                    candidatesLoading={ownedListsLoading || isListSearching}

                    // Convert Set<number> -> Set<string> at the modal boundary
                    initialLinkedIds={[...(memberListIds ?? new Set())].map(String)}

                    onAdd={async (itemId) => {
                        // itemId is the list's id (as string); selectedMediaItemDetail.id is the item being linked
                        await addItemToList({ listId: parseInt(itemId), mediaItemId: selectedMediaItemDetail!.id }).unwrap();
                    }}
                    onRemove={async (itemId) => {
                        await removeItemFromList({ listId: parseInt(itemId), mediaItemId: selectedMediaItemDetail!.id }).unwrap();
                    }}
                    removeConfirmTitle="Remove item from list?"
                    getRemoveConfirmMessage={(item) =>
                        `Remove "${selectedMediaItemDetail?.name}" from "${item.primaryLabel}"?`
                    }
                    onClose={(updatedIds) => {
                        // Convert string[] → Set<number> back from the modal boundary
                        setMemberListIds(new Set(updatedIds.map(Number)));
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
                        onClick={() => { setShowLinkModal(true); loadOwnedLists(); close(); }}
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

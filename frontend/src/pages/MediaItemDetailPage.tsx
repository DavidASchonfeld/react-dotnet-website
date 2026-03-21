// React Libraries
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { fetchMyLists } from '../store/mediaListsSlice';
import { addMediaItemToList, removeMediaItemFromList } from '../services/mediaListService';
import { getMediaItemLists } from '../services/mediaItemService';
import ManageLinkModal from '../components/modals/ManageLinkModal';
import { safeToast } from '../utils/safeToast';



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

    const [isEditMode, setIsEditMode] = useState(false);


    //// Objects for ManageLinkModal.tsx Component

    // States + Selectors
    const { mediaLists } = useSelector((state: RootState) => state.mediaLists);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [memberListIds, setMemberListIds] = useState<Set<number> | null>(null);
    const [modifiableListIds, setModifiableListIds] = useState<Set<number> | null>(null);
    const [listsLoading, setListsLoading] = useState(false);

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
            const list = mediaLists.find(l => memberListIds.has(l.id) && modifiableListIds?.has(l.id));
            return list ? `Saved to "${list.name}"`: "Saved to 1 list";
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




        // Add for ManageLinkModal.tsx
        if (token){
            dispatch(fetchMyLists(token));  // populates mediaLists in Redux
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

            {selectedMediaItemDetail.canEdit && (
                <button onClick = {() => setIsEditMode(prev => !prev)}>
                    {isEditMode ? 'Exit "Edit Mode"' : 'Edit'}
                </button>
            )}
            
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

                    <button
                        className="btn btn-secondary fit-w"
                        onClick={() => setShowLinkModal(true)}>
                        {getButtonLabel()}
                    </button>
                </>
            )}

            {showLinkModal && (
                <ManageLinkModal
                    modalTitle='Add/Remove from List'
                    searchPlaceholder='Search lists'
                    candidates={mediaLists.map(l => ({
                        id: l.id.toString(),
                        primaryLabel: l.name,
                        secondaryLabel: l.description ?? undefined,
                        countLabel: `${l.itemCount} items`,
                        hasModifyLinkAccess: modifiableListIds?.has(l.id) ?? false
                    }))}
                    candidatesLoading={listsLoading}
                    // Convert Set<number> → Set<string> at the modal boundary
                    initialLinkedIds={new Set([...(memberListIds ?? new Set())].map(String))}
                    showModifiableFilter={true}
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

            
        </div>
        </AnimatedPage>
    )


}

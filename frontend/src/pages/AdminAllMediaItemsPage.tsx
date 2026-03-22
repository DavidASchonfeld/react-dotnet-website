import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import { useEffect, useState } from "react";
import { createMediaItemTHUNK, deleteMediaItemTHUNK, fetchAllApprovedMediaItemsForAdmin, fetchMediaItemDetail, patchMediaItemBasicInfoTHUNK } from "../store/mediaItemsSlice";
import RowItemContent from "../components/RowItemContent";
import RowItemStyling from "../components/RowItemStyling";
import MediaTypeLabel from "../components/MediaTypeLabel";
import MediaItemFormModal from "../components/modals/MediaItemFormModal";
import type { MediaItemDetail } from "../types/mediaItem";
import ConfirmModal from "../components/modals/ConfirmModal";
import AnimatedPage from "../components/AnimatedPage";
import { safeToast } from "../utils/safeToast";


export default function AdminAllMediaItemsPage() {


    
    // Original, separate fetching from RootState
    // const { mediaItems, status, error } = useSelector((state: RootState) => state.mediaItems);
    // const { token } = useSelector((state:RootState) => state.auth);
    // Consolidated into 1 Request for Fetching from RootState:
    const { mediaItems, token } = useSelector((state: RootState) => ({
        ...state.mediaItems,  // Unwrap the mediaList key/value-pair-objects and put them all into the output
        token: state.auth.token   // Telling where to specifically find the token value inside the RootState object
    }))


    const dispatch = useDispatch<AppDispatch>();

    // Local Variables (just for this component)
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [mediaItemToDeleteId, setMediaItemToDeleteId] = useState<number | null>(null);
    const [mediaItemToEdit, setMediaItemToEdit] = useState<MediaItemDetail | null>(null);


    async function handleEditClick(mediaItemId: number){
        try {
            const mediaItemDetailObject = await dispatch(fetchMediaItemDetail({token: token!, mediaItemId: mediaItemId})).unwrap();
            setMediaItemToEdit(mediaItemDetailObject);
        } catch (err) {
            console.error(err);
            safeToast.error('Failed to load item details');
        }
    }

    async function handleCreate(name: string, description: string, mediaTypeId: number, publishedDateTime: string){
        try {
            await safeToast.promise(
                dispatch(createMediaItemTHUNK({
                    token: token!,
                    data: {name,
                        description,
                        mediaTypeId,
                        publishedDateTime: publishedDateTime || null
                    }
                })).unwrap(),  // Unwrap lets me catch the error here into this try block
                { loading: 'Creating...', success: 'Media item created', error: 'Failed to create media item' }
            );
            setShowCreateModal(false);
        } catch (err) {
            console.error(err);
            // Error toast already shown by safeToast.promise above
        }
    }

    async function handleEdit(name: string, description: string, mediaTypeId: number, publishedDateTime: string){
        try {
            await safeToast.promise(
                dispatch(patchMediaItemBasicInfoTHUNK({
                    token: token!,
                    mediaItemId: mediaItemToEdit!.id,
                    data: {name,
                        description,
                        mediaTypeId,
                        publishedDateTime: publishedDateTime || undefined
                    }
                })).unwrap(),  // Unwrap lets me catch the error here into this try block
                { loading: 'Saving...', success: 'Media item updated', error: 'Failed to update media item' }
            );
            setMediaItemToEdit(null);
        } catch (err) {
            console.error(err);
            // Error toast already shown by safeToast.promise above
        }
    }

    async function confirmDelete() {
        if (mediaItemToDeleteId === null) return;
        try {
            await safeToast.promise(
                dispatch(deleteMediaItemTHUNK({token: token!, mediaItemId: mediaItemToDeleteId})).unwrap(),
                { loading: 'Deleting...', success: 'Media item deleted', error: 'Failed to delete media item' }
            );
        } catch (err) {
            console.error(err);
            // Error toast already shown by safeToast.promise above
        } finally {
            setMediaItemToDeleteId(null);
        }
    }

    

    useEffect( () => {
        const run = async () => {
            try {
                await dispatch(fetchAllApprovedMediaItemsForAdmin(token!)).unwrap();
            } catch (err) {
                console.error(err);
                safeToast.error('Failed to load media items');
            }
        };
        run();
    }, [dispatch, token]);


    // The scroll-up too much automatically refreshes the list of MediaItems.
    useEffect( () => {
        let lastScrollY = window.scrollY;
        function handleScroll() {
            const currentScrollY = window.scrollY;
            if (currentScrollY === 0 && lastScrollY > 0){
                // I am intentially giving it silent failing, because this triggers every time
                // that the user scrolls to the top, which would be disruptive to the user.
                // Errors are still stored in the Redux state.
                // I need to use .unwrap() to expose dispatch's error outwards, which I need here
                // to catch the error and type it to the console.log.
                dispatch(fetchAllApprovedMediaItemsForAdmin(token!))
                    .unwrap()
                    .catch(err => console.log('[scroll refresh] Silent fail — error stored in Redux state:', err));
            }
            lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [dispatch, token]);




    return (
        <AnimatedPage>
        <div className = "page">
            <h1>Admininstrator: All Media Items</h1>
            <button
                onClick = {() => setShowCreateModal(true)}
            >+ Create Media Item</button>
            <button
                onClick = {() => dispatch(fetchAllApprovedMediaItemsForAdmin(token!))}
            >Refresh</button>
            
            {mediaItems.map(mediaItem => (
                <div key={mediaItem.id}>
                    <RowItemStyling>
                        <RowItemContent
                            firstString={mediaItem.name}
                            labelPill={<MediaTypeLabel mediaTypeId={mediaItem.mediaTypeId} faded={true} />}
                        />
                    </RowItemStyling>
                    <button onClick={() => handleEditClick(mediaItem.id)}>Edit</button>
                    <button onClick={() => setMediaItemToDeleteId(mediaItem.id)}>Delete</button>
                </div>
            ))}

            {showCreateModal && <MediaItemFormModal onConfirm={handleCreate} onCancel={() => setShowCreateModal(false)} />}
            {mediaItemToEdit && <MediaItemFormModal existingItem = {mediaItemToEdit} onConfirm={handleEdit} onCancel={() => setMediaItemToEdit(null)} />}
            {mediaItemToDeleteId !== null && (
                <ConfirmModal
                    // NOTE on JavaScript Format:
                    // Right: title = "" or {""} or title = attributeName
                    // Wrong: title = {} or () or [] etc.
                    title={`Do you want to delete "${mediaItems.find(i => i.id === mediaItemToDeleteId)?.name ?? ''}"?`}
                    message=""
                    onConfirm={confirmDelete}
                    onCancel={() => setMediaItemToDeleteId(null)}
                />
            )}
        </div>
        </AnimatedPage>
    );

}
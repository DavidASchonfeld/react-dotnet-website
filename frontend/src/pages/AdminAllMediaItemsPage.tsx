import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import { useEffect, useState } from "react";
import { createMediaItemTHUNK, deleteMediaItemTHUNK, fetchAllApprovedMediaItemsForAdmin, fetchMediaItemDetail, patchMediaItemBasicInfoTHUNK } from "../store/mediaItemsSlice";
import MediaTypeLabel from "../components/MediaTypeLabel";
import MediaItemFormModal from "../components/modals/MediaItemFormModal";
import type { MediaItemDetail } from "../types/mediaItem";
import ConfirmModal from "../components/modals/ConfirmModal";


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
        }
    }

    async function handleCreate(name: string, description: string, mediaTypeId: number, publishedDateTime: string){
        try {
            await dispatch(createMediaItemTHUNK({
                token: token!,
                data: {name,
                    description,
                    mediaTypeId,
                    publishedDateTime: publishedDateTime || null
                }
            })).unwrap();  // Unwrap lets me catch the error here into this try block
            setShowCreateModal(false);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleEdit(name: string, description: string, mediaTypeId: number, publishedDateTime: string){
        try {
            await dispatch(patchMediaItemBasicInfoTHUNK({
                token: token!,
                mediaItemId: mediaItemToEdit!.id,
                data: {name,
                    description,
                    mediaTypeId,
                    publishedDateTime: publishedDateTime || undefined
                }
            })).unwrap();  // Unwrap lets me catch the error here into this try block
            setMediaItemToEdit(null);
        } catch (err) {
            console.error(err);
        }
    }

    async function confirmDelete() {
        if (mediaItemToDeleteId === null) return;
        try {
            await dispatch(deleteMediaItemTHUNK({token: token!, mediaItemId: mediaItemToDeleteId})).unwrap();
            setMediaItemToDeleteId(null);
        } catch (err) {
            console.error(err);
            setMediaItemToDeleteId(null);
        }
    }

    

    useEffect( () => {
        const run = async () =>{
            try {
                dispatch(fetchAllApprovedMediaItemsForAdmin(token!));
            } catch(err) {
                console.error(err);
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
                try{
                    dispatch(fetchAllApprovedMediaItemsForAdmin(token!));
                } catch(err) {
                    console.error(err);
                }
                
            }
            lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [dispatch, token]);




    return (
        <div>
            <h1>Admininstrator: All Media Items</h1>
            <button
                onClick = {() => setShowCreateModal(true)}
            >+ Create Media Item</button>
            <button
                onClick = {() => dispatch(fetchAllApprovedMediaItemsForAdmin(token!))}
            >Refresh</button>
            
            {mediaItems.map(mediaItem => (
                <div key={mediaItem.id}>
                    <MediaTypeLabel mediaTypeId={mediaItem.mediaTypeId} />
                    <span>{mediaItem.name}</span>
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
    );

}
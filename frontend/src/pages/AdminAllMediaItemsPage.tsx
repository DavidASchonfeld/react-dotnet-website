import { useEffect, useState } from "react";
import {
    useGetAllApprovedMediaItemsForAdminQuery,
    useLazyGetMediaItemDetailQuery,
    useCreateMediaItemMutation,
    usePatchMediaItemBasicInfoMutation,
    useDeleteMediaItemMutation,
} from "../services/apiSlice";
import RowItemContent from "../components/RowItemContent";
import RowItemStyling from "../components/RowItemStyling";
import MediaTypeLabel from "../components/MediaTypeLabel";
import MediaItemFormModal from "../components/modals/MediaItemFormModal";
import type { MediaItemDetail } from "../types/mediaItem";
import ConfirmModal from "../components/modals/ConfirmModal";
import AnimatedPage from "../components/AnimatedPage";
import { safeToast } from "../utils/safeToast";


export default function AdminAllMediaItemsPage() {


    const { data: mediaItems = [], refetch } = useGetAllApprovedMediaItemsForAdminQuery();
    const [triggerGetDetail] = useLazyGetMediaItemDetailQuery();
    const [createMediaItemMutation] = useCreateMediaItemMutation();
    const [patchMediaItemMutation] = usePatchMediaItemBasicInfoMutation();
    const [deleteMediaItemMutation] = useDeleteMediaItemMutation();

    // Local Variables (just for this component)
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [mediaItemToDeleteId, setMediaItemToDeleteId] = useState<number | null>(null);
    const [mediaItemToEdit, setMediaItemToEdit] = useState<MediaItemDetail | null>(null);


    async function handleEditClick(mediaItemId: number){
        try {
            const mediaItemDetailObject = await triggerGetDetail(mediaItemId).unwrap();
            setMediaItemToEdit(mediaItemDetailObject);
        } catch (err) {
            console.error(err);
            safeToast.error('Failed to load item details');
        }
    }

    async function handleCreate(name: string, description: string, mediaTypeId: number, publishedDateTime: string){
        try {
            await createMediaItemMutation({
                name,
                description,
                mediaTypeId,
                publishedDateTime: publishedDateTime || null
            }).unwrap();  // Unwrap lets me catch the error here into this try block
            setShowCreateModal(false);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleEdit(name: string, description: string, mediaTypeId: number, publishedDateTime: string){
        try {
            await patchMediaItemMutation({
                mediaItemId: mediaItemToEdit!.id,
                data: {name,
                    description,
                    mediaTypeId,
                    publishedDateTime: publishedDateTime || undefined
                }
            }).unwrap();  // Unwrap lets me catch the error here into this try block
            setMediaItemToEdit(null);
        } catch (err) {
            console.error(err);
        }
    }

    async function confirmDelete() {
        if (mediaItemToDeleteId === null) return;
        try {
            await deleteMediaItemMutation(mediaItemToDeleteId).unwrap();
        } catch (err) {
            console.error(err);
        } finally {
            setMediaItemToDeleteId(null);
        }
    }


    // The scroll-up too much automatically refreshes the list of MediaItems.
    useEffect( () => {
        let lastScrollY = window.scrollY;
        function handleScroll() {
            const currentScrollY = window.scrollY;
            if (currentScrollY === 0 && lastScrollY > 0){
                // I am intentionally giving it silent failing, because this triggers every time
                // that the user scrolls to the top, which would be disruptive to the user.
                refetch();
            }
            lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [refetch]);



    return (
        <AnimatedPage>
        <div className = "page">
            <h1>Admininstrator: All Media Items</h1>
            <button
                onClick = {() => setShowCreateModal(true)}
            >+ Create Media Item</button>
            <button
                onClick = {() => refetch()}
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

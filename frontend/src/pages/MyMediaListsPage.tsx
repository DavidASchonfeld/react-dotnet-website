// React.js Library
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';


// My Code
import { VisibilityStatus } from '../types/enums';
import type { RootState } from '../store/store';
import {
    useGetMyMediaListsQuery,
    useCreateMediaListMutation,
    useDeleteMediaListMutation,
} from '../services/apiSlice';
import MediaListFormModal from '../components/modals/MediaListFormModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import RowItemContent from '../components/RowItemContent';
import AnimatedPage from '../components/AnimatedPage';
import PaginationControls from '../components/PaginationControls';



export default function MyMediaListsPage() {


    const { token } = useSelector((state: RootState) => state.auth);

    // Importing ability to Redirect
    const navigate = useNavigate();

    const [page, setPage] = useState(1);

    const { data: result, isLoading, error, refetch } = useGetMyMediaListsQuery({ page });
    const mediaLists = result?.items ?? [];
    const [createList] = useCreateMediaListMutation();
    const [deleteList] = useDeleteMediaListMutation();


    //// Local State for this component
    // For Deletion
    const [mediaListToDelete, setMediaListToDelete] = useState<number | null>(null);

    // For Create MediaList
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);


    // Runs after Page Loads, adds EventListener for scroll tracking
    useEffect(() => {
        let lastScrollY = 0;
        function handleScroll() {
            const currentScrollY = window.scrollY;
            if (currentScrollY === 0 && lastScrollY > 0){
                setPage(1);
                refetch();
            }
            lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [refetch]);


    async function confirmDelete() {
        if (mediaListToDelete === null) return;
        try {
            await deleteList(mediaListToDelete).unwrap();
            setMediaListToDelete(null);
        } catch (err) {
            console.error(err);
            setMediaListToDelete(null);
        }
    }

    async function handleCreateMediaList(newListName: string, newListDescription: string) {
        try {
            await createList({
                name: newListName,
                description: newListDescription || undefined,
                visibilityStatus: VisibilityStatus.Private
            }).unwrap();
            setShowCreateModal(false);
        } catch (err) {
            console.error(err);
        }
    }


    if (isLoading) return (
        <div className="page">
            <div className="animate-pulse space-y-3">
                <div className="h-14 bg-surface-raised rounded-lg" />
            </div>
        </div>
    );
    if (error) return <div>Failed to load lists</div>;
    if (!token) return null;


    return (
        <AnimatedPage>
        <div className='page'>

            {/* tracking-tight reduces letter-spacing — standard for large display headings
                to prevent characters from looking too spread out at bigger sizes */}
            <h1 className="text-2xl font-bold tracking-tight">My Lists</h1>

            <div className = "flex gap-2 justify-center">

                {/* Create MediaList Button */}
                <button className="btn btn-secondary w-fit" onClick={
                    () => setShowCreateModal(true)
                }> + Create List</button>


                {/* Refresh Button - Calls Refresh on Click: */}
                <button className="btn btn-secondary w-fit"
                onClick={() => refetch()}
                > ⟳ Refresh</button>

            </div>
            <div className="flex flex-col gap-3">

                {mediaLists.map(mediaList => (
                    <div key={mediaList.id}
                        className="card flex justify-between items-stretch cursor-pointer"
                        onClick={() => navigate(`/medialist/${mediaList.id}`)}
                    >
                        <RowItemContent
                            firstString={mediaList.name}
                            secondString={`${mediaList.itemCount} items`}

                            larger={true}
                            thirdString={mediaList.description ?? undefined}
                        />


                        <button
                        className="btn btn-secondary w-fit"
                        onClick={
                            // e.stopPropagation() prevents this button's click event from bubbling up
                            // to the parent div's onClick, which would otherwise also trigger navigation.
                            (e) => { e.stopPropagation(); setMediaListToDelete(mediaList.id); }
                        }>Delete</button>
                    </div>
                ))}

            </div>

            {result && (
                <PaginationControls
                    page={result.page}
                    totalPages={result.totalPages}
                    hasNextPage={result.hasNextPage}
                    hasPreviousPage={result.hasPreviousPage}
                    onPageChange={setPage}
                />
            )}


            {/*
                in showCreateModal,
                    for onConfirm: pass in the already-created function handleCreateMediaList in directly
                    for onCancel: here, passing in a non-named function (by calling "() => "), and inside that non-named function, run a specific command "setShowCreateModal(false)"
            */}
            {showCreateModal && (

                <MediaListFormModal
                    mode = "create"
                    onConfirm={handleCreateMediaList}
                    onCancel={() => setShowCreateModal(false)}
                />
            )}


            {/* Remember "?" means the object could be null
            ?? means if that value is null, use the string after the "??" */}
            {mediaListToDelete !== null && (

               <ConfirmModal
                    title = {`Delete the list "${mediaLists.find(l=>l.id==mediaListToDelete)?.name ?? ''}"`}
                    message = "Delete the list?"
                    confirmLabel = "Delete"
                    onConfirm = {confirmDelete}
                    onCancel = { () => setMediaListToDelete(null)}
                />
             )}


        </div>
        </AnimatedPage>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useGetFeaturedListsQuery,
    useCreateFeaturedListMutation,
} from '../services/apiSlice';
import MediaListFormModal from '../components/modals/MediaListFormModal';
import AnimatedPage from '../components/AnimatedPage';
import RowItemContent from '../components/row_item_related/RowItemContent';
import { routes } from '../utils/routes';



export default function AdminEditFeaturedPage() {

    const navigate = useNavigate();

    const { data: featuredLists = [], isLoading, error, refetch } = useGetFeaturedListsQuery();
    const [createFeaturedList] = useCreateFeaturedListMutation();

    const [showCreateModal, setShowCreateModal] = useState(false);


    async function handleCreateFeaturedList(name: string, description: string) {
        try {
            await createFeaturedList({
                name,
                description: description || undefined,
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
    if (error) return <div className="page">Failed to load featured lists.</div>;


    return (
        <AnimatedPage>
        <div className="page">

            <h1 className="text-2xl font-bold tracking-tight">Edit Featured</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
                Featured lists are website-wide and publicly visible. Only administrators can modify them.
            </p>

            <div className="flex gap-2 justify-center">
                <button className="btn btn-secondary w-fit" onClick={() => setShowCreateModal(true)}>
                    + Create Featured List
                </button>
                <button className="btn btn-secondary w-fit" onClick={() => refetch()}>
                    ⟳ Refresh
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {featuredLists.length === 0 && (
                    <p className="text-center text-[var(--color-text-muted)]">No featured lists yet.</p>
                )}
                {featuredLists.map(list => (
                    <div
                        key={list.id}
                        className="card flex justify-between items-stretch cursor-pointer"
                        onClick={() => navigate(routes.mediaList(list.id))}
                    >
                        <RowItemContent
                            firstString={list.name}
                            secondString={`${list.listContent.length} items`}
                            larger={true}
                            thirdString={list.description ?? undefined}
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] select-none">
                                Featured
                            </span>
                            <button
                                className="btn btn-secondary w-fit"
                                onClick={(e) => { e.stopPropagation(); navigate(routes.mediaList(list.id)); }}
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <MediaListFormModal
                    mode="create"
                    onConfirm={handleCreateFeaturedList}
                    onCancel={() => setShowCreateModal(false)}
                />
            )}

        </div>
        </AnimatedPage>
    );
}

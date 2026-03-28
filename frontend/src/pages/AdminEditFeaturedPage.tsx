import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useGetFeaturedListsQuery,
    useCreateFeaturedListMutation,
} from '../services/apiSlice';
import NameAndDescriptionModal from '../components/modals/NameAndDescriptionModal';
import AnimatedPage from '../components/AnimatedPage';
import RowItemStyling from '../components/row_item_related/RowItemStyling';
import RowItemContent from '../components/row_item_related/RowItemContent';
import BadgePill from '../components/BadgePill';
import ListCollageThumb from '../components/ListCollageThumb';
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

            <div className="rounded-lg border border-border overflow-hidden">
                {featuredLists.length === 0 && (
                    <p className="text-center text-[var(--color-text-muted)]">No featured lists yet.</p>
                )}
                {featuredLists.map(list => {
                    const thumbUrls = list.listContent
                        .slice(0, 4)
                        .map(item => item.thumbnailUrl)
                        .filter((u): u is string => !!u);
                    return (
                        <RowItemStyling key={list.id} variant="larger">
                            <RowItemContent
                                firstString={list.name}
                                secondString={`${list.listContent.length} items`}
                                thirdString={list.description ?? undefined}
                                larger
                                labelPill={<BadgePill label="Featured" />}
                                customLeftElement={<ListCollageThumb urls={thumbUrls} />}
                                onClick={() => navigate(routes.mediaList(list.id))}
                            />
                        </RowItemStyling>
                    );
                })}
            </div>

            {showCreateModal && (
                <NameAndDescriptionModal
                    mode="create"
                    onConfirm={handleCreateFeaturedList}
                    onCancel={() => setShowCreateModal(false)}
                />
            )}

        </div>
        </AnimatedPage>
    );
}

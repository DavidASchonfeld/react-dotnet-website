import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import {
    useGetItemsByTagQuery,
    useLazySearchExternalApiQuery,
    useFindOrCreateMediaApiRefMutation,
    useAddTagToMediaApiRefMutation,
    useRemoveTagFromMediaApiRefMutation,
    useGetActiveApiSourcesQuery,
} from '../services/apiSlice';
import type { ExternalApiSourceSummary } from '../types/externalApiSource';
import AnimatedPage from '../components/AnimatedPage';
import BackButton from '../components/BackButton';
import RowItemStyling from '../components/row_item_related/RowItemStyling';
import RowItemContent from '../components/row_item_related/RowItemContent';
import MediaTypeLabel from '../components/MediaTypeLabel';
import PaginationControls from '../components/PaginationControls';
import ManageLinkModal from '../components/modals/ManageLinkModal';
import { SEARCH_DEFAULT_LIMIT } from '../constants';
import { routes } from '../utils/routes';

export default function TagDetailPage() {
    const { tagId } = useParams<{ tagId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const parsedTagId = parseInt(tagId ?? '');
    // Tag name passed via navigation state; falls back gracefully
    const tagName: string | undefined = (location.state as { tagName?: string } | null)?.tagName;

    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    const [page, setPage] = useState(1);
    const [showTagModal, setShowTagModal] = useState(false);

    // Tracks the API source chosen in the last search (needed by onAdd)
    const [currentApiSource, setCurrentApiSource] = useState<ExternalApiSourceSummary | null>(null);

    const { data: result, isLoading, error } = useGetItemsByTagQuery(
        { tagId: parsedTagId, page },
        { skip: isNaN(parsedTagId) }
    );
    const items = result?.items ?? [];

    const { data: activeApiSources } = useGetActiveApiSourcesQuery();
    const [triggerSearch, { data: searchData, isFetching: isSearching }] = useLazySearchExternalApiQuery();
    const [findOrCreate] = useFindOrCreateMediaApiRefMutation();
    const [addTag] = useAddTagToMediaApiRefMutation();
    const [removeTag] = useRemoveTagFromMediaApiRefMutation();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading tag items. The tag may be private.</div>;

    return (
        <AnimatedPage>
        <div className="page">
            <div className="flex gap-2 flex-wrap">
                <BackButton />
                {/* Only logged-in users can tag items */}
                {isAuthenticated && (
                    <button className="btn btn-secondary w-fit" onClick={() => setShowTagModal(true)}>
                        + Tag Items
                    </button>
                )}
            </div>

            <h1 className="h1-styling">{tagName ?? `Tag #${parsedTagId}`}</h1>
            <p className="text-sm text-gray-500 mb-4">
                {result?.totalCount ?? 0} item{result?.totalCount !== 1 ? 's' : ''} with this tag
            </p>

            {items.length > 0 ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {items.map(item => (
                        <RowItemStyling key={item.id} onClick={() => navigate(routes.mediaApiRef(item.apiSourceName, item.externalId))}>
                            <RowItemContent
                                firstString={item.name}
                                secondString={item.creatorName ?? undefined}
                                labelPill={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
                            />
                        </RowItemStyling>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400">No items have been tagged with this tag yet.</p>
            )}

            {result && (
                <PaginationControls
                    page={result.page}
                    totalPages={result.totalPages}
                    hasNextPage={result.hasNextPage}
                    hasPreviousPage={result.hasPreviousPage}
                    onPageChange={setPage}
                />
            )}

            {/* Tag Items Modal — searches external API for media to add/remove this tag from */}
            {showTagModal && (
                <ManageLinkModal
                    modalTitle="Tag Items"
                    allowedSearchTypes={['media']}
                    activeApiSources={activeApiSources}
                    defaultApiSourceId={activeApiSources?.[0]?.id ?? null}
                    onSearch={(query, filters) => {
                        const source = activeApiSources?.find(s => s.id === filters.apiSourceId)
                            ?? activeApiSources?.[0];
                        if (!source) return;
                        setCurrentApiSource(source);
                        triggerSearch({ query, mediaTypeId: source.mediaTypeId, limit: SEARCH_DEFAULT_LIMIT });
                    }}
                    candidates={(searchData?.data ?? []).map(item => ({
                        id: item.externalId,
                        primaryLabel: item.name,
                        secondaryLabel: item.creatorName ?? undefined,
                        labelComponent: <MediaTypeLabel mediaTypeId={currentApiSource?.mediaTypeId ?? 1} />,
                    }))}
                    candidatesLoading={isSearching}
                    // Best-effort: pre-check items visible on the current page
                    initialLinkedIds={items.map(i => i.externalId ?? String(i.id))}
                    onAdd={async (externalId) => {
                        const item = searchData?.data.find(r => r.externalId === externalId);
                        if (!currentApiSource || !item) return;
                        // Upsert MediaApiRef, then apply the tag
                        const ref = await findOrCreate({
                            externalApiSourceId: currentApiSource.id,
                            externalId: item.externalId,
                            name: item.name,
                            mediaTypeId: currentApiSource.mediaTypeId,
                            creatorName: item.creatorName,
                            publishedDate: item.publishedDate,
                        }).unwrap();
                        await addTag({ tagId: parsedTagId, mediaApiRefId: ref.id }).unwrap();
                    }}
                    onRemove={async (externalId) => {
                        // Find item on the current page by externalId, then remove the tag
                        const pageItem = items.find(i => i.externalId === externalId);
                        if (pageItem) {
                            await removeTag({ tagId: parsedTagId, mediaApiRefId: pageItem.id }).unwrap();
                        }
                    }}
                    removeConfirmTitle="Remove tag from item?"
                    getRemoveConfirmMessage={(item) => `Remove tag from "${item.primaryLabel}"?`}
                    onClose={() => setShowTagModal(false)}
                />
            )}
        </div>
        </AnimatedPage>
    );
}

import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetItemsByTagQuery } from '../services/apiSlice';
import MediaTypeLabel from '../components/MediaTypeLabel';
import AnimatedPage from '../components/AnimatedPage';
import RowItemStyling from '../components/RowItemStyling';
import RowItemContent from '../components/RowItemContent';
import PaginationControls from '../components/PaginationControls';
import { routes } from '../utils/routes';


export default function ExploreByTagPage() {
    const { tagId } = useParams<{ tagId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const parsedTagId = parseInt(tagId ?? '');
    // Tag name passed via navigation state from MyCustomTagsPage; falls back gracefully
    const tagName: string | undefined = (location.state as { tagName?: string } | null)?.tagName;

    const [page, setPage] = useState(1);

    const { data: result, isLoading, error } = useGetItemsByTagQuery(
        { tagId: parsedTagId, page },
        { skip: isNaN(parsedTagId) }
    );
    const items = result?.items ?? [];

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading tag items. The tag may be private.</div>;

    return (
        <AnimatedPage>
        <div className="page">
            <button className="btn btn-secondary w-fit" onClick={() => navigate(-1)}>⬅︎ Back</button>
            <div className="flex items-center gap-3 flex-wrap">
                <h1 className="h1-styling">{tagName ?? `Tag #${parsedTagId}`}</h1>
            </div>
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
        </div>
        </AnimatedPage>
    );
}

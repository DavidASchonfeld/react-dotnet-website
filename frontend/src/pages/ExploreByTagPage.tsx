import { useParams, useNavigate } from 'react-router-dom';
import {
    useGetItemsByTagQuery,
    useGetMyCustomTagsQuery,
} from '../services/apiSlice';
import MediaTypeLabel from '../components/MediaTypeLabel';
import AnimatedPage from '../components/AnimatedPage';
import RowItemStyling from '../components/RowItemStyling';
import RowItemContent from '../components/RowItemContent';


export default function ExploreByTagPage() {
    const { tagId } = useParams<{ tagId: string }>();
    const navigate = useNavigate();

    const parsedTagId = parseInt(tagId ?? '');

    const { data: items, isLoading, error } = useGetItemsByTagQuery(
        parsedTagId,
        { skip: isNaN(parsedTagId) }
    );
    const { data: myTags } = useGetMyCustomTagsQuery();
    const tag = myTags?.find(t => t.id === parsedTagId);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading tag items. The tag may be private.</div>;

    return (
        <AnimatedPage>
        <div className="page">
            <button className="btn btn-secondary w-fit" onClick={() => navigate(-1)}>⬅︎ Back</button>
            <div className="flex items-center gap-3 flex-wrap">
                <h1 className="h1-styling">{tag?.name ?? `Tag #${parsedTagId}`}</h1>
                {tag && (
                    <span className="badge badge-outline text-sm">
                        {tag.visibilityStatus === 1 ? 'Public' : 'Private'}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500 mb-4">
                {items?.length ?? 0} item{items?.length !== 1 ? 's' : ''} with this tag
            </p>

            {items && items.length > 0 ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {items.map(item => (
                        <RowItemStyling key={item.id} onClick={() => navigate(`/mediaapiref/${item.id}`)}>
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
        </div>
        </AnimatedPage>
    );
}

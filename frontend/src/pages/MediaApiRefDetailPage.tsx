import { useParams, useNavigate } from 'react-router-dom';
import {
    useGetMediaApiRefDetailQuery,
    useGetMediaApiRefListsQuery,
    useGetMediaApiRefTagsQuery,
    useAddTagToMediaApiRefMutation,
    useRemoveTagFromMediaApiRefMutation,
    useGetMyCustomTagsQuery,
} from '../services/apiSlice';
import MediaTypeLabel from '../components/MediaTypeLabel';
import AnimatedPage from '../components/AnimatedPage';
import RowItemStyling from '../components/RowItemStyling';
import RowItemContent from '../components/RowItemContent';


export default function MediaApiRefDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const mediaApiRefId = parseInt(id ?? '');

    const { data: detail, isLoading, error } = useGetMediaApiRefDetailQuery(
        mediaApiRefId,
        { skip: isNaN(mediaApiRefId) }
    );
    const { data: lists } = useGetMediaApiRefListsQuery(
        mediaApiRefId,
        { skip: isNaN(mediaApiRefId) }
    );
    const { data: appliedTags } = useGetMediaApiRefTagsQuery(
        mediaApiRefId,
        { skip: isNaN(mediaApiRefId) }
    );
    const { data: myTags } = useGetMyCustomTagsQuery();
    const [addTag] = useAddTagToMediaApiRefMutation();
    const [removeTag] = useRemoveTagFromMediaApiRefMutation();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading item.</div>;
    if (!detail) return null;

    const appliedTagIds = new Set(appliedTags?.map(t => t.id) ?? []);

    return (
        <AnimatedPage>
        <div className="page">
            <button className="btn btn-secondary w-fit" onClick={() => navigate(-1)}>⬅︎ Back</button>

            <h1 className="h1-styling">{detail.name}</h1>
            <MediaTypeLabel mediaTypeId={detail.mediaTypeId} />

            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                {detail.creatorName && <span>Creator: {detail.creatorName}</span>}
                {detail.publishedDate && <span>Published: {new Date(detail.publishedDate).getFullYear()}</span>}
                <span>Source: {detail.apiSourceName} · ID: {detail.externalId}</span>
            </div>

            <hr className="my-4" />

            {/* -- Custom Tags -- */}
            <h2 className="font-semibold text-lg mb-2">Custom Tags</h2>
            <div className="flex flex-wrap gap-2 mb-4">
                {appliedTags?.map(tag => (
                    <span key={tag.id} className="badge badge-primary flex items-center gap-1">
                        {tag.name}
                        <button
                            className="ml-1 text-xs"
                            onClick={() => removeTag({ tagId: tag.id, mediaApiRefId: detail.id })}
                        >✕</button>
                    </span>
                ))}
                {appliedTags?.length === 0 && <span className="text-gray-400 text-sm">No tags yet.</span>}
            </div>

            {/* Add tag from user's tag list */}
            {myTags && myTags.filter(t => !appliedTagIds.has(t.id)).length > 0 && (
                <div>
                    <p className="text-sm text-gray-500 mb-1">Add a tag:</p>
                    <div className="flex flex-wrap gap-2">
                        {myTags.filter(t => !appliedTagIds.has(t.id)).map(tag => (
                            <button
                                key={tag.id}
                                className="btn btn-secondary btn-sm"
                                onClick={() => addTag({ tagId: tag.id, mediaApiRefId: detail.id })}
                            >
                                + {tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <hr className="my-4" />

            {/* -- Lists containing this item -- */}
            <h2 className="font-semibold text-lg mb-2">Appears in Lists</h2>
            {lists && lists.length > 0 ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {lists.map(list => (
                        <RowItemStyling key={list.id} onClick={() => navigate(`/medialist/${list.id}`)}>
                            <RowItemContent firstString={list.name} secondString={list.description ?? undefined} />
                        </RowItemStyling>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 text-sm">Not in any lists yet.</p>
            )}
        </div>
        </AnimatedPage>
    );
}

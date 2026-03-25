import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useGetMediaApiRefDetailQuery,
    useGetMediaApiRefListsQuery,
    useGetMediaApiRefTagsQuery,
    useRefreshMediaApiRefDetailsMutation,
    useLazySearchMediaListsQuery,
    useLazySearchCustomTagsQuery,
    useAddMediaApiRefToListMutation,
    useRemoveMediaApiRefFromListMutation,
    useAddTagToMediaApiRefMutation,
    useRemoveTagFromMediaApiRefMutation,
} from '../services/apiSlice';
import { BACKEND_BASE_URL } from '../config';
import MediaTypeLabel from '../components/MediaTypeLabel';
import AnimatedPage from '../components/AnimatedPage';
import RowItemStyling from '../components/RowItemStyling';
import RowItemContent from '../components/RowItemContent';
import { CacheStatusPill } from '../components/CacheStatusPill';
import ItemActionsButton, { type MenuAction } from '../components/ItemActionsButton';
import ManageLinkModal from '../components/modals/ManageLinkModal';
import type { SearchType } from '../components/SearchBarWithFilters';
import { SEARCH_DEFAULT_LIMIT } from '../constants';


export default function MediaApiRefDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const mediaApiRefId = parseInt(id ?? '');

    const { data: cachedResponse, isLoading, error } = useGetMediaApiRefDetailQuery(
        mediaApiRefId,
        { skip: isNaN(mediaApiRefId) }
    );
    const detail = cachedResponse?.data;
    const cacheMetadata = cachedResponse?.cacheMetadata;

    const [refreshDetails, { isLoading: isRefreshing }] = useRefreshMediaApiRefDetailsMutation();
    // Modal state for adding this item to lists/tags
    const [showLinkModal, setShowLinkModal] = useState(false);
    // Tracks which type is active so the modal remounts on switch (fresh linkedIds)
    const [activeModalType, setActiveModalType] = useState<SearchType>('lists');

    // navigator.share = the native iOS/Android/desktop share sheet (like Spotify).
    // When unavailable, the button becomes a "Copy Link" button instead.
    const canNativeShare = typeof navigator.share === 'function';

    const { data: lists } = useGetMediaApiRefListsQuery(
        mediaApiRefId,
        { skip: isNaN(mediaApiRefId) }
    );
    const { data: appliedTags } = useGetMediaApiRefTagsQuery(
        mediaApiRefId,
        { skip: isNaN(mediaApiRefId) }
    );

    // Lazy search queries for the link modal
    const [triggerSearchLists, { data: listSearchData, isFetching: isSearchingLists }] = useLazySearchMediaListsQuery();
    const [triggerSearchTags, { data: tagSearchData, isFetching: isSearchingTags }] = useLazySearchCustomTagsQuery();

    const [addToList] = useAddMediaApiRefToListMutation();
    const [removeFromList] = useRemoveMediaApiRefFromListMutation();
    const [addTag] = useAddTagToMediaApiRefMutation();
    const [removeTag] = useRemoveTagFromMediaApiRefMutation();

    // Route poster through backend ImageCache instead of direct external URL
    const posterSrc = detail?.poster
        ? `${BACKEND_BASE_URL}/api/imagecache?url=${encodeURIComponent(detail.poster)}`
        : undefined;

    // const { data: appliedTags } = useGetMediaApiRefTagsQuery(
    //     mediaApiRefId,
    //     { skip: isNaN(mediaApiRefId) }
    // );
    // const { data: myTags } = useGetMyCustomTagsQuery();
    // const [addTag] = useAddTagToMediaApiRefMutation();
    // const [removeTag] = useRemoveTagFromMediaApiRefMutation();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading item.</div>;
    if (!detail) return null;

    // const appliedTagIds = new Set(appliedTags?.map(t => t.id) ?? []);

    const goToExternalWebsite = (inURL: string): (Window | null) => {return  window.open(inURL, "_blank", "noopener,noreferrer");}

    return (
        <AnimatedPage>
        <div className="page">
            <div className="flex justify-between items-center">
                <button className="btn btn-secondary w-fit" onClick={() => navigate(-1)}>⬅︎ Back</button>
                <ItemActionsButton
                    buttonClassName="btn btn-secondary w-10 h-10 flex items-center justify-center"
                    preview={
                        <RowItemStyling>
                            <RowItemContent
                                firstString={detail.name}
                                secondString={detail.creatorName ?? undefined}
                                labelPill={<MediaTypeLabel mediaTypeId={detail.mediaTypeId} faded={true} />}
                            />
                        </RowItemStyling>
                    }
                    onMenuClick={[
                        {
                            icon: "🔗",
                            label: canNativeShare ? "Share" : "Copy Link",
                            onClick: () => {
                                const url = window.location.href;
                                if (canNativeShare) {
                                    navigator.share({ title: detail.name, url }).catch(() => {});
                                } else {
                                    navigator.clipboard.writeText(url).catch(() => {});
                                }
                            },
                        } satisfies MenuAction,
                        {
                            icon: "📋",
                            label: "Add to List / Tag",
                            onClick: () => setShowLinkModal(true),
                        } satisfies MenuAction,
                    ]}
                />
            </div>

            <h1 className="h1-styling">{detail.name}</h1>
            <CacheStatusPill cacheMetadata={cacheMetadata} />
            <MediaTypeLabel mediaTypeId={detail.mediaTypeId} />

            {/* Staleness hint: show when details are older than the backend's staleness threshold */}
            {detail.isStale && (
                <div className="my-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                    <span>This data may be outdated.</span>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => refreshDetails(detail.id)}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            )}

            {/* Images served via backend ImageCache instead of direct external URL */}
            {posterSrc && (
                <div className="my-4">
                    <img
                        src={posterSrc}
                        alt={detail.name}
                        className="max-w-xs rounded-lg shadow-md"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                    />
                </div>
            )}

            {detail.plot && (
                <div className="my-4">
                    <h2 className="font-semibold text-lg mb-2">Plot</h2>
                    <p className="text-gray-700 dark:text-gray-300">{detail.plot}</p>
                </div>
            )}

            {(detail.mediaTypeId === 1 || detail.mediaTypeId === 2) && detail.runtime && (
                <div className="my-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Runtime: {detail.runtime}</span>
                </div>
            )}

            {detail.country && (
                <div className="my-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Country: {detail.country}</span>
                </div>
            )}

            {detail.genres && (
                <div className="my-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Genres: {detail.genres}</span>
                </div>
            )}

            {detail.rated && (
                <div className="my-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Rated: {detail.rated}</span>
                </div>
            )}


            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                {detail.creatorName && <span>Creator: {detail.creatorName}</span>}
                {detail.publishedDate && <span>Published: {new Date(detail.publishedDate).getFullYear()}</span>}
                {detail.apiHomepageUrl && (
                    // <span>
                    //     API: <a
                    //         href=
                    //         target="_blank"
                    //         rel="noopener noreferrer"
                    //         className="text-blue-600 dark:text-blue-400 hover:underline"
                    //     >
                    //         
                    //     </a>
                    // </span>
                    <button
                    className="btn btn-secondary w-fit"
                    onClick={() =>
                        // detail.apiHomepageUrl! has a "!" here because it is wrapped in {detail.apiHomepageUrl &&,
                        // meaning that this onyl shows if detail.apiHomepageUrl is not null, so we can use !
                        // to tell TypeScript that this variable will never have with a null value in this line"
                        goToExternalWebsite(detail.apiHomepageUrl!)}
                >{detail.apiSourceName} · ID: {detail.externalId}</button>
                )}
            </div>

            <hr className="my-4" />

            {/* -- Custom Tags -- */}
 {/*            <h2 className="font-semibold text-lg mb-2">Custom Tags</h2>
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
*/}

            {/* Add tag from user's tag list */}
 {/*           {myTags && myTags.filter(t => !appliedTagIds.has(t.id)).length > 0 && (
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
      */}  

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

        {/* Link modal — search Lists or Tags to associate with this media item */}
        {showLinkModal && (
            <ManageLinkModal
                key={activeModalType}  // remount on type switch so linkedIds reset for the new type
                modalTitle={activeModalType === 'lists' ? 'Add to Lists' : 'Tag this Item'}
                allowedSearchTypes={['lists', 'tags']}
                onSearch={(query, filters) => {
                    // Update active type first so candidates/initialLinkedIds stay in sync
                    if (filters.searchType !== activeModalType) setActiveModalType(filters.searchType)
                    if (filters.searchType === 'lists') triggerSearchLists({ query, limit: SEARCH_DEFAULT_LIMIT });
                    else triggerSearchTags({ query, limit: SEARCH_DEFAULT_LIMIT });
                }}
                candidates={activeModalType === 'lists'
                    ? (listSearchData ?? []).map(l => ({ id: String(l.id), primaryLabel: l.name, secondaryLabel: l.description ?? undefined }))
                    : (tagSearchData ?? []).map(t => ({ id: String(t.id), primaryLabel: t.name }))}
                candidatesLoading={isSearchingLists || isSearchingTags}
                initialLinkedIds={activeModalType === 'lists'
                    ? (lists ?? []).map(l => String(l.id))
                    : (appliedTags ?? []).map(t => String(t.id))}
                onAdd={async (id) => {
                    if (activeModalType === 'lists') {
                        await addToList({ listId: parseInt(id), mediaApiRefId }).unwrap();
                    } else {
                        await addTag({ tagId: parseInt(id), mediaApiRefId }).unwrap();
                    }
                }}
                onRemove={async (id) => {
                    if (activeModalType === 'lists') {
                        await removeFromList({ listId: parseInt(id), mediaApiRefId }).unwrap();
                    } else {
                        await removeTag({ tagId: parseInt(id), mediaApiRefId }).unwrap();
                    }
                }}
                removeConfirmTitle={activeModalType === 'lists' ? 'Remove from list?' : 'Remove tag?'}
                getRemoveConfirmMessage={(item) => `Remove "${item.primaryLabel}"?`}
                onClose={() => setShowLinkModal(false)}
            />
        )}

        </AnimatedPage>
    );
}

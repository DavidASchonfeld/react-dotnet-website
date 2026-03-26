import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useGetMediaApiRefByExternalQuery,
    useGetMediaApiRefListsQuery,
    useGetMediaApiRefTagsQuery,
    useRefreshMediaApiRefDetailsMutation,
    useFindOrCreateMediaApiRefMutation,
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
import BackButton from '../components/BackButton';
import RowItemStyling from '../components/row_item_related/RowItemStyling';
import RowItemContent from '../components/row_item_related/RowItemContent';
import { AdminItemStatusPanel } from '../components/administrator_related/AdminItemStatusPanel';
import ItemActionsButton from '../components/row_item_related/ItemActionsButton';
import { mediaApiRefActions } from '../utils/menuActions';
import { routes } from '../utils/routes';
import ManageLinkModal from '../components/modals/ManageLinkModal';
import type { SearchType } from '../components/SearchBarWithFilters';
import { SEARCH_DEFAULT_LIMIT } from '../constants';


export default function MediaApiRefDetailPage() {
    const { apiName, externalId } = useParams<{ apiName: string; externalId: string }>();
    const navigate = useNavigate();

    const decodedApiName = decodeURIComponent(apiName ?? '');
    const decodedExternalId = decodeURIComponent(externalId ?? '');

    const { data: cachedResponse, isLoading, error } = useGetMediaApiRefByExternalQuery(
        { apiName: decodedApiName, externalId: decodedExternalId },
        { skip: !apiName || !externalId }
    );
    const detail = cachedResponse?.data;
    const cacheMetadata = cachedResponse?.cacheMetadata;

    // When the item is not yet in the DB, detail.id === 0.
    // resolvedId is set after a lazy findOrCreate (triggered by opening the manage modal).
    const [resolvedId, setResolvedId] = useState(0);
    const effectiveMediaApiRefId = (detail?.id ?? 0) > 0 ? detail!.id : resolvedId;
    const isInDb = effectiveMediaApiRefId > 0;

    const [refreshDetails, { isLoading: isRefreshing }] = useRefreshMediaApiRefDetailsMutation();
    const [findOrCreate] = useFindOrCreateMediaApiRefMutation();

    // Modal state for adding this item to lists/tags
    const [showLinkModal, setShowLinkModal] = useState(false);
    // Tracks which type is active so the modal remounts on switch (fresh linkedIds)
    const [activeModalType, setActiveModalType] = useState<SearchType>('lists');

    const { data: lists } = useGetMediaApiRefListsQuery(
        effectiveMediaApiRefId,
        { skip: !isInDb }
    );
    const { data: appliedTags } = useGetMediaApiRefTagsQuery(
        effectiveMediaApiRefId,
        { skip: !isInDb }
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

    // Lazy findOrCreate: called when user opens the manage modal but the item isn't in the DB yet.
    const handleOpenManageModal = async () => {
        if (!detail) return;
        if (!isInDb) {
            try {
                const ref = await findOrCreate({
                    externalApiSourceId: detail.externalApiSourceId,
                    externalId: detail.externalId,
                    name: detail.name,
                    mediaTypeId: detail.mediaTypeId,
                    creatorName: detail.creatorName,
                    publishedDate: detail.publishedDate,
                    thumbnailUrl: detail.thumbnailUrl,
                }).unwrap();
                setResolvedId(ref.id);
            } catch {
                return;
            }
        }
        setShowLinkModal(true);
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) {
        const status = (error as { status?: number })?.status;
        if (status === 503) return <div>This API is temporarily disabled. The item cannot be loaded right now.</div>;
        return <div>Error loading item.</div>;
    }
    if (!detail) return null;

    const goToExternalWebsite = (inURL: string): (Window | null) => {return  window.open(inURL, "_blank", "noopener,noreferrer");}

    return (
        <AnimatedPage>
        <div className="page">
            <div className="flex justify-between items-center">
                <BackButton />
                <ItemActionsButton
                    buttonClassName="btn btn-secondary w-10 h-10 flex items-center justify-center"
                    firstString={detail.name}
                    secondString={detail.creatorName ?? undefined}
                    labelPill={<MediaTypeLabel mediaTypeId={detail.mediaTypeId} faded={true} />}
                    onMenuClick={mediaApiRefActions({
                        apiName: detail.apiSourceName,
                        externalId: detail.externalId,
                        name: detail.name,
                        navigate,
                        onManageListsTagsOpen: handleOpenManageModal,
                        includeGoToDetails: false,
                    })}
                />
            </div>

            <h1 className="h1-styling">{detail.name}</h1>
            <AdminItemStatusPanel cacheMetadata={cacheMetadata} isInDb={isInDb} />
            <MediaTypeLabel mediaTypeId={detail.mediaTypeId} />

            {/* Staleness hint: admin-only — only visible when adminInfo is populated and data is stale */}
            {detail.adminInfo?.isStale && isInDb && (
                <div className="my-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                    <span>This data may be outdated.</span>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => refreshDetails(effectiveMediaApiRefId)}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            )}

            {/* Disabled API warning — shown to all users when the external API is temporarily disabled */}
            {detail.isApiDisabled && (
                <div className="my-2 text-sm text-orange-600 dark:text-orange-400">
                    The external API for this item is temporarily disabled. Some details may be missing or incomplete.
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
                    <button
                    className="btn btn-secondary w-fit"
                    onClick={() =>
                        goToExternalWebsite(detail.apiHomepageUrl!)}
                >{detail.apiSourceName} · ID: {detail.externalId}</button>
                )}
            </div>

            <hr className="my-4" />

            {/* -- Lists containing this item -- */}
            <h2 className="font-semibold text-lg mb-2">Appears in Lists</h2>
            {isInDb ? (
                lists && lists.length > 0 ? (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {lists.map(list => (
                            <RowItemStyling key={list.id} onClick={() => navigate(routes.mediaList(list.id))}>
                                <RowItemContent firstString={list.name} secondString={list.description ?? undefined} />
                            </RowItemStyling>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">Not in any lists yet.</p>
                )
            ) : (
                <p className="text-gray-400 text-sm">Save this item to a list to see it here.</p>
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
                    ? (listSearchData ?? []).map(l => ({ id: String(l.id), firstString: l.name, secondString: l.description ?? undefined }))
                    : (tagSearchData ?? []).map(t => ({ id: String(t.id), firstString: t.name }))}
                candidatesLoading={isSearchingLists || isSearchingTags}
                initialLinkedIds={activeModalType === 'lists'
                    ? (lists ?? []).map(l => String(l.id))
                    : (appliedTags ?? []).map(t => String(t.id))}
                onAdd={async (id) => {
                    if (activeModalType === 'lists') {
                        await addToList({ listId: parseInt(id), mediaApiRefId: effectiveMediaApiRefId }).unwrap();
                    } else {
                        await addTag({ tagId: parseInt(id), mediaApiRefId: effectiveMediaApiRefId }).unwrap();
                    }
                }}
                onRemove={async (id) => {
                    if (activeModalType === 'lists') {
                        await removeFromList({ listId: parseInt(id), mediaApiRefId: effectiveMediaApiRefId }).unwrap();
                    } else {
                        await removeTag({ tagId: parseInt(id), mediaApiRefId: effectiveMediaApiRefId }).unwrap();
                    }
                }}
                removeConfirmTitle={activeModalType === 'lists' ? 'Remove from list?' : 'Remove tag?'}
                getRemoveConfirmMessage={(item) => `Remove "${item.firstString}"?`}
                onClose={() => setShowLinkModal(false)}
            />
        )}

        </AnimatedPage>
    );
}

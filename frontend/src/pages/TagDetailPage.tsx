import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import {
    useGetCustomTagQuery,
    useGetItemsByTagQuery,
    useFindOrCreateMediaApiRefMutation,
    useAddTagToMediaApiRefMutation,
    useRemoveTagFromMediaApiRefMutation,
    usePatchCustomTagMutation,
    useDeleteCustomTagMutation,
} from '../services/apiSlice';
import { useManageLinkModalSearch } from '../hooks/useManageLinkModalSearch';
import AnimatedPage from '../components/AnimatedPage';
import BackButton from '../components/BackButton';
import RowItemStyling from '../components/row_item_related/RowItemStyling';
import RowItemContent from '../components/row_item_related/RowItemContent';
import MediaTypeLabel from '../components/MediaTypeLabel';
import PaginationControls from '../components/PaginationControls';
import ManageLinkModal from '../components/modals/ManageLinkModal';
import NameAndDescriptionModal from '../components/modals/NameAndDescriptionModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import ItemActionsButton from '../components/row_item_related/ItemActionsButton';
import { routes } from '../utils/routes';
import { mediaApiRefToRowItemProps } from '../utils/mediaApiRefAdapter';
import { makeShareAction, makeGoToDetailsAction, makeRemoveFromTagAction, tagActions } from '../utils/menuActions';

export default function TagDetailPage() {
    const { tagId } = useParams<{ tagId: string }>();
    const navigate = useNavigate();

    const parsedTagId = parseInt(tagId ?? '');

    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    const [page, setPage] = useState(1);
    const [showTagModal, setShowTagModal] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);

    const { data: tagDetail } = useGetCustomTagQuery(parsedTagId, { skip: isNaN(parsedTagId) });
    const tagName = tagDetail?.name ?? `Tag #${parsedTagId}`;

    const { data: result, isLoading, error } = useGetItemsByTagQuery(
        { tagId: parsedTagId, page },
        { skip: isNaN(parsedTagId) }
    );
    const items = result?.items ?? [];

    // Fetch all linked items when the modal is open so that initialLinkedIds covers
    // every page (not just page 1), and onRemove can find items regardless of pagination.
    const { data: allTagItemsResult } = useGetItemsByTagQuery(
        { tagId: parsedTagId, page: 1, pageSize: 9999 },
        { skip: !showTagModal || isNaN(parsedTagId) }
    );
    const allTagItems = allTagItemsResult?.items ?? [];

    const modalSearch = useManageLinkModalSearch('media', showTagModal);
    const [findOrCreate] = useFindOrCreateMediaApiRefMutation();
    const [addTag] = useAddTagToMediaApiRefMutation();
    const [removeTag] = useRemoveTagFromMediaApiRefMutation();
    const [patchTag] = usePatchCustomTagMutation();
    const [deleteTag] = useDeleteCustomTagMutation();

    if (isLoading) return <div>Loading...</div>;
    if (error && !isDeleted) return <div>Error loading tag items. The tag may be private.</div>;

    return (
        <AnimatedPage>
        <div className="page">
            <div className="flex justify-between items-center">
                <BackButton />
                <ItemActionsButton
                    buttonClassName="btn btn-secondary w-10 h-10 flex items-center justify-center"
                    firstString={tagName}
                    secondString={tagDetail?.description ?? undefined}
                    onMenuClick={tagActions({
                        id: parsedTagId,
                        name: tagName,
                        navigate,
                        includeGoToDetails: false,
                        ...(isAuthenticated ? { onTagItemsOpen: () => setShowTagModal(true) } : {}),
                        ...(isAuthenticated ? { onEditOpen: () => setIsEditModalOpen(true) } : {}),
                        ...(isAuthenticated ? { onDeleteOpen: () => setIsDeleteModalOpen(true) } : {}),
                    })}
                />
            </div>

            <h1 className="h1-styling">{tagName}</h1>
            <p className="text-sm text-gray-500 mb-4">
                {result?.totalCount ?? 0} item{result?.totalCount !== 1 ? 's' : ''} with this tag
            </p>

            {items.length > 0 ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {items.map(item => (
                        <RowItemStyling key={item.item.id} onClick={() => navigate(routes.mediaApiRef(item.item.apiSourceName, item.item.externalId))}>
                            <RowItemContent
                                {...mediaApiRefToRowItemProps(item.item, { includeYear: false, secondStringField: 'date' })}
                                labelPill={<MediaTypeLabel mediaTypeId={item.item.mediaTypeId} faded={true} />}
                                onMenuClick={[
                                    makeShareAction(item.item.name, routes.mediaApiRef(item.item.apiSourceName, item.item.externalId)),
                                    makeGoToDetailsAction(navigate, routes.mediaApiRef(item.item.apiSourceName, item.item.externalId)),
                                    ...(isAuthenticated ? [makeRemoveFromTagAction(() => {
                                        removeTag({ tagId: parsedTagId, mediaApiRefId: item.item.id });
                                    })] : []),
                                ]}
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
            {showTagModal && allTagItemsResult !== undefined && (
                <ManageLinkModal
                    modalTitle="Tag Items"
                    allowedSearchTypes={['media']}
                    activeApiSources={modalSearch.activeApiSources}
                    defaultApiSourceId={modalSearch.activeApiSources?.[0]?.id ?? null}
                    {...modalSearch}
                    focusedItem={{ firstString: tagName, secondString: tagDetail?.description ?? undefined }}
                    linkNotes={Object.fromEntries(allTagItems.map(i => [i.item.externalId ?? String(i.item.id), i.tagNote]))}
                    initialLinkedIds={allTagItems.map(i => i.item.externalId ?? String(i.item.id))}
                    noteInput={{ label: 'Reason for tagging (optional)', placeholder: 'Why does this item belong under this tag?' }}
                    onAdd={async (externalId, note) => {
                        const item = modalSearch.mediaSearchResults?.find(r => r.externalId === externalId);
                        if (!modalSearch.currentApiSource || !item) return;
                        // Upsert MediaApiRef, then apply the tag
                        const ref = await findOrCreate({
                            externalApiSourceId: modalSearch.currentApiSource.id,
                            externalId: item.externalId,
                            name: item.name,
                            mediaTypeId: modalSearch.currentApiSource.mediaTypeId,
                            creatorName: item.creatorName,
                            publishedDate: item.publishedDate,
                        }).unwrap();
                        await addTag({ tagId: parsedTagId, mediaApiRefId: ref.id, note }).unwrap();
                    }}
                    onRemove={async (externalId) => {
                        const taggedItem = allTagItems.find(i => i.item.externalId === externalId)
                                        ?? items.find(i => i.item.externalId === externalId);
                        if (taggedItem) {
                            await removeTag({ tagId: parsedTagId, mediaApiRefId: taggedItem.item.id }).unwrap();
                        }
                    }}
                    removeConfirmTitle="Remove tag from item?"
                    getRemoveConfirmMessage={(item) => `Remove tag from "${item.firstString}"?`}
                    onClose={() => setShowTagModal(false)}
                />
            )}

            {/* Edit Tag Modal */}
            {isEditModalOpen && tagDetail && (
                <NameAndDescriptionModal
                    mode="edit"
                    initialName={tagDetail.name}
                    initialDescription={tagDetail.description}
                    initialVisibility={tagDetail.visibilityStatus}
                    onConfirm={async (name, description, visibility) => {
                        try {
                            await patchTag({ tagId: parsedTagId, data: { name, description, visibilityStatus: visibility } }).unwrap();
                        } catch (err) {
                            console.error(err);
                        }
                        setIsEditModalOpen(false);
                    }}
                    onCancel={() => setIsEditModalOpen(false)}
                />
            )}

            {/* Delete Tag Confirm Modal */}
            {isDeleteModalOpen && (
                <ConfirmModal
                    title={`Delete "${tagName}"?`}
                    message="This will permanently delete the tag and remove it from all items."
                    confirmLabel="Delete"
                    onConfirm={async () => {
                        try {
                            await deleteTag(parsedTagId).unwrap();
                            setIsDeleted(true);
                            navigate('/search?type=tags&subtype=mine');
                        } catch (err) {
                            console.error(err);
                        }
                        setIsDeleteModalOpen(false);
                    }}
                    onCancel={() => setIsDeleteModalOpen(false)}
                />
            )}
        </div>
        </AnimatedPage>
    );
}

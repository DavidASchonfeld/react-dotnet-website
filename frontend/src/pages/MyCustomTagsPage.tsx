import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useGetMyCustomTagsQuery,
    useCreateCustomTagMutation,
    usePatchCustomTagMutation,
    useDeleteCustomTagMutation,
} from '../services/apiSlice';
import { VisibilityStatus } from '../types/enums';
import AnimatedPage from '../components/AnimatedPage';
import BackButton from '../components/BackButton';
import ConfirmModal from '../components/modals/ConfirmModal';
import RowItemStyling from '../components/row_item_related/RowItemStyling';
import RowItemContent from '../components/row_item_related/RowItemContent';
import PaginationControls from '../components/PaginationControls';
import { routes } from '../utils/routes';


export default function MyCustomTagsPage() {
    const navigate = useNavigate();

    const [page, setPage] = useState(1);

    const { data: result, isLoading } = useGetMyCustomTagsQuery({ page });
    const tags = result?.items ?? [];
    const [createTag] = useCreateCustomTagMutation();
    const [patchTag] = usePatchCustomTagMutation();
    const [deleteTag] = useDeleteCustomTagMutation();

    const [newTagName, setNewTagName] = useState('');
    const [newTagVisibility, setNewTagVisibility] = useState<VisibilityStatus>(VisibilityStatus.Private);

    const [editingTag, setEditingTag] = useState<{ id: number; name: string } | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: number; name: string } | null>(null);

    async function handleCreate() {
        if (!newTagName.trim()) return;
        await createTag({ name: newTagName.trim(), visibilityStatus: newTagVisibility });
        setNewTagName('');
    }

    return (
        <AnimatedPage>
        <div className="page">
            <BackButton />
            <h1 className="h1-styling">My Custom Tags</h1>
            <p className="text-sm text-gray-500 mb-4">
                Tags let you categorize items across any media type. Private tags are only visible to you; public tags are visible to everyone.
            </p>

            {/* -- Create Tag -- */}
            <div className="flex flex-wrap gap-2 items-end mb-6">
                <input
                    className="input input-bordered"
                    placeholder="New tag name..."
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <select
                    className="select select-bordered"
                    value={newTagVisibility}
                    onChange={e => setNewTagVisibility(Number(e.target.value) as VisibilityStatus)}
                >
                    <option value={VisibilityStatus.Private}>Private</option>
                    <option value={VisibilityStatus.Public}>Public</option>
                </select>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!newTagName.trim()}>
                    Create Tag
                </button>
            </div>

            {/* -- Tag List -- */}
            {isLoading && <div>Loading...</div>}
            {tags && tags.length === 0 && <p className="text-gray-400">No tags yet. Create one above.</p>}
            {tags && tags.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {tags.map(tag => (
                        <RowItemStyling key={tag.id}>
                            {editingTag?.id === tag.id ? (
                                <form
                                    className="flex gap-2 w-full"
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        await patchTag({ tagId: tag.id, data: { name: editingTag.name } });
                                        setEditingTag(null);
                                    }}
                                >
                                    <input
                                        className="input input-bordered flex-1"
                                        value={editingTag.name}
                                        onChange={e => setEditingTag({ ...editingTag, name: e.target.value })}
                                        autoFocus
                                    />
                                    <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingTag(null)}>Cancel</button>
                                </form>
                            ) : (
                                <div className="flex items-center justify-between w-full">
                                    <RowItemContent
                                        firstString={tag.name}
                                        secondString={tag.visibilityStatus === VisibilityStatus.Public ? 'Public' : 'Private'}
                                        onClick={() => navigate(routes.tagItems(tag.id), { state: { tagName: tag.name } })}
                                    />
                                    <div className="flex gap-2 shrink-0 ml-2">
                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingTag({ id: tag.id, name: tag.name })}>Edit</button>
                                        <button className="btn btn-error btn-sm" onClick={() => setConfirmDeleteId({ id: tag.id, name: tag.name })}>Delete</button>
                                    </div>
                                </div>
                            )}
                        </RowItemStyling>
                    ))}
                </div>
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

            {confirmDeleteId && (
                <ConfirmModal
                    title={`Delete tag "${confirmDeleteId.name}"?`}
                    message="This will remove the tag from all items it has been applied to."
                    confirmLabel="Delete"
                    onConfirm={async () => {
                        await deleteTag(confirmDeleteId.id);
                        setConfirmDeleteId(null);
                    }}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
        </AnimatedPage>
    );
}

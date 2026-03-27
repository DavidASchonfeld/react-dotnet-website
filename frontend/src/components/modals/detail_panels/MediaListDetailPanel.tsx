import { useGetMediaListDetailQuery } from '../../../services/apiSlice';
import { routes } from '../../../utils/routes';
import ListCollageThumb from '../../ListCollageThumb';

interface MediaListDetailPanelProps {
    id: string; // stringified numeric list ID
}

// Max items shown inline before the "view full details" link
const PREVIEW_ITEM_LIMIT = 5;

export default function MediaListDetailPanel({ id }: MediaListDetailPanelProps) {
    const numericId = parseInt(id);
    const { data: list, isLoading } = useGetMediaListDetailQuery(numericId, { skip: isNaN(numericId) });

    if (isLoading) return <div className="p-4 opacity-50 text-sm">Loading…</div>;
    if (!list) return <div className="p-4 opacity-50 text-sm">List not found.</div>;

    const previewItems = list.listContent.slice(0, PREVIEW_ITEM_LIMIT);
    const remaining = list.listContent.length - previewItems.length;
    const thumbUrls = list.listContent
        .map(item => item.thumbnailUrl)
        .filter((u): u is string => !!u)
        .slice(0, 4);

    return (
        <div className="p-4 flex flex-col gap-3 items-center text-center">
            {/* Collage thumbnail */}
            <ListCollageThumb urls={thumbUrls} />

            {/* List name */}
            <h3 className="font-semibold text-base leading-snug">{list.name}</h3>

            {/* Description — only shown when present */}
            {list.description && (
                <p className="text-sm text-text-muted">{list.description}</p>
            )}

            {/* Item count */}
            <p className="text-xs text-text-muted">
                {list.listContent.length} item{list.listContent.length !== 1 ? 's' : ''}
            </p>

            {/* Preview of first few items */}
            {previewItems.length > 0 && (
                <ul className="flex flex-col gap-1 w-full text-left">
                    {previewItems.map(item => (
                        <li key={item.id} className="text-sm truncate text-text-muted">
                            • {item.name}
                        </li>
                    ))}
                    {/* Overflow indicator */}
                    {remaining > 0 && (
                        <li className="text-xs text-text-muted opacity-60">
                            +{remaining} more…
                        </li>
                    )}
                </ul>
            )}

            {/* Link to full list detail page */}
            <a
                href={routes.mediaList(numericId)}
                className="text-sm text-primary underline mt-auto mx-auto"
                target="_blank"
                rel="noreferrer"
            >
                View full details →
            </a>
        </div>
    );
}

import { useGetCustomTagQuery } from '../../../services/apiSlice';
import { VisibilityStatus } from '../../../types/enums';
import { routes } from '../../../utils/routes';

interface TagDetailPanelProps {
    id: string; // stringified numeric tag ID
    linkNote?: string | null;
}

// Maps visibility enum to a readable label
function visibilityLabel(v: VisibilityStatus) {
    if (v === VisibilityStatus.Public) return 'Public';
    if (v === VisibilityStatus.Shared) return 'Shared';
    return 'Private';
}

export default function TagDetailPanel({ id, linkNote }: TagDetailPanelProps) {
    const numericId = parseInt(id);
    const { data: tag, isLoading } = useGetCustomTagQuery(numericId, { skip: isNaN(numericId) });

    if (isLoading) return <div className="p-4 opacity-50 text-sm">Loading…</div>;
    if (!tag) return <div className="p-4 opacity-50 text-sm">Tag not found.</div>;

    return (
        <div className="p-4 flex flex-col gap-3 items-center text-center">
            {/* Tag name */}
            <h3 className="font-semibold text-base leading-snug">{tag.name}</h3>

            {/* Description — only shown when present */}
            {tag.description && (
                <p className="text-sm text-text-muted">{tag.description}</p>
            )}

            {/* Visibility badge */}
            <span className="text-xs px-2 py-0.5 rounded-full bg-border text-text-muted w-fit mx-auto">
                {visibilityLabel(tag.visibilityStatus)}
            </span>

            {/* Per-link note from the join table — only shown when present */}
            {linkNote && (
                <div className="w-full text-left border border-border rounded px-3 py-2 bg-surface">
                    <p className="text-xs text-text-muted mb-1">Note</p>
                    <p className="text-sm text-text">{linkNote}</p>
                </div>
            )}

            {/* Link to full tag detail page */}
            <a
                href={routes.tag(numericId)}
                className="text-sm text-primary underline mt-auto mx-auto"
                target="_blank"
                rel="noreferrer"
            >
                View full details →
            </a>
        </div>
    );
}

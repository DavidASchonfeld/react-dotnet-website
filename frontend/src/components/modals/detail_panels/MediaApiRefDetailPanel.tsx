import { routes } from '../../../utils/routes';

interface MediaApiRefDetailPanelProps {
    id: string;           // externalId (e.g. "tt1234567")
    apiSourceName: string;
    name: string;
    secondString?: string; // creator name
    thumbnail?: string;
    linkNote?: string | null;
}

// Shows candidate data already in memory — avoids an API call that would toast-error
// for items not yet saved to the DB (new external search results).
export default function MediaApiRefDetailPanel({
    id,
    apiSourceName,
    name,
    secondString,
    thumbnail,
    linkNote,
}: MediaApiRefDetailPanelProps) {
    return (
        <div className="p-4 flex flex-col gap-3 items-center text-center">
            {/* Thumbnail — only shown when available */}
            {thumbnail && (
                <img
                    src={thumbnail}
                    alt={name}
                    className="w-24 h-auto rounded object-cover mx-auto"
                />
            )}

            {/* Item title */}
            <h3 className="font-semibold text-base leading-snug">{name}</h3>

            {/* Creator / date line */}
            {secondString && (
                <p className="text-sm text-text-muted">{secondString}</p>
            )}

            {/* API source / ID */}
            <button className="btn btn-secondary w-fit">
                Data Source: {apiSourceName} · ID: {id}
            </button>

            {/* Per-link note from the join table — only shown when present */}
            {linkNote && (
                <div className="w-full text-left border border-border rounded px-3 py-2 bg-surface">
                    <p className="text-xs text-text-muted mb-1">Note</p>
                    <p className="text-sm text-text">{linkNote}</p>
                </div>
            )}

            {/* Link to the full MediaApiRef detail page */}
            <a
                href={routes.mediaApiRef(apiSourceName, id)}
                className="text-sm text-primary underline mt-auto mx-auto"
                target="_blank"
                rel="noreferrer"
            >
                View full details →
            </a>
        </div>
    );
}

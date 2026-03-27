import TagDetailPanel from './TagDetailPanel';
import MediaApiRefDetailPanel from './MediaApiRefDetailPanel';
import MediaListDetailPanel from './MediaListDetailPanel';

export type DetailItemType = 'tag' | 'mediaApiRef' | 'mediaList';

// Shape of the currently-open detail item, stored in ManageLinkModal state
export interface ActiveDetail {
    type: DetailItemType;
    id: string;
    apiSourceName?: string; // mediaApiRef only
    name: string;           // summary data for the panel header
    secondString?: string;
    thumbnail?: string;
    linkNote?: string | null; // note from the join table between this item and the focused item
}

interface DetailSidePanelProps {
    detail: ActiveDetail;
    onClose: () => void;
    // When true, panel takes full width — used on mobile where 50/50 split is too narrow
    fullWidth?: boolean;
}

// Wraps the three sub-panels with a shared header and close button
export default function DetailSidePanel({ detail, onClose, fullWidth = false }: DetailSidePanelProps) {
    // Panel title is derived from the item type
    const panelTitle =
        detail.type === 'tag' ? 'Tag Details'
        : detail.type === 'mediaList' ? 'List Details'
        : 'Item Details';

    return (
        // fullWidth overrides the default w-1/2 side-panel layout for mobile viewports
        <div className={`flex flex-col overflow-hidden ${fullWidth ? 'w-full' : 'w-1/2 border-l border-border'}`}>
            {/* Panel header with title and close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="flex-1 text-sm font-semibold text-text-muted text-center">{panelTitle}</span>
                <button
                    className="btn btn-secondary w-fit text-xs"
                    onClick={onClose}
                    aria-label="Close detail panel"
                >
                    ✕
                </button>
            </div>

            {/* Scrollable panel body */}
            <div className="flex-1 overflow-y-auto">
                {detail.type === 'tag' && (
                    <TagDetailPanel id={detail.id} linkNote={detail.linkNote} />
                )}
                {detail.type === 'mediaApiRef' && (
                    <MediaApiRefDetailPanel
                        id={detail.id}
                        apiSourceName={detail.apiSourceName ?? ''}
                        name={detail.name}
                        secondString={detail.secondString}
                        thumbnail={detail.thumbnail}
                        linkNote={detail.linkNote}
                    />
                )}
                {detail.type === 'mediaList' && (
                    <MediaListDetailPanel id={detail.id} />
                )}
            </div>
        </div>
    );
}

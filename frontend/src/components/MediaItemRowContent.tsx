import type { MediaItemSummary } from '../types/mediaItem';
import MediaTypeLabel from './MediaTypeLabel';

interface Props {
    item: MediaItemSummary;
    // Future: imageUrl?: string;
    // Future: actionButton?: React.ReactNode;
}

// The shared core display content for a media item row.
// Layout: [Placeholder Photo] | [flex-col: [name + type icon] / [explicit symbol + creators]]
// Used by both SwipeableRow and StaticRow in SortableMediaItem.
export default function MediaItemRowContent({ item }: Props) {

    return (
        <div className="flex flex-row items-center gap-3 w-full min-w-0">

            {/* Placeholder Photograph — fixed size box; replace with <img> when imageUrl is available */}
            <div className="shrink-0 w-10 h-10 aspect-square bg-slate-200 rounded" />

            {/* Two rows stacked */}
            <div className="flex flex-col flex-1 min-w-0">

                {/* Top Row: item name (truncated) + media type icon pinned to the right
                    truncate: If this text-filled item becomes too squished horizontally, the non-cut off text ends with "..."
                */}
                <div className="flex items-center gap-1 min-w-0">

                    {/*
                        Tailwind:
                        flex VS flex-1:
                        -- flex    : in CSS, sets "display: flex", making that object
                                       a flex container for its children.
                                       This affects notihng about how this item itself
                                       will grow or shrink within its own parent
                        -- flex-1  : about how an item behaves inside a flex container
                                     In CSS, sets "flex: 1 1 0%" which means:
                                      -- CSS: "flex-grow: 1"  : it grows to fill available space
                                      -- CSS: "flex-shrink: 1": it shrinks when space it tight
                                      -- CSS: "flex-basis: 0%": it starts from a base size of 0
                                                  rather than its natural content size.
                    */}
                    <span className="truncate text-sm font-medium flex-1 text-left">{item.name}</span>
                    <MediaTypeLabel mediaTypeId={item.mediaTypeId} faded ={true}/>
                </div>

                {/* Bottom Row: optional explicit symbol + creators (truncated) */}
                <div className="flex items-center gap-1 min-w-0 text-xs text-slate-500">
                    {/* TODO: show explicit symbol (e.g. 🅴) when item.isExplicit is true */}
                    <span className="truncate text-left">TODO: Add Creators</span>
                </div>

            </div>

        </div>
    );
}

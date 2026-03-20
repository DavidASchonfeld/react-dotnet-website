import type { ReactNode } from 'react';

interface Props {
    firstString: string;
    secondString?: string;
    thirdString?: string;
    larger?: boolean;
    photographOnLeft?: string;  // image URL; placeholder shown if omitted
    emojiIcon?: ReactNode;
}

// Generic row content for any named object.
// Layout: [Photo or placeholder] | [flex-col: [firstString + emojiIcon] / [secondString] / [thirdString (larger only)]]
// Used by both SwipeableRow and StaticRow in SortableMediaItem, and other pages/modals.
export default function MediaItemRowContent({ firstString, secondString, thirdString, larger, photographOnLeft, emojiIcon }: Props) {

    return (
        <div className={`flex flex-row items-center gap-3 w-full min-w-0 ${larger ? 'py-1' : ''}`}>

            {/* Photograph — fixed size; replace placeholder with <img> when URL is available */}
            <div className={`shrink-0 aspect-square bg-border rounded ${larger ? 'w-12 h-12' : 'w-10 h-10'}`}>
                {photographOnLeft && (
                    <img src={photographOnLeft} alt="" className="w-full h-full object-cover rounded" />
                )}
            </div>

            {/* Rows stacked */}
            <div className="flex flex-col flex-1 min-w-0">

                {/* Top Row: main name (truncated) + optional icon pinned to the right
                    truncate: If this text-filled item becomes too squished horizontally, the non-cut off text ends with "..."
                */}
                <div className="flex items-center gap-1 min-w-0">

                    {/*
                        Tailwind:
                        flex VS flex-1:
                        -- flex    : in CSS, sets "display: flex", making that object
                                       a flex container for its children.
                                       This affects nothing about how this item itself
                                       will grow or shrink within its own parent
                        -- flex-1  : about how an item behaves inside a flex container
                                     In CSS, sets "flex: 1 1 0%" which means:
                                      -- CSS: "flex-grow: 1"  : it grows to fill available space
                                      -- CSS: "flex-shrink: 1": it shrinks when space is tight
                                      -- CSS: "flex-basis: 0%": it starts from a base size of 0
                                                  rather than its natural content size.
                    */}
                    <span className="truncate text-base font-medium flex-1 text-left text-text">{firstString}</span>
                    {emojiIcon}
                </div>

                {/* Second Row: optional secondary string (e.g. content rating + creators) */}
                {secondString && (
                    <div className="flex items-center gap-1 min-w-0 text-xs text-text/90">
                        <span className="truncate text-left">{secondString}</span>
                    </div>
                )}

                {/* Third Row: only rendered in larger mode */}
                {larger && thirdString && (
                    <div className="flex items-center gap-1 min-w-0 text-xs text-text/90">
                        <span className="truncate text-left">{thirdString}</span>
                    </div>
                )}

            </div>

        </div>
    );
}

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
// Used as the children of SwipeReorderRowItem (swipe + drag) and RowItem (visual styling only), and other pages/modals.
export default function RowItemContent({ firstString, secondString, thirdString, larger, photographOnLeft, emojiIcon }: Props) {

    return (
        <div className="flex flex-row items-stretch gap-3 w-full min-w-0">

            {/* Photograph — fixed size; replace placeholder with <img> when URL is available.
                larger mode: self-stretch + fixed width lets the image fill the card height flush (no fixed height needed).
                             Parent must use items-stretch for this to work. */}
            <div className={`shrink-0 bg-border flex items-center justify-center overflow-hidden
                ${larger
                    ? 'self-stretch aspect-square'
                    : 'rounded aspect-square w-10 h-10 p-1'
                }`}>
                {photographOnLeft && (
                    <img src={photographOnLeft} alt="" className="w-full h-full object-cover" />
                )}
            </div>

            {/* Rows stacked */}
            <div className={`flex flex-col flex-1 min-w-0  ${larger ? 'gap-1' : ''}`}>

                {/* Top Row: main name (truncated) + optional icon pinned to the right
                    truncate: If this text-filled item becomes too squished horizontally, the non-cut off text ends with "..."
                    items-start (not items-center): top-aligns the title and emojiIcon so the title text starts
                    flush with py-2, giving equal 8px padding above title and below the last text row.
                    (items-center would add 2px of extra space above the title when emojiIcon is taller than text.)
                */}
                <div className="flex items-start gap-1 min-w-0">

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
                    <span className="truncate text-[15px] font-medium flex-1 text-left text-text leading-tight">{firstString}</span>
                    {emojiIcon}
                </div>

                {/* Second Row: optional secondary string (e.g. content rating + creators) */}
                {secondString && (
                    <div className={`flex items-center gap-1 min-w-0 text-[11.5px] text-text/90 leading-tight${larger ? '' : ' -mt-1.5'}`}>
                        <span className="truncate text-left">{secondString}</span>
                    </div>
                )}

                {/* Third Row: only rendered in larger mode */}
                {larger && thirdString && (
                    <div className="flex items-center gap-1 min-w-0 text-[11.5px] text-text/90 leading-tight">
                        <span className="truncate text-left">{thirdString}</span>
                    </div>
                )}

            </div>

        </div>
    );
}

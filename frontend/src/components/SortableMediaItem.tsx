import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSwipeable } from 'react-swipeable';
import MediaItemRowContent from './MediaItemRowContent';
import type { MediaItemSummary } from '../types/mediaItem';

interface Props {
    item: MediaItemSummary;
    isEditMode: boolean;
    dragDisabled?: boolean;
    swipeDisabled?: boolean;
    onRequestDelete: (item: { id: number; name: string }) => void;
}

const REVEAL_THRESHOLD = 60; // px of swipe before buttons snap open


// Inner component that calls useSwipeable (always called — rules of hooks)
interface RowProps {
    item: MediaItemSummary;
    isEditMode: boolean;
    dragDisabled: boolean;
    sortable: ReturnType<typeof useSortable>;

    // Need these specifically because ConfirmModal.tsx needs those.
    onRequestDelete: (item: { id: number; name: string }) => void;
}


export default function SortableMediaItem({
    item,
    isEditMode,
    dragDisabled = false,
    swipeDisabled = false,
    onRequestDelete,
}: Props) {
    // useSortable must always be called (rules of hooks).
    // When dragDisabled, we simply don't attach its ref/listeners/attributes.
    const sortable = useSortable({ id: item.id });

    if (swipeDisabled) {
        return (
            <StaticRow
                item={item}
                isEditMode={isEditMode}
                dragDisabled={dragDisabled}
                sortable={sortable}
                onRequestDelete={onRequestDelete}
            />
        );
    }

    return (
        <SwipeableRow
            item={item}
            isEditMode={isEditMode}
            dragDisabled={dragDisabled}
            sortable={sortable}
            onRequestDelete={onRequestDelete}
        />
    );
}


function SwipeableRow({ item, isEditMode, dragDisabled, sortable, onRequestDelete }: RowProps) {
    const navigate = useNavigate();
    const [swipeOffset, setSwipeOffset] = useState(0);

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = sortable;
    const style = dragDisabled
        ?
        // When dragDisabled = true, do not enable animations related to drag-and-drop
        {}
        : {
              // When doing drag-and-drop, this visually moves the object
              transform: CSS.Transform.toString(transform),

              // This plays the "snap to place" animation on drop
              transition: transition ?? undefined,

              // Makes the item semi-transparent when being dragged
              opacity: isDragging ? 0.5 : 1,
          };

    const swipeHandlers = useSwipeable({

        // These do not need to be disposed since
        // they are JavaScript props that React manages and disposes as needed
        // dir guard: ignore vertical drags (e.g. from the ⠿ drag handle) so they
        // don't accidentally nudge the swipe offset
        onSwiping: ({ deltaX, dir }) => { if (dir === 'Left' || dir === 'Right') setSwipeOffset(deltaX); },
        onSwipedLeft: ({ absX }) => setSwipeOffset(absX > REVEAL_THRESHOLD ? -80 : 0),
        onSwipedRight: ({ absX }) => setSwipeOffset(absX > REVEAL_THRESHOLD ? 80 : 0),
        trackMouse: true,  // So this swiping will also work on a computer/laptop
        preventScrollOnSwipe: true,
    });

    return (
        <div

            // ref is how @dnd-kit/sortable is able to see/sense the click on this specific HTML object.
            ref={dragDisabled ? undefined : setNodeRef}
            style={style}

            // Tailwind
            // overflow-hidden: clips the absolute-positioned Details/Delete buttons so they stay
            //     hidden until the row is swiped to reveal them.
            className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700"
        >
            {/* Left action — revealed by swipe right */}
            <div className="absolute left-0 top-0 h-full flex items-center px-3 bg-blue-600 text-white z-0">
                <button
                    onClick={() => navigate(`/mediaitem/${item.id}`)}
                    className="text-sm font-medium"
                >
                    Details
                </button>
            </div>

            {/* Right action — revealed by swipe left */}
            <div className="absolute right-0 top-0 h-full flex items-center px-3 bg-red-600 text-white z-0">
                <button
                    onClick={() => onRequestDelete({ id: item.id, name: item.name })}
                    className="text-sm font-medium"
                >
                    Delete
                </button>
            </div>

            {/* Item row — slides with swipe offset */}
            <div
                // The "..." spread operator unwraps the swipeHandlers JavaScript object
                // and passes all its properties (e.g. onTouchStart, onMouseDown) as JSX props to this div.
                {...swipeHandlers}
                style={{ transform: `translateX(${swipeOffset}px)`, transition: 'transform 0.15s ease' }}

                // select-none: prevents text-highlight when the user click-drags horizontally, so react-swipeable will work.
                className="relative z-10 bg-white dark:bg-gray-800 flex items-center gap-2 p-3 select-none"
            >
                {isEditMode && !dragDisabled && (
                    <span
                        // Here, I am unwrapping attributes and listeners
                        // imported from @dnd-kit and this is needed
                        // to make this list item able to be
                        // drag-and-drop-able.
                        // attributes: needed for keyboard navigation/screen reader input
                        // listeners: for pointer/keyboard 
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-gray-400 select-none text-lg"
                        title="Drag to reorder"
                    >
                        ⠿
                    </span>
                )}
                <MediaItemRowContent item={item} />
            </div>
        </div>
    );
}


function StaticRow({ item, isEditMode, dragDisabled, sortable, onRequestDelete }: RowProps) {
    const navigate = useNavigate();

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = sortable;

    // "Rule of Hooks": means the React.js requires you
    // to always call all hooks mentioned in the file unconditonally.
    // meaning that NO if statements/returning early etc.
    // should ever prevent the web hooks in the file from ever being called.
    // This method (StaticRow) which is called by (SortableMediaItem)
    // has no relation to the webhook directly. 
    // This method's caller (SortableMediaItem) already called the hook,
    // as React.js requires.
    // Here, in this method, if dragDisabled == true,
    // then this method would not pull from the hook's
    // potentially error-throwing contents (which as passed into this method
    // via the object "sortable")

    const style = dragDisabled
        ? {}
        : {
              transform: CSS.Transform.toString(transform),
              transition: transition ?? undefined,
              opacity: isDragging ? 0.5 : 1,
          };

    return (
        <div
            ref={dragDisabled ? undefined : setNodeRef}
            style={style}
            className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        >
            {/* Always-visible Details button */}
            <button
                onClick={() => navigate(`/mediaitem/${item.id}`)}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium shrink-0"
            >
                Details
            </button>

            {isEditMode && !dragDisabled && (
                <span
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-gray-400 select-none text-lg"
                    title="Drag to reorder"
                >
                    ⠿
                </span>
            )}

            <MediaItemRowContent item={item} />

            {/* Always-visible Delete button */}
            <button
                onClick={() => onRequestDelete({ id: item.id, name: item.name })}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium shrink-0"
            >
                Delete
            </button>
        </div>
    );
}

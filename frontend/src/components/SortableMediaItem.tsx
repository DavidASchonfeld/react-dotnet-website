import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSwipeable } from 'react-swipeable';
import MediaItemRowContent from './MediaItemRowContent';
import MediaTypeLabel from './MediaTypeLabel';
import type { MediaItemSummary } from '../types/mediaItem';
import { AMOUNT_TO_SWIPE_HORIZONTALLY_TO_ACTIVATE_TRIGGER } from "../constants";

interface Props {
    item: MediaItemSummary;
    isEditMode: boolean;
    dragDisabled?: boolean;
    swipeDisabled?: boolean;
    onRequestDelete: (item: { id: number; name: string }) => void;
    onRequestOptions?: (item: MediaItemSummary) => void;
}

// Swipe must travel this many px to trigger an action; shorter swipes snap back.
// absX from react-swipeable is CSS pixels — same unit on desktop and phone.
const horizontalSwipeAmountThreshold = AMOUNT_TO_SWIPE_HORIZONTALLY_TO_ACTIVATE_TRIGGER;


// Inner component that calls useSwipeable (always called — rules of hooks)
interface RowProps {
    item: MediaItemSummary;
    isEditMode: boolean;
    dragDisabled: boolean;
    sortable: ReturnType<typeof useSortable>;

    // Need these specifically because ConfirmModal.tsx needs those.
    onRequestDelete: (item: { id: number; name: string }) => void;
    onRequestOptions?: (item: MediaItemSummary) => void;
}


export default function SortableMediaItem({
    item,
    isEditMode,
    dragDisabled = false,
    swipeDisabled = false,
    onRequestDelete,
    onRequestOptions,
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
                onRequestOptions={onRequestOptions}
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
            onRequestOptions={onRequestOptions}
        />
    );
}


function SwipeableRow({ item, isEditMode, dragDisabled, sortable, onRequestDelete, onRequestOptions }: RowProps) {

    


    const navigate = useNavigate();
    const [horizontalSwipeOffset, setHorizontalSwipeOffset] = useState(0);
    
    // isSwiping: true while the finger/mouse is actively moving.
    // Used to disable the CSS transition during the drag so the row
    // tracks the pointer without lag (the stutter), then re-enables
    // it for the smooth snap-back animation once the gesture ends.
    const [isSwiping, setIsSwiping] = useState(false);

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

        // Details about how Swiping Works:
        // There are 3 layers:
        // -- Layer z-[1] or z-0: Blue "Details" background div
        // -- Layer z-[1] or z-0: Red "Remove" background div
        // -- Layer z-10: The MediaItem row on top.
        //      It's on top because the "10" in z-10
        //      is bigger than the other layers' z-values.
        // SNAP_THRESHOLD: When swiping left/right,
        //    you must swipe at least this variable's amount
        //    in order for this code to consider the item "swiped"
        //    That's what the onSwipedLeft and
        //    onSwipedRight objects handel below.
        // When swipeOff
        //  onSwiped() occurs no matter how far you swiped.
        //    Here in swipeHandlers, it only is about setting
        //    isSwiping back to false, and setting 
        //    the horizontalSwipeOffset variable back to 0. 





        // These objects in swipeHandles do not need to be disposed since
        // they are JavaScript props that React manages and disposes as needed

        onSwipeStart: () => setIsSwiping(true),

        // dir guard: ignore vertical drags (e.g. from the ⠿ drag handle) so they
        // don't accidentally nudge the swipe offset (aka so you the drag-to-re-order doesn't affect the left/right swiping)
        onSwiping: ({ deltaX, dir }) => { if (dir === 'Left' || dir === 'Right') setHorizontalSwipeOffset(deltaX); },

        // Direction-specific handlers only trigger the action if the swipe
        // travelled past SNAP_THRESHOLD. onSwiped (below) handles cleanup for all cases.
        onSwipedLeft:  ({ absX }) => { if (absX > horizontalSwipeAmountThreshold) onRequestDelete({ id: item.id, name: item.name }); },
        onSwipedRight: ({ absX }) => { if (absX > horizontalSwipeAmountThreshold) navigate(`/mediaitem/${item.id}`); },

        // Fires after every swipe (Left, Right, Up, Down) — snaps the row back
        // and marks the gesture as done so the CSS transition re-enables.
        onSwiped: () => { setIsSwiping(false); setHorizontalSwipeOffset(0); },

        trackMouse: true,  // So this swiping will also work on a computer/laptop
        preventScrollOnSwipe: true,
    });

    return (
        <div
            // ref is how @dnd-kit/sortable is able to see/sense the click on this specific HTML object.
            ref={dragDisabled ? undefined : setNodeRef}
            style={style}

            // Tailwind
            // overflow-hidden: clips the colored background labels so they stay
            //     hidden until the row is swiped to reveal them.
            className="relative overflow-hidden border-b border-border"
        >
            {/* Details background — revealed by swiping right.
            Both backgrounds are full-width and centered so the label appears
            in the middle of the row. z-index swaps based on swipe direction
            so only the relevant color shows.
            
            Tailwind:
            -- absolute int-0: means the div fills the entire row 100% behind the <MediaItemRowContent>
            
            */}
            {/*
                How Swiping works with the Z-Value for the Divs behind the ItemRow
                
                z-0 is in the back
                z-[1] is in front (but still behind the MediaItemRowContent's parent div
                since that parent div has z-10.)
                ${horizontalSwipeOffset >= 0 ? 'z-[1]' : 'z-0'} means that
                if horizontalSwipeOffset >= 0 (aka you are swiping rightward with your finger/mouse),
                then put this div at z-[1] (and the other div's logic has it go to the back (Aka to z-0)).
                That way, whenever I swipe right and move the ItemRow div out of the way,
                this div is on top of the other of the div
                The same logic applies for the other div, since it becomes z-[1]
                when horizontalSwipeOffset < 0, which is when you are swiping left
            */}
            {/* Detail background - Revealed by Swiping Right*/}
            <div className={
                `absolute inset-0 flex items-center justify-center bg-blue-600 text-white text-lg font-medium
                ${horizontalSwipeOffset >= 0 ? 'z-[1]' : 'z-0'}
                `}>
                📑 Details
            </div>

            {/* Delete Background — Revealed by Swiping Left */}
            <div className={
                `absolute inset-0 flex items-center justify-center bg-red-600 text-white text-lg font-medium
                ${horizontalSwipeOffset < 0 ? 'z-[1]' : 'z-0'}
                `}>
                🗑 Delete
            </div>

            {/* Item row — slides with swipe offset */}
            <div
                // The "..." spread operator unwraps the swipeHandlers JavaScript object
                // and passes all its properties (e.g. onTouchStart, onMouseDown) as JSX props to this div.
                {...swipeHandlers}
                style={{

                    // The first line is about moving the row left/right based on the horizontalSwipeOffset\
                    // and if the user is not swiping at the moment,
                    // move the row at a "0.2s ease" speed back to its original position

                    transform: `translateX(${horizontalSwipeOffset}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.2s ease',
                }}
                // select-none: prevents text-highlight when the user click-drags horizontally
                className="relative z-10 bg-surface flex items-center gap-2 p-3 select-none hover:bg-surface-raised active:bg-border transition-colors"
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
                <MediaItemRowContent
                    firstString={item.name}
                    emojiIcon={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
                />
                {/* More Options button
                     -- stopPropagation on mousedown prevents the
                        swipe handler (which also listens to mousedown)
                        from treating this button
                        click as the start of a swipe gesture. */}
                <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => onRequestOptions?.(item)}
                    
                    // Tailwind:
                    //  -- ml-auto: pushes button to the far right end of the "flex row" (which is located )
                    //  -- shrink-0: Even if this object (in this case, this button) is compressed, do not strink this object
                    //  -- leading-none: sets "line-height" to 1, which means that line-height = 1x the font size.
                    //         (The default would be 1.5x)

                    className="ml-auto shrink-0 px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent text-lg leading-none"
                    title="More options"
                >
                    ···
                </button>
            </div>
        </div>
    );
}


function StaticRow({ item, isEditMode, dragDisabled, sortable, onRequestDelete, onRequestOptions }: RowProps) {
    const navigate = useNavigate();

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = sortable;

    // "Rule of Hooks": React requires you to always call all hooks unconditionally.
    // No if-statements, early returns, or conditions should ever prevent a hook
    // from being called on every render.
    // StaticRow (this function) does NOT call any hooks directly.
    // Its caller, SortableMediaItem, already called useSortable() unconditionally.
    // Here in StaticRow, if dragDisabled === true, we simply don't USE the hook's
    // potentially-error-throwing data (passed in via the `sortable` parameter).
    // This satisfies Rule of Hooks while safely ignoring potentially error-prone data when not needed.

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
            className="flex items-center gap-2 p-3 bg-surface border-b border-border hover:bg-surface-raised active:bg-border transition-colors"
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

            <MediaItemRowContent
                    firstString={item.name}
                    secondString={'TODO: ADD CREATORS'}
                    emojiIcon={<MediaTypeLabel mediaTypeId={item.mediaTypeId} faded={true} />}
                />

            {/* Always-visible Delete button */}
            <button
                onClick={() => onRequestDelete({ id: item.id, name: item.name })}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium shrink-0"
            >
                Delete
            </button>

            <button
                onClick={() => onRequestOptions?.(item)}
                className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent text-lg leading-none shrink-0"
                title="More options"
            >
                ···
            </button>
        </div>
    );
}

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSwipeable } from 'react-swipeable';
import RowItemStyling from './RowItemStyling';
import { AMOUNT_TO_SWIPE_HORIZONTALLY_TO_ACTIVATE_TRIGGER } from "../constants";

// Describes one swipe action: the label shown behind the sliding row and the callback to fire.
// The same label is used in SwipeableRow (as a large background text) and StaticRow (as a button).
interface SwipeAction {
    label: string;
    onPress: () => void;
}

interface Props {
    id: number;                         // used by @dnd-kit/sortable to identify this row in a list
    isEditMode: boolean;
    dragDisabled?: boolean;
    swipeDisabled?: boolean;
    swipeLeftAction?: SwipeAction;      // fires on a left swipe  (shown in red)
    swipeRightAction?: SwipeAction;     // fires on a right swipe (shown in blue)
    onOptionsPress?: () => void;        // ··· button callback
    children: ReactNode;               // the row content (e.g. <RowItemContent .../>)
}

// Swipe must travel this many px to trigger an action; shorter swipes snap back.
// absX from react-swipeable is CSS pixels — same unit on desktop and phone.
const horizontalSwipeAmountThreshold = AMOUNT_TO_SWIPE_HORIZONTALLY_TO_ACTIVATE_TRIGGER;


// Inner component interface shared by SwipeableRow and StaticRow
interface RowProps {
    id: number;
    isEditMode: boolean;
    dragDisabled: boolean;
    sortable: ReturnType<typeof useSortable>;
    swipeLeftAction?: SwipeAction;
    swipeRightAction?: SwipeAction;
    onOptionsPress?: () => void;
    children: ReactNode;
}


export default function SwipeReorderRowItem({
    id,
    isEditMode,
    dragDisabled = false,
    swipeDisabled = false,
    swipeLeftAction,
    swipeRightAction,
    onOptionsPress,
    children,
}: Props) {
    // useSortable must always be called (rules of hooks).
    // When dragDisabled, we simply don't attach its ref/listeners/attributes.
    const sortable = useSortable({ id });

    if (swipeDisabled) {
        return (
            <StaticRow
                id={id}
                isEditMode={isEditMode}
                dragDisabled={dragDisabled}
                sortable={sortable}
                swipeLeftAction={swipeLeftAction}
                swipeRightAction={swipeRightAction}
                onOptionsPress={onOptionsPress}
            >
                {children}
            </StaticRow>
        );
    }

    return (
        <SwipeableRow
            id={id}
            isEditMode={isEditMode}
            dragDisabled={dragDisabled}
            sortable={sortable}
            swipeLeftAction={swipeLeftAction}
            swipeRightAction={swipeRightAction}
            onOptionsPress={onOptionsPress}
        >
            {children}
        </SwipeableRow>
    );
}


function SwipeableRow({ isEditMode, dragDisabled, sortable, swipeLeftAction, swipeRightAction, onOptionsPress, children }: RowProps) {

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
        // -- Layer z-[1] or z-0: Right-action (swipeRightAction) background div
        // -- Layer z-[1] or z-0: Left-action  (swipeLeftAction)  background div
        // -- Layer z-10: The row content on top.
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
        onSwipedLeft:  ({ absX }) => { if (absX > horizontalSwipeAmountThreshold) swipeLeftAction?.onPress(); },
        onSwipedRight: ({ absX }) => { if (absX > horizontalSwipeAmountThreshold) swipeRightAction?.onPress(); },

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
            className="row-item-swipe"
        >
            {/*
                How Swiping works with the Z-Value for the Divs behind the row

                z-0 is in the back
                z-[1] is in front (but still behind the row content div
                since that div has z-10.)
                ${horizontalSwipeOffset >= 0 ? 'z-[1]' : 'z-0'} means that
                if horizontalSwipeOffset >= 0 (aka you are swiping rightward with your finger/mouse),
                then put this div at z-[1] (and the other div's logic has it go to the back (Aka to z-0)).
                That way, whenever I swipe right and move the row content div out of the way,
                this div is on top of the other of the div
                The same logic applies for the other div, since it becomes z-[1]
                when horizontalSwipeOffset < 0, which is when you are swiping left
            */}
            {/* Right-action background — revealed by swiping right (blue; e.g. Details/navigation) */}
            {swipeRightAction && (
                <div className={`row-item-swipe-reveal-left ${horizontalSwipeOffset >= 0 ? 'z-[1]' : 'z-0'}`}>
                    {swipeRightAction.label}
                </div>
            )}

            {/* Left-action background — revealed by swiping left (red; e.g. Delete/destructive) */}
            {swipeLeftAction && (
                <div className={`row-item-swipe-reveal-right ${horizontalSwipeOffset < 0 ? 'z-[1]' : 'z-0'}`}>
                    {swipeLeftAction.label}
                </div>
            )}

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
                className="row-item-swipe-content"
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
                        className="row-item-drag-handle"
                        title="Drag to reorder"
                    >
                        ⠿
                    </span>
                )}
                {children}
                {/* More Options button
                     -- stopPropagation on mousedown prevents the
                        swipe handler (which also listens to mousedown)
                        from treating this button
                        click as the start of a swipe gesture. */}
                {onOptionsPress && (
                    <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={onOptionsPress}

                        // Tailwind:
                        //  -- ml-auto: pushes button to the far right end of the "flex row" (which is located )
                        //  -- shrink-0: Even if this object (in this case, this button) is compressed, do not strink this object
                        //  -- leading-none: sets "line-height" to 1, which means that line-height = 1x the font size.
                        //         (The default would be 1.5x)

                        className="row-item-settings-btn"
                        title="More options"
                    >
                        ···
                    </button>
                )}
            </div>
        </div>
    );
}


function StaticRow({ isEditMode, dragDisabled, sortable, swipeLeftAction, swipeRightAction, onOptionsPress, children }: RowProps) {

    // "Rule of Hooks": React requires you to always call all hooks unconditionally.
    // No if-statements, early returns, or conditions should ever prevent a hook
    // from being called on every render.
    // StaticRow (this function) does NOT call any hooks directly.
    // Its caller, SwipeReorderRowItem, already called useSortable() unconditionally.
    // Here in StaticRow, if dragDisabled === true, we simply don't USE the hook's
    // potentially-error-throwing data (passed in via the `sortable` parameter).
    // This satisfies Rule of Hooks while safely ignoring potentially error-prone data when not needed.

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = sortable;

    const style = dragDisabled
        ? {}
        : {
              transform: CSS.Transform.toString(transform),
              transition: transition ?? undefined,
              opacity: isDragging ? 0.5 : 1,
          };

    return (
        // Outer wrapper carries the dnd-kit ref and drag transform/opacity.
        // RowItem below provides the visuals (background, hover, border, padding).
        <div ref={dragDisabled ? undefined : setNodeRef} style={style}>
            <RowItemStyling>
                {/* Always-visible right-action button (e.g. Details) — equivalent of swiping right */}
                {swipeRightAction && (
                    <button
                        onClick={swipeRightAction.onPress}
                        className="row-item-reveal-action-btn bg-blue-600"
                    >
                        {swipeRightAction.label}
                    </button>
                )}

                {isEditMode && !dragDisabled && (
                    <span
                        {...attributes}
                        {...listeners}
                        className="row-item-drag-handle"
                        title="Drag to reorder"
                    >
                        ⠿
                    </span>
                )}

                {children}

                {/* Always-visible left-action button (e.g. Delete) — equivalent of swiping left */}
                {swipeLeftAction && (
                    <button
                        onClick={swipeLeftAction.onPress}
                        className="row-item-reveal-action-btn bg-red-600"
                    >
                        {swipeLeftAction.label}
                    </button>
                )}

                {onOptionsPress && (
                    <button
                        onClick={onOptionsPress}
                        className="row-item-cancel-btn"
                        title="More options"
                    >
                        ···
                    </button>
                )}
            </RowItemStyling>
        </div>
    );
}

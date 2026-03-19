import MediaItemRowContent from '../MediaItemRowContent';
import type { MediaItemSummary } from '../../types/mediaItem';

// This defines what the caller must pass in
interface Props {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;  // For this variable, you pass in a function
    onCancel: () => void;  // For this variable, you pass in a function

    // Optional: shows a standardized "selected item" header at the top of the modal
    // so the user can see which item the action is about.
    itemContext?: MediaItemSummary;
}

export default function ConfirmModal({ title, message, confirmLabel = "Confirm", onConfirm, onCancel, itemContext }: Props)
{
    return (
        <>
            {/* This div is over the top of everything else
            to partially black out the background
            to better show that the modal is currently open. */}
            {/* Tailwind-Specific Explanations (as applied here in "className")
            inset-0: full screen
            bg-black/50: Means it is black at 50% transparency
            z-50: At z-index:50, which means its on top of everything else

        */}
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            {/* The Modal aka Popup
                Tailwind-Specific Explanations:
                min-w-72: Minumum width is 72
                rounded-lg: Rounded corners
                p-8: 8-sized padding
                flex-col: Make all items into 1 column (if we want the buttons side-by-side, we'll put them in 1 div)
                flex: You need flex here to use "flex-col" and "gap-4"
                gap-4: Make gap == 4 between each object in this column
            */}
            <div className = "bg-white dark:bg-gray-800 p-8 rounded-lg min-w-72 flex flex-col gap-4 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">

                {/* Standardized selected-item header — shown when the caller passes itemContext.
                    Displays the same name + media type label as the list rows, so the user
                    can clearly see which item the action is about. */}
                {itemContext && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                        <MediaItemRowContent item={itemContext} />
                    </div>
                )}

                <h2>{title}</h2>
                <p>{message}</p>
                <div className="flex gap-2">
                    <button onClick={onCancel}>Cancel</button>
                    <button onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>

        </>
    )
}

import MediaItemRowContent from '../MediaItemRowContent';
import MediaTypeLabel from '../MediaTypeLabel';
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
            {/* Dark backdrop — see .modal-overlay in index.css for Tailwind breakdown */}
        <div className="modal-overlay">
            {/* The Modal aka Popup — see .modal-panel in index.css for Tailwind breakdown */}
            <div className="modal-panel">

                {/* Standardized selected-item header — shown when the caller passes itemContext.
                    Displays the same name + media type label as the list rows, so the user
                    can clearly see which item the action is about. */}
                {itemContext && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded text-sm">
                        <MediaItemRowContent
                            firstString={itemContext.name}
                            emojiIcon={<MediaTypeLabel mediaTypeId={itemContext.mediaTypeId} faded={true} />}
                        />
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

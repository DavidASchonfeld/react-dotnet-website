import { useIsMobile } from '../../hooks/useIsMobile';
import RowItemContent from '../row_item_related/RowItemContent';
import RowItemStyling from '../row_item_related/RowItemStyling';
import MediaTypeLabel from '../MediaTypeLabel';
import ResponsiveModalFrame from './modal_frame/ResponsiveModalFrame';

// Generic item context shape — any object with name + mediaTypeId can be shown as a header
interface ItemContext {
    name: string;
    mediaTypeId: number;
}

// This defines what the caller must pass in
interface Props {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;  // For this variable, you pass in a function
    onCancel: () => void;  // For this variable, you pass in a function

    // Optional: shows a standardized "selected item" header at the top of the modal
    // so the user can see which item the action is about.
    itemContext?: ItemContext;
}

export default function ConfirmModal({ title, message, confirmLabel = "Confirm", onConfirm, onCancel, itemContext }: Props)
{
    // Selects the right panel class: drawer-panel (mobile bottom-sheet) vs modal-panel (desktop dialog)
    const isMobile = useIsMobile();

    return (
        // open={true} because ConfirmModal is always conditionally mounted by its parent
        // ResponsiveModalFrame picks DrawerModal on mobile, DialogOverlay on desktop
        <ResponsiveModalFrame open={true} onClose={onCancel}>
            {(_close) => (
                // The Modal aka Popup — see .modal-panel / .drawer-panel in index.css for Tailwind breakdown
                <div className={isMobile ? 'drawer-panel' : 'modal-panel'}>

                    {/* Standardized selected-item header — shown when the caller passes itemContext.
                        Displays the same name + media type label as the list rows, so the user
                        can clearly see which item the action is about. */}
                    {itemContext && (
                        <RowItemStyling>
                            <RowItemContent
                                firstString={itemContext.name}
                                labelPill={<MediaTypeLabel mediaTypeId={itemContext.mediaTypeId} faded={true} />}
                            />
                        </RowItemStyling>
                    )}

                    <h1 className='h1-styling'>{title}</h1>
                    <p>{message}</p>
                    {/* In Tailwind, regular and default options always exist
                    For md: that's for medium size (and larger) screens
                    For lg: that's for large size (and larger screens
                    // This is helpful for scaling items based on the screen size
                    */}
                    <div className="flex gap-1 md:gap-3 lg:gap-5 justify-center">
                        <button className="btn btn-secondary w-fit"
                            onClick={onCancel}>Cancel</button>
                        <button className="btn btn-secondary w-fit"
                            onClick={onConfirm}>{confirmLabel}</button>
                    </div>
                </div>
            )}
        </ResponsiveModalFrame>
    )
}

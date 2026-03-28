import { useRef, type ReactNode } from 'react';
import AnimatedPage from '../../AnimatedPage';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

interface Props {
    children: ReactNode;
    onBackdropClick?: () => void;
    // a11y: titleId — ID of the heading inside the dialog; used by aria-labelledby so screen readers announce the dialog title
    titleId?: string;
    // a11y: onEsc — called when the user presses Escape; passed to useFocusTrap so the dialog closes on Escape
    onEsc?: () => void;
}

export default function DialogOverlay({ children, onBackdropClick, titleId, onEsc }: Props) {
    // a11y: ref for the dialog panel so useFocusTrap can locate focusable children and trap Tab key
    const panelRef = useRef<HTMLDivElement>(null);

    // a11y: activate focus trap as soon as the overlay is mounted (it only renders when open)
    useFocusTrap({ containerRef: panelRef, enabled: true, onEsc: onEsc ?? onBackdropClick });

    return (
        // Dark backdrop — see .modal-overlay in index.css for Tailwind breakdown
        <div className="modal-overlay" onClick={onBackdropClick}>
            {/* a11y: role="dialog" + aria-modal tells screen readers this is a modal; stops virtual-cursor from leaving */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                // a11y: aria-labelledby links the dialog to its visible title element for screen reader announcement
                aria-labelledby={titleId}
                onClick={e => e.stopPropagation()}
            >
                <AnimatedPage variant="dialogOverlay">
                    {children}
                </AnimatedPage>
            </div>
        </div>
    );
}

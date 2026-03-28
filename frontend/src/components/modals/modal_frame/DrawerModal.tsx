import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "../../../hooks/useFocusTrap";

interface DrawerModalProps {
    open: boolean;
    onClose: () => void;
    children: (close: () => void) => ReactNode;
    // a11y: titleId — ID of the heading inside the drawer; used by aria-labelledby so screen readers announce the dialog title
    titleId?: string;
}

export default function DrawerModal({ open, onClose, children, titleId }: DrawerModalProps) {

    // 'visible' drives the CSS slide-up/slide-down animation.
    // It is separate from 'open' because 'open' controls whether the modal
    // is mounted, while 'visible' controls the animation state.
    const [visible, setVisible] = useState(false);

    // a11y: ref for the drawer panel so useFocusTrap can locate focusable children
    const panelRef = useRef<HTMLDivElement>(null);

    // a11y: detect reduced-motion preference so we skip the slide animation for users who need it
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        if (open) {
            // Defer the state update to after the browser has painted,
            // so the slide-up transition actually runs instead of snapping into place.
            // Skip the defer when reduced-motion is preferred — show immediately
            if (prefersReducedMotion) {
                setVisible(true);
            } else {
                const id = requestAnimationFrame(() => setVisible(true));
                return () => cancelAnimationFrame(id);
            }
        }
    }, [open, prefersReducedMotion]);

    function close() {
        setVisible(false);
        // Wait 300ms for the slide-down animation to finish before unmounting
        // When reduced-motion is preferred, skip the wait and close immediately
        if (prefersReducedMotion) {
            onClose();
        } else {
            setTimeout(onClose, 300);
        }
    }

    // a11y: trap focus inside the drawer panel while it is open
    useFocusTrap({ containerRef: panelRef, enabled: open, onEsc: close });

    if (!open) return null;

    return createPortal(
        <div
            // Backdrop — dims everything behind the drawer
            className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ${visible ? 'bg-black/50' : 'bg-black/0'}`}
            onClick={close}
            // a11y: backdrop click closes; aria-hidden so screen readers focus on the dialog, not the backdrop
            aria-hidden="false"
        >
            {/* Drawer Panel */}
            <div
                ref={panelRef}
                // a11y: role="dialog" + aria-modal tells screen readers this is a modal dialog
                role="dialog"
                aria-modal="true"
                // a11y: aria-labelledby links the dialog to its visible title for screen reader announcement
                aria-labelledby={titleId}
                className={`w-full max-w-lg bg-surface-raised rounded-t-2xl pb-8 transform transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    {/* a11y: aria-hidden — purely decorative drag handle, invisible to screen readers */}
                    <div className="w-10 h-2 rounded-full bg-text-muted" aria-hidden="true" />
                </div>

                {children(close)}
            </div>
        </div>,
        document.body
    );
}

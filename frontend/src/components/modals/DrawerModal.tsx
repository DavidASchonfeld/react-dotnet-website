import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DrawerModalProps {
    open: boolean;
    onClose: () => void;
    children: (close: () => void) => ReactNode;
}

export default function DrawerModal({ open, onClose, children }: DrawerModalProps) {

    // 'visible' drives the CSS slide-up/slide-down animation.
    // It is separate from 'open' because 'open' controls whether the modal
    // is mounted, while 'visible' controls the animation state.
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            // Defer the state update to after the browser has painted,
            // so the slide-up transition actually runs instead of snapping into place.
            const id = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(id);
        }
    }, [open]);

    function close() {
        setVisible(false);
        // Wait 300ms for the slide-down animation to finish before unmounting
        setTimeout(onClose, 300);
    }

    if (!open) return null;

    return createPortal(
        <div
            // Backdrop — dims everything behind the drawer
            className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ${visible ? 'bg-black/50' : 'bg-black/0'}`}
            onClick={close}
        >
            {/* Drawer Panel */}
            <div
                className={`w-full max-w-lg bg-surface-raised rounded-t-2xl pb-8 transform transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-2 rounded-full bg-text-muted" />
                </div>

                {children(close)}
            </div>
        </div>,
        document.body
    );
}

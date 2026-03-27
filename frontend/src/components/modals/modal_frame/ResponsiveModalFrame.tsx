import type { ReactNode } from 'react';
import { useIsMobile } from '../../../hooks/useIsMobile';
import DrawerModal from './DrawerModal';
import DialogOverlay from './DialogOverlay';

interface Props {
    open: boolean;
    onClose: () => void;
    // Render-prop matching DrawerModal's contract: receives close so children can dismiss themselves
    children: (close: () => void) => ReactNode;
}

// Responsive modal frame — automatically picks the right container based on viewport width.
//
// Design rule (mirrors shadcn/ui Dialog+Drawer and MUI Modal+SwipeableDrawer):
//   Mobile  (<640px) → DrawerModal   (bottom-sheet; slides up from bottom; thumb-reachable)
//   Desktop (≥640px) → DialogOverlay (centered popup; full pointer/keyboard support)
//
// Using the render-prop pattern for children keeps the API consistent between both frames:
// DrawerModal already uses render-prop; on desktop, `close` simply aliases `onClose`.
export default function ResponsiveModalFrame({ open, onClose, children }: Props) {
    const isMobile = useIsMobile();

    if (isMobile) {
        // Mobile: slide-up drawer — DrawerModal handles animation and backdrop
        return (
            <DrawerModal open={open} onClose={onClose}>
                {(close) => children(close)}
            </DrawerModal>
        );
    }

    // DialogOverlay has no open prop — guard with open so it unmounts on close
    if (!open) return null;

    // Desktop: centered dialog — DialogOverlay provides the dark backdrop
    return (
        <DialogOverlay onBackdropClick={onClose}>
            {children(onClose)}
        </DialogOverlay>
    );
}

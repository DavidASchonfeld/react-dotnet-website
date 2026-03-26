import type { ReactNode } from 'react';
import AnimatedPage from '../AnimatedPage';

interface Props {
    children: ReactNode;
    onBackdropClick?: () => void;
}

export default function DialogOverlay({ children, onBackdropClick }: Props) {
    return (
        // Dark backdrop — see .modal-overlay in index.css for Tailwind breakdown
        <div className="modal-overlay" onClick={onBackdropClick}>
            <AnimatedPage variant="dialogOverlay">
                {children}
            </AnimatedPage>
        </div>
    );
}

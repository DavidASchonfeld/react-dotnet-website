import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    onClick?: () => void;
    // 'phone': adds row-item-phone on top of row-item — caps width to 390px, centers, sets 6:1 aspect ratio.
    variant?: 'phone';
}

// Visual styling for a list row: background, hover/active states, border separator, and horizontal padding.
// Use this directly when no swipe or drag-and-drop behaviour is needed.
// SwipeReorderRowItem applies the same visual style internally for its swipeable case,
// and uses this component directly for its static (swipe-disabled) case.
export default function RowItemStyling({ children, onClick, variant}: Props) {
    return (
        <div
            onClick={onClick}
            className={`row-item${variant === 'phone' ? ' row-item-phone' : ''}${onClick ? ' cursor-pointer' : ''}`}
        >
            {children}
        </div>
    );
}

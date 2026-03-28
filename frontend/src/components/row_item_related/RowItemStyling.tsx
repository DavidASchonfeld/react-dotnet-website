import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    onClick?: () => void;
    // 'phone': adds row-item-phone on top of row-item — caps width to 390px, centers, sets 6:1 aspect ratio.
    // 'larger': adds row-item-larger on top of row-item — enforces a fixed height so all rows are the same size.
    variant?: 'phone' | 'larger';
}

// Visual styling for a list row: background, hover/active states, border separator, and horizontal padding.
// Use this directly when no swipe or drag-and-drop behaviour is needed.
// SwipeReorderRowItem applies the same visual style internally for its swipeable case,
// and uses this component directly for its static (swipe-disabled) case.
export default function RowItemStyling({ children, onClick, variant}: Props) {
    const className = `row-item${variant === 'phone' ? ' row-item-phone' : ''}${variant === 'larger' ? ' row-item-larger' : ''}${onClick ? ' cursor-pointer' : ''}`;

    // a11y: when onClick is provided, render a <button> so keyboard users can Tab to and activate rows with Enter/Space
    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                // a11y: w-full + text-left make the button fill its container and left-align content like a div would
                className={className + ' w-full text-left'}
            >
                {children}
            </button>
        );
    }

    // No click handler — render as a plain div (purely visual, not interactive)
    return (
        <div className={className}>
            {children}
        </div>
    );
}

import { useState, useEffect } from 'react';

// Returns true when the viewport is below the sm breakpoint (640px).
// Uses matchMedia so it only updates on boundary crossings, not every pixel.
// Query is max-width: 639px to match Tailwind's sm: breakpoint exactly (activates at 640px).
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(
        // Lazy initializer: reads viewport on first render to avoid a flash of the wrong layout
        () => window.matchMedia('(max-width: 639px)').matches
    );

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return isMobile;
}

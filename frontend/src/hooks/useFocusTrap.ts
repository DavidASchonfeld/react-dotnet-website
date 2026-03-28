// a11y: useFocusTrap — traps keyboard focus inside a modal/dialog so users can't Tab out accidentally
import { useEffect, useRef } from 'react';

// Selectors for all naturally focusable HTML elements
const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
    // a11y: containerRef — the element whose children are kept in focus rotation
    containerRef: React.RefObject<HTMLElement | null>;
    // a11y: enabled — only activate the trap when the modal is actually open
    enabled: boolean;
    // a11y: onEsc — called when the user presses Escape so the modal can close
    onEsc?: () => void;
}

export function useFocusTrap({ containerRef, enabled, onEsc }: UseFocusTrapOptions) {
    // a11y: track the element that was focused before the modal opened so we can restore it on close
    const previousFocusRef = useRef<Element | null>(null);

    useEffect(() => {
        if (!enabled) return;

        // a11y: save the currently focused element so focus can return here when the modal closes
        previousFocusRef.current = document.activeElement;

        // a11y: move focus into the modal on open — targets the first focusable child
        const container = containerRef.current;
        if (container) {
            const first = container.querySelector<HTMLElement>(FOCUSABLE);
            first?.focus();
        }

        function handleKeyDown(e: KeyboardEvent) {
            const container = containerRef.current;
            if (!container) return;

            // a11y: close the modal on Escape key press
            if (e.key === 'Escape') {
                onEsc?.();
                return;
            }

            // a11y: trap Tab/Shift+Tab so focus cycles only within the modal
            if (e.key !== 'Tab') return;

            const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                // a11y: Shift+Tab from first element wraps around to the last
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                // a11y: Tab from last element wraps around to the first
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // a11y: restore focus to the element that was active before the modal opened
            if (previousFocusRef.current instanceof HTMLElement) {
                previousFocusRef.current.focus();
            }
        };
    }, [enabled, onEsc, containerRef]);
}

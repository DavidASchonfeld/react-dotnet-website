// toastEvents: a small publish/subscribe for fallback toasts — no Redux, no React (to prevent circular import bug)
// When Sonner (the 3rd-party Toaster library) fails, safeToast emits here
// and FallbackToaster (a React component) subscribes to render the home-made version.

// Toast = Notifications that appears on the side, fade away after a few seconds.
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

// Discriminated union (that object type could be 1 of several shapes (aka different JSON object structures))
//  'add' tells FallbackToaster to show a toast; 'remove' tells it to hide one.
// Use the provided id if given (needed for loading toasts — we need to know the id
// ahead of time so safeToast.promise can remove the loading toast when the promise settles).
// For all other toasts, safeToast auto-generates a unique id from the current timestamp.
export type ToastEvent =
    | { kind: 'add';    id: string; message: string; type: ToastType }
    | { kind: 'remove'; id: string };

type Listener = (event: ToastEvent) => void;

// Module-level listener list — one instance for the whole app lifetime.
const listeners: Listener[] = [];

export const toastEvents = {
    // Broadcast an event to every active subscriber.
    emit: (event: ToastEvent) => listeners.forEach(l => l(event)),

    // Subscribe to toast events; returns an unsubscribe function for useEffect cleanup.
    subscribe: (listener: Listener): (() => void) => {
        listeners.push(listener);

        // Gives the "unsubscribe" method to the listener
        // so when the component unmounts, it can remove the listener, cleaning up successfully.
        return () => {
            const i = listeners.indexOf(listener);
            if (i !== -1) listeners.splice(i, 1);
        };
    },
};

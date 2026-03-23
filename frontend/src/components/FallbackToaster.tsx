// FallbackToaster: renders only when Sonner (the 3rd-party Toaster library) fails.
// Under normal operation this returns null and has zero cost.
import { useEffect, useState } from 'react';
import { toastEvents, type ToastType } from '../utils/toastEvents';

// Local toast shape — mirrors ToastEvent 'add' fields, stored in component state.
interface Toast { id: string; message: string; type: ToastType }

const TYPE_STYLES: Record<string, string> = {
    success: 'border-green-500',
    error:   'border-red-500',
    info:    'border-blue-500',
    warning: 'border-yellow-500',
    loading: 'border-gray-400',
};

function ToastItem({ id, message, type }: { id: string; message: string; type: string }) {

    // After a ToastItem starts being shown, it will stay/exist until, after 4 seconds, it fades away forever automatically
    useEffect(() => {
        // Loading toasts stay until manually removed by safeToast.promise's fallback
        // (when the promise resolves or rejects, it emits a 'remove' event + a success/error toast).
        // Auto-dismissing a loading toast would leave the user with no feedback at all.
        if (type === 'loading') return;

        const timer = setTimeout(() => toastEvents.emit({ kind: 'remove', id }), 4000);
        return () => clearTimeout(timer);
    }, [id, type]);

    return (
        <div className={`toast-base px-4 py-3 text-sm border-l-4 ${TYPE_STYLES[type] ?? ''}`}>
            {/* Show an hourglass prefix on loading toasts so the user knows something is in progress */}
            {type === 'loading' && <span>⏳ </span>}
            {message}
        </div>
    );
}

export default function FallbackToaster() {
    // Local state holds the active fallback toasts — no Redux needed.
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        // Subscribe on mount; the returned fn unsubscribes on unmount to prevent memory leaks.
        return toastEvents.subscribe(event => {
            if (event.kind === 'add') {

                // set the local state component "toasts" to become itself + the new passed-in toast event
                setToasts(prev => [...prev, { id: event.id, message: event.message, type: event.type }]);
            } else {
                // 'remove' event: filter out the toast with the matching id.
                setToasts(prev => prev.filter(t => t.id !== event.id));
            }
        });
    }, []); // <- This means that FallbackToaster will start its listener as soon as the website starts

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 min-w-64">
            {toasts.map(t => (
                <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} />
            ))}
        </div>
    );
}

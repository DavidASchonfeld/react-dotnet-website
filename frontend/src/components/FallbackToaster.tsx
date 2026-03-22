// FallbackToaster: renders only when Sonner (the 3rd-party Toaster library) fails.
// Under normal operation this returns null and has zero cost.
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { removeToast } from '../store/toastSlice';

const TYPE_STYLES: Record<string, string> = {
    success: 'border-green-500',
    error:   'border-red-500',
    info:    'border-blue-500',
    warning: 'border-yellow-500',
    loading: 'border-gray-400',
};

function ToastItem({ id, message, type }: { id: string; message: string; type: string }) {
    const dispatch = useDispatch<AppDispatch>();


    // After a ToastItem starts being shown, it will stay/exist until, after 4 seconds, it fades away forever automatically
    useEffect(() => {
        // Loading toasts stay until manually removed by safeToast.promise's fallback
        // (when the promise resolves or rejects, it dispatches removeToast + a success/error toast).
        // Auto-dismissing a loading toast would leave the user with no feedback at all.
        if (type === 'loading') return;

        const timer = setTimeout(() => dispatch(removeToast(id)), 4000);
        return () => clearTimeout(timer);
    }, [id, dispatch, type]);

    return (
        <div className={`toast-base px-4 py-3 text-sm border-l-4 ${TYPE_STYLES[type] ?? ''}`}>
            {/* Show a spinner prefix on loading toasts so the user knows something is in progress */}
            {type === 'loading' && <span>⏳ </span>}
            {message}
        </div>
    );
}

export default function FallbackToaster() {
    const toasts = useSelector((state: RootState) => state.toast.toasts);
    if (toasts.length === 0) return null;

    return (

        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 min-w-64">
            {toasts.map(t => (
                <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} />
            ))}
        </div>
    );
}

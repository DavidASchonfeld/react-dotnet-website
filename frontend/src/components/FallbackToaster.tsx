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
};

function ToastItem({ id, message, type }: { id: string; message: string; type: string }) {
    const dispatch = useDispatch<AppDispatch>();


    // After a ToastItem starts being shown, it will stay/exist until, after 4 seconds, it fades away forever automatically
    useEffect(() => {
        const timer = setTimeout(() => dispatch(removeToast(id)), 4000);
        return () => clearTimeout(timer);
    }, [id, dispatch]);

    return (
        <div className={`toast-base px-4 py-3 text-sm border-l-4 ${TYPE_STYLES[type] ?? ''}`}>
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

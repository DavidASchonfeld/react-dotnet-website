import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastState {
    toasts: Toast[];
}

const initialState: ToastState = {
    toasts: []
};
// Toast = Notifications that appears on the side, fade away after a few seconds.

// When a toast exists in this slice, that means it is being show to the user.
// so addToast should prompt the Toast window (in a different TypeScript file) to show up.
// and removeToast should make the toast fade away permanently.

const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {

        // Omit really means: Set this parameter object type to this object type MINUS the "id" value
        // So,"Toast type" minus "id: string" = {message: string, type: ToastType} <- So that is the actual parameter type
        // I do not want/need to input an id since I am going to automatically set the id to the current daytime
        // to guarantee that each Toast has a unique id and since Toasts are meant to be discarded,
        // (and since users never see Toast's ids) its original id does not matter anyway so the original id value can be discarded.
        addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {

            // "..." in front of a variable tells that variable to unwrap all of its values into this object
            state.toasts.push({ ...action.payload, id: Date.now().toString() });
        },
        removeToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter(t => t.id !== action.payload);
        }
    }
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;

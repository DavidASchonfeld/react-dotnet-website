import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AdminSettingsState {
    showImageCacheIndicator: boolean;
}

const initialState: AdminSettingsState = {
    showImageCacheIndicator: true,
};

const adminSettingsSlice = createSlice({
    name: 'adminSettings',
    initialState,
    reducers: {
        setShowImageCacheIndicator(state, action: PayloadAction<boolean>) {
            state.showImageCacheIndicator = action.payload;
        },
    },
});

export const { setShowImageCacheIndicator } = adminSettingsSlice.actions;
export default adminSettingsSlice.reducer;

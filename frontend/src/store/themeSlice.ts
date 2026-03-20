import { createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type Theme = 
    | 'ocean-dark'
    | 'ocean-light'
    | 'forest-dark'
    | 'forest-light';

interface ThemeState {
    currentTheme: Theme | null;
}

const initialState: ThemeState = {
    currentTheme: null
}

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setCurrentTheme(state, action: PayloadAction<Theme | null>){
            state.currentTheme = action.payload;

            //// Apply immediately to DOM
            // This action is already handled in App.tsx,
            // since that file has a useEffect with
            // a dependency on currentTheme so
            // as soon as currentTheme's value changes,
            // like in the line above,
            // that useEffect in App.tsx
            // will do that same code that is commented out here below:
            /* if (action.payload === null){
                   document.documentElement.removeAttribute('data-theme');
               } else {
                   document.documentElement.setAttribute('data-theme', action.payload);
               } */
        }
    }
});

export const { setCurrentTheme } = themeSlice.actions;
export default themeSlice.reducer;
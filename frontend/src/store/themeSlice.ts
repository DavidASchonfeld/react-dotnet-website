import { createSlice, type PayloadAction} from '@reduxjs/toolkit';





export type CssTheme = 

// CSS Color Themes, all specified in frontend/src/index.css
    | 'ocean-dark'
    | 'ocean-light'
    | 'forest-dark'
    | 'forest-light';

// JavaScript-Specific Themes
//// Day-Night Themes (Switch between 2 CSS themes, depending on the time of day)
//// JavaScript logic lives in frontend/src/App.tsx, because that is where the code to detect/change themes is located.
export type DayNightTheme =
    | 'ocean-dayNight'
    | 'forest-dayNight';

export const DAY_NIGHT_MAP: Record<DayNightTheme, {dayTheme: CssTheme; nightTheme: CssTheme }> = {
    'ocean-dayNight' : { dayTheme: 'ocean-light', nightTheme: 'ocean-dark'},
    'forest-dayNight' : { dayTheme: 'forest-light', nightTheme: 'forest-dark'},
};





export type Theme = CssTheme | DayNightTheme;

interface ThemeState {
    currentTheme: Theme | null;
}

const initialState: ThemeState = {
    currentTheme: null,
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
        },
    }
});

export const { setCurrentTheme } = themeSlice.actions;
export default themeSlice.reducer;
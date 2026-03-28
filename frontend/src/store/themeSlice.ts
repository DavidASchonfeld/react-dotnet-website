import { createSlice, type PayloadAction} from '@reduxjs/toolkit';





export type CssTheme =

// CSS Color Themes, all specified in frontend/src/index.css
    | 'ocean-dark'     | 'ocean-light'
    | 'forest-dark'    | 'forest-light'
    | 'sunset-dark'    | 'sunset-light'    // Warm analogous (color wheel warm side)
    | 'lavender-dark'  | 'lavender-light'  // Cool analogous (color wheel cool side)
    | 'crimson-dark'   | 'crimson-light'   // Monochromatic red
    | 'amber-dark'     | 'amber-light'     // Warm tertiary (near-complementary to blue)
    | 'midnight-dark'  | 'midnight-light'  // Cool triadic / split-complementary
    // Special / Stylized Themes
    | 'glass-dark'     // Glassmorphism — frosted panels over a dark gradient background
    | 'glass-light'    // Glassmorphism — frosted panels over a light gradient background
    | 'terminal-dark'  // Retro CRT — monospace font, phosphor green, scanlines
    | 'cream-office'   // Cream Office — warm cream, serif headings, deep red accent
    | 'neon-dark'      // Cyberpunk — near-black with vivid neon cyan/magenta glow
    | 'cream'          // Cozy parchment — warm sepia tones, terracotta accent
    | 'amoled';        // Pure Black — AMOLED = Active Matrix Organic Light-Emitting Diode; pure black pixels are completely off on OLED screens, saving battery

// JavaScript-Specific Themes
//// Day-Night Themes (Switch between 2 CSS themes, depending on the time of day)
//// JavaScript logic lives in frontend/src/App.tsx, because that is where the code to detect/change themes is located.
export type DayNightTheme =
    | 'ocean-dayNight'
    | 'forest-dayNight'
    | 'sunset-dayNight'
    | 'lavender-dayNight'
    | 'crimson-dayNight'
    | 'amber-dayNight'
    | 'midnight-dayNight'
    | 'glass-dayNight';

export const DAY_NIGHT_MAP: Record<DayNightTheme, {dayTheme: CssTheme; nightTheme: CssTheme }> = {
    'ocean-dayNight'    : { dayTheme: 'ocean-light',    nightTheme: 'ocean-dark'    },
    'forest-dayNight'   : { dayTheme: 'forest-light',   nightTheme: 'forest-dark'   },
    'sunset-dayNight'   : { dayTheme: 'sunset-light',   nightTheme: 'sunset-dark'   },
    'lavender-dayNight' : { dayTheme: 'lavender-light', nightTheme: 'lavender-dark' },
    'crimson-dayNight'  : { dayTheme: 'crimson-light',  nightTheme: 'crimson-dark'  },
    'amber-dayNight'    : { dayTheme: 'amber-light',    nightTheme: 'amber-dark'    },
    'midnight-dayNight' : { dayTheme: 'midnight-light', nightTheme: 'midnight-dark' },
    'glass-dayNight'    : { dayTheme: 'glass-light',    nightTheme: 'glass-dark'    },
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

        // Same mutation as setCurrentTheme but a distinct action type so the listener
        // middleware does NOT re-sync to the backend (prevents an infinite save loop).
        loadThemeFromServer(state, action: PayloadAction<Theme | null>){
            state.currentTheme = action.payload;
        },
    }
});

export const { setCurrentTheme, loadThemeFromServer } = themeSlice.actions;
export default themeSlice.reducer;
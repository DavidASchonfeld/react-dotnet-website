import { createSlice, type PayloadAction } from '@reduxjs/toolkit';





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
    | 'azure-dark'          // Azure — frosted panels over a dark gradient background
    | 'azure-light'         // Azure — frosted panels over a light gradient background
    | 'terminal-dark'       // Retro CRT — monospace font, phosphor green, scanlines
    | 'cream-office'        // Tan Office (Light) — warm tan, serif headings, deep red accent
    | 'cream-office-dark'   // Tan Office (Dark) — deep mahogany, editorial red, warm gold
    | 'neon-dark'           // Cyberpunk — near-black with vivid neon cyan/magenta glow
    | 'cream'               // Cream (Light) — cozy parchment, warm sepia tones, terracotta accent
    | 'cream-dark'          // Cream (Dark) — deep sepia, terracotta, evening reading nook
    | 'cowboy-light'        // Cowboy (Light) — warm tan parchment, rust red, brass accent, western serif
    | 'cowboy-dark'         // Cowboy (Dark) — deep saddle leather, ember red, gold accent
    | 'amoled'              // Pure Black — AMOLED = Active Matrix Organic Light-Emitting Diode; pure black pixels are completely off on OLED screens, saving battery
    // Popular / Professional Palettes
    | 'nord-dark'           // Nord (Dark) — arctic slate blues, cool muted tones
    | 'nord-light'          // Nord (Light) — snow-storm palette, deep slate text
    | 'teal-dark'           // Teal (Dark) — deep teal-black with bright teal accents
    | 'teal-light'          // Teal (Light) — rich deep teal surfaces with mint accents
    | 'monochrome-dark'     // Monochrome (Dark) — pure grayscale dark
    | 'monochrome-light';   // Monochrome (Light) — clean neutral white

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
    | 'azure-dayNight'
    | 'cream-office-dayNight'
    | 'cream-dayNight'
    | 'cowboy-dayNight'
    | 'nord-dayNight'
    | 'teal-dayNight'
    | 'monochrome-dayNight';

export const DAY_NIGHT_MAP: Record<DayNightTheme, {dayTheme: CssTheme; nightTheme: CssTheme }> = {
    'ocean-dayNight'    : { dayTheme: 'ocean-light',    nightTheme: 'ocean-dark'    },
    'forest-dayNight'   : { dayTheme: 'forest-light',   nightTheme: 'forest-dark'   },
    'sunset-dayNight'   : { dayTheme: 'sunset-light',   nightTheme: 'sunset-dark'   },
    'lavender-dayNight' : { dayTheme: 'lavender-light', nightTheme: 'lavender-dark' },
    'crimson-dayNight'  : { dayTheme: 'crimson-light',  nightTheme: 'crimson-dark'  },
    'amber-dayNight'    : { dayTheme: 'amber-light',    nightTheme: 'amber-dark'    },
    'midnight-dayNight'      : { dayTheme: 'midnight-light', nightTheme: 'midnight-dark'    },
    'azure-dayNight'         : { dayTheme: 'azure-light',    nightTheme: 'azure-dark'       },
    'cream-office-dayNight'  : { dayTheme: 'cream-office',   nightTheme: 'cream-office-dark' },
    'cream-dayNight'         : { dayTheme: 'cream',          nightTheme: 'cream-dark'        },
    'cowboy-dayNight'        : { dayTheme: 'cowboy-light',   nightTheme: 'cowboy-dark'       },
    'nord-dayNight'          : { dayTheme: 'nord-light',       nightTheme: 'nord-dark'         },
    'teal-dayNight'          : { dayTheme: 'teal-light',       nightTheme: 'teal-dark'         },
    'monochrome-dayNight'    : { dayTheme: 'monochrome-light', nightTheme: 'monochrome-dark'   },
};





export type Theme = CssTheme | DayNightTheme;

// Style modifier applied on top of any color theme (e.g. glass frosting)
export type ThemeModifier = 'glass' | 'bordered';

interface ThemeState {
    currentTheme: Theme | null;
    currentModifier: ThemeModifier | null; // optional overlay on top of the color theme
}

const initialState: ThemeState = {
    currentTheme: null,
    currentModifier: null,
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

        // User-triggered modifier change — listener middleware syncs this to the backend.
        setCurrentModifier(state, action: PayloadAction<ThemeModifier | null>){
            state.currentModifier = action.payload;
        },

        // Server-loaded modifier — distinct action so the listener does NOT re-sync.
        loadModifierFromServer(state, action: PayloadAction<ThemeModifier | null>){
            state.currentModifier = action.payload;
        },
    }
});

export const { setCurrentTheme, loadThemeFromServer, setCurrentModifier, loadModifierFromServer } = themeSlice.actions;
export default themeSlice.reducer;
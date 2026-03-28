import type { Theme } from '../store/themeSlice';

// ─── Theme family type & data ─────────────────────────────────────────────────

export type ThemeFamily = {
    name: string;
    dark: string;
    light: string;
    dayNight: string;
};

// All family themes — each maps dark / light / dayNight variants to a CSS theme string
export const THEME_FAMILIES: ThemeFamily[] = [
    { name: 'Ocean',      dark: 'ocean-dark',         light: 'ocean-light',    dayNight: 'ocean-dayNight'         },
    { name: 'Forest',     dark: 'forest-dark',        light: 'forest-light',   dayNight: 'forest-dayNight'        },
    { name: 'Sunset',     dark: 'sunset-dark',        light: 'sunset-light',   dayNight: 'sunset-dayNight'        },
    { name: 'Lavender',   dark: 'lavender-dark',      light: 'lavender-light', dayNight: 'lavender-dayNight'      },
    { name: 'Crimson',    dark: 'crimson-dark',       light: 'crimson-light',  dayNight: 'crimson-dayNight'       },
    { name: 'Amber',      dark: 'amber-dark',         light: 'amber-light',    dayNight: 'amber-dayNight'         },
    { name: 'Midnight',   dark: 'midnight-dark',      light: 'midnight-light', dayNight: 'midnight-dayNight'      },
    { name: 'Azure',      dark: 'azure-dark',         light: 'azure-light',    dayNight: 'azure-dayNight'         },
    { name: 'Tan Office', dark: 'cream-office-dark',  light: 'cream-office',   dayNight: 'cream-office-dayNight'  },
    { name: 'Cream',      dark: 'cream-dark',         light: 'cream',          dayNight: 'cream-dayNight'         },
    { name: 'Cowboy',     dark: 'cowboy-dark',        light: 'cowboy-light',   dayNight: 'cowboy-dayNight'        },
    { name: 'Nord',       dark: 'nord-dark',          light: 'nord-light',     dayNight: 'nord-dayNight'          },
    { name: 'Teal',       dark: 'teal-dark',           light: 'teal-light',       dayNight: 'teal-dayNight'        },
    { name: 'Monochrome', dark: 'monochrome-dark',    light: 'monochrome-light', dayNight: 'monochrome-dayNight'  },
];

// Standalone themes — value + display label only (no preview data needed here)
const STANDALONE_LABELS: Array<{ value: Theme | null; label: string }> = [
    { value: null,            label: 'Tailwind Default' },
    { value: 'terminal-dark', label: 'Terminal'         },
    { value: 'neon-dark',     label: 'Neon'             },
    { value: 'amoled',        label: 'Pure Black'       },
];

// ─── Display name lookup ──────────────────────────────────────────────────────

// Returns the human-readable display name for a given theme value.
export function getThemeDisplayName(theme: Theme | null): string {
    // Check standalone entries first (includes null → 'Tailwind Default')
    const standalone = STANDALONE_LABELS.find(e => e.value === theme);
    if (standalone) return standalone.label;
    // Check family themes — match variant suffix
    for (const family of THEME_FAMILIES) {
        if (theme === family.dark)     return `${family.name} (Dark)`;
        if (theme === family.light)    return `${family.name} (Light)`;
        if (theme === family.dayNight) return `${family.name} (Day/Night)`;
    }
    // Fallback: return raw string (should never happen with valid theme values)
    return theme ?? 'None';
}

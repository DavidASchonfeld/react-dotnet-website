import { useDispatch, useSelector } from 'react-redux';
import { setCurrentTheme, type Theme } from '../store/themeSlice';
import type { AppDispatch, RootState } from '../store/store';

// Flat color previews for each CSS theme — sourced directly from index.css.
// Glass surfaces kept as rgba so the backdrop-blur effect is visible in swatches.
type ThemePreview = {
    bg: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
};

const CSS_PREVIEW: Record<string, ThemePreview> = {
    'ocean-dark':     { bg: '#0f172a', surface: '#1e293b',              primary: '#3b82f6', accent: '#f59e0b', text: '#f1f5f9' },
    'ocean-light':    { bg: '#f8fafc', surface: '#ffffff',              primary: '#2563eb', accent: '#d97706', text: '#0f172a' },
    'forest-dark':    { bg: '#0d1a12', surface: '#1a2e1f',              primary: '#10b981', accent: '#f59e0b', text: '#ecfdf5' },
    'forest-light':   { bg: '#f0fdf4', surface: '#ffffff',              primary: '#16a34a', accent: '#d97706', text: '#14532d' },
    'sunset-dark':    { bg: '#150600', surface: '#2a1000',              primary: '#f97316', accent: '#facc15', text: '#fff7ed' },
    'sunset-light':   { bg: '#fff7ed', surface: '#ffffff',              primary: '#ea580c', accent: '#ca8a04', text: '#7c2d12' },
    'lavender-dark':  { bg: '#0d0514', surface: '#1a0d28',              primary: '#a855f7', accent: '#f59e0b', text: '#faf5ff' },
    'lavender-light': { bg: '#faf5ff', surface: '#ffffff',              primary: '#9333ea', accent: '#d97706', text: '#3b0764' },
    'crimson-dark':   { bg: '#0f0506', surface: '#1f0a0d',              primary: '#f43f5e', accent: '#f59e0b', text: '#fff1f2' },
    'crimson-light':  { bg: '#fff1f2', surface: '#ffffff',              primary: '#e11d48', accent: '#d97706', text: '#881337' },
    'amber-dark':     { bg: '#140c00', surface: '#211500',              primary: '#f59e0b', accent: '#84cc16', text: '#fffbeb' },
    'amber-light':    { bg: '#fffbeb', surface: '#ffffff',              primary: '#d97706', accent: '#65a30d', text: '#78350f' },
    'midnight-dark':  { bg: '#06071a', surface: '#0f1033',              primary: '#6366f1', accent: '#f59e0b', text: '#eef2ff' },
    'midnight-light': { bg: '#eef2ff', surface: '#ffffff',              primary: '#4f46e5', accent: '#d97706', text: '#1e1b4b' },
    'glass-dark':     { bg: '#0a0f1e', surface: 'rgba(255,255,255,0.18)', primary: '#7eb8f7', accent: '#ffd166', text: '#e8eeff' },
    'glass-light':    { bg: '#e8f4fd', surface: 'rgba(255,255,255,0.75)', primary: '#6488c8', accent: '#5dc8b0', text: '#1e3a5a' },
    'terminal-dark':  { bg: '#000000', surface: '#0d0d0d',              primary: '#33ff33', accent: '#ffaa00', text: '#33ff33' },
    'cream-office':   { bg: '#f0e8d0', surface: '#f4edd8',              primary: '#8b1a1a', accent: '#8b6914', text: '#1a1a1a' },

    'neon-dark':      { bg: '#05050e', surface: '#0d0d22',              primary: '#00eeff', accent: '#ff00ff', text: '#e8f0ff'  },
    'cream':          { bg: '#fef9f0', surface: '#fff8eb',              primary: '#c0622f', accent: '#8b7355', text: '#3d2b1f' },
    'amoled':         { bg: '#000000', surface: '#111111',              primary: '#60a5fa', accent: '#fbbf24', text: '#ffffff' },

};

// ─── Theme-specific rendering characteristics ────────────────────────────────

type ThemeStyle = {
    fontFamily: string;
    scanlines?: boolean;    // CRT scanline overlay (terminal)
    glow?: boolean;         // neon text-shadow glow
    glassBlur?: boolean;    // backdrop-filter blur on surfaces
    bodyBg?: string;        // gradient bg override (glass themes)
    titleCase?: 'uppercase' | 'normal';
    cardRadius?: number;    // px; 0 = sharp corners (terminal, newspaper)
};

const THEME_STYLES: Record<string, ThemeStyle> = {
    'terminal-dark': {
        fontFamily: "'Courier New', Courier, monospace",
        scanlines: true,
        cardRadius: 0,
    },

    'cream-office': {
        fontFamily: "Georgia, 'Times New Roman', serif",
    },
    'cream': {
        fontFamily: "Georgia, serif",
    },
    'neon-dark': {
        fontFamily: "system-ui, sans-serif",
        glow: true,
    },
    'glass-dark': {
        fontFamily: "system-ui, sans-serif",
        glassBlur: true,
        // Approximate the radial gradient background from index.css
        bodyBg: 'radial-gradient(ellipse at 20% 20%, #1a3a6e 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #2d1060 0%, transparent 60%), #0a0f1e',
    },
    'glass-light': {
        fontFamily: "system-ui, sans-serif",
        glassBlur: true,
        // Approximate the aurora gradient background from index.css
        bodyBg: 'radial-gradient(ellipse at 25% 15%, rgba(190,225,255,0.9) 0%, transparent 50%), radial-gradient(ellipse at 75% 80%, rgba(210,190,255,0.7) 0%, transparent 50%), #e8f4fd',
    },

};

const DEFAULT_STYLE: ThemeStyle = { fontFamily: "system-ui, -apple-system, sans-serif" };

// All swatches show identical text — only font, color, and effects differ per theme
const SWATCH_CONTENT = { title: 'Dashboard', body: 'Updated today', btn: '→ View' };

// ─── Theme entry types ───────────────────────────────────────────────────────

type ThemeEntry =
    | { value: Theme | null; label: string; isDayNight?: false; preview: ThemePreview }
    | { value: Theme | null; label: string; isDayNight: true;  preview: { day: ThemePreview; night: ThemePreview } };

type ThemeGroup = { label: string; themes: ThemeEntry[] };

const THEME_GROUPS: ThemeGroup[] = [
    {
        label: 'Auto',
        themes: [
            // Follows OS preference — split preview uses ocean colors to show both halves
            { value: null, label: 'Auto (OS)', isDayNight: true, preview: { day: CSS_PREVIEW['ocean-light'], night: CSS_PREVIEW['ocean-dark'] } },
        ],
    },
    {
        label: 'Standard — Dark',
        themes: [
            { value: 'ocean-dark',    label: 'Ocean',    preview: CSS_PREVIEW['ocean-dark']    },
            { value: 'forest-dark',   label: 'Forest',   preview: CSS_PREVIEW['forest-dark']   },
            { value: 'sunset-dark',   label: 'Sunset',   preview: CSS_PREVIEW['sunset-dark']   },
            { value: 'lavender-dark', label: 'Lavender', preview: CSS_PREVIEW['lavender-dark'] },
            { value: 'crimson-dark',  label: 'Crimson',  preview: CSS_PREVIEW['crimson-dark']  },
            { value: 'amber-dark',    label: 'Amber',    preview: CSS_PREVIEW['amber-dark']    },
            { value: 'midnight-dark', label: 'Midnight', preview: CSS_PREVIEW['midnight-dark'] },
        ],
    },
    {
        label: 'Standard — Light',
        themes: [
            { value: 'ocean-light',    label: 'Ocean',    preview: CSS_PREVIEW['ocean-light']    },
            { value: 'forest-light',   label: 'Forest',   preview: CSS_PREVIEW['forest-light']   },
            { value: 'sunset-light',   label: 'Sunset',   preview: CSS_PREVIEW['sunset-light']   },
            { value: 'lavender-light', label: 'Lavender', preview: CSS_PREVIEW['lavender-light'] },
            { value: 'crimson-light',  label: 'Crimson',  preview: CSS_PREVIEW['crimson-light']  },
            { value: 'amber-light',    label: 'Amber',    preview: CSS_PREVIEW['amber-light']    },
            { value: 'midnight-light', label: 'Midnight', preview: CSS_PREVIEW['midnight-light'] },
        ],
    },
    {
        label: 'Day / Night Cycle',
        themes: [
            // Each auto-switches between light (7am–8pm) and dark (8pm–7am)
            { value: 'ocean-dayNight',    label: 'Ocean',    isDayNight: true, preview: { day: CSS_PREVIEW['ocean-light'],    night: CSS_PREVIEW['ocean-dark']    } },
            { value: 'forest-dayNight',   label: 'Forest',   isDayNight: true, preview: { day: CSS_PREVIEW['forest-light'],   night: CSS_PREVIEW['forest-dark']   } },
            { value: 'sunset-dayNight',   label: 'Sunset',   isDayNight: true, preview: { day: CSS_PREVIEW['sunset-light'],   night: CSS_PREVIEW['sunset-dark']   } },
            { value: 'lavender-dayNight', label: 'Lavender', isDayNight: true, preview: { day: CSS_PREVIEW['lavender-light'], night: CSS_PREVIEW['lavender-dark'] } },
            { value: 'crimson-dayNight',  label: 'Crimson',  isDayNight: true, preview: { day: CSS_PREVIEW['crimson-light'],  night: CSS_PREVIEW['crimson-dark']  } },
            { value: 'amber-dayNight',    label: 'Amber',    isDayNight: true, preview: { day: CSS_PREVIEW['amber-light'],    night: CSS_PREVIEW['amber-dark']    } },
            { value: 'midnight-dayNight', label: 'Midnight', isDayNight: true, preview: { day: CSS_PREVIEW['midnight-light'], night: CSS_PREVIEW['midnight-dark'] } },
            { value: 'glass-dayNight',    label: 'Glass',    isDayNight: true, preview: { day: CSS_PREVIEW['glass-light'],    night: CSS_PREVIEW['glass-dark']    } },
        ],
    },
    {
        label: 'Special',
        themes: [
            { value: 'glass-dark',    label: 'Glass Dark',   preview: CSS_PREVIEW['glass-dark']    },
            { value: 'glass-light',   label: 'Glass Light',  preview: CSS_PREVIEW['glass-light']   },
            { value: 'terminal-dark', label: 'Terminal',     preview: CSS_PREVIEW['terminal-dark']  },
            { value: 'cream-office',  label: 'Cream Office', preview: CSS_PREVIEW['cream-office']  },

            { value: 'neon-dark',     label: 'Neon',         preview: CSS_PREVIEW['neon-dark']     },
            { value: 'cream',         label: 'Cream',        preview: CSS_PREVIEW['cream']         },
            { value: 'amoled',        label: 'Pure Black',   preview: CSS_PREVIEW['amoled']        },

        ],
    },
];

// ─── Preview components ──────────────────────────────────────────────────────

// Mini UI preview for a solid (single) theme — uses the theme's actual font,
// colors, and special effects (scanlines, glow, glass blur) at tiny scale.
function MiniUI({ value, p }: { value: Theme | null; p: ThemePreview }) {
    const s = THEME_STYLES[value as string] ?? DEFAULT_STYLE;
    const { title, body, btn } = SWATCH_CONTENT;

    const font = s.fontFamily;
    const isTerminal = value === 'terminal-dark';
    const radius = s.cardRadius ?? 3;

    return (
        <div
            className="h-full relative overflow-hidden"
            style={{ background: s.bodyBg ?? p.bg }}
        >
            {/* Tiny top navbar strip */}
            <div style={{
                background: p.surface,
                borderBottom: `1px solid ${p.primary}44`,
                padding: '3px 5px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                ...(s.glassBlur ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : {}),
            }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.primary, flexShrink: 0 }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.accent, flexShrink: 0 }} />
                <div style={{ flex: 1 }} />
                {/* Fake nav link pill */}
                <div style={{ width: 18, height: 3, borderRadius: 1, background: `${p.primary}55` }} />
            </div>

            {/* Card content */}
            <div style={{ padding: '4px 5px' }}>
                <div style={{
                    background: p.surface,
                    border: `1px solid ${p.primary}44`,
                    borderRadius: radius,
                    padding: '4px 5px',
                    ...(s.glassBlur ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : {}),
                }}>
                    {/* Title */}
                    <div style={{
                        color: isTerminal ? p.primary : p.text,
                        fontFamily: font,
                        fontSize: '8px',
                        fontWeight: 600,
                        textTransform: s.titleCase === 'uppercase' ? 'uppercase' : undefined,
                        textShadow: s.glow ? `0 0 6px ${p.primary}, 0 0 12px ${p.primary}66` : undefined,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}>
                        {title}
                    </div>
                    {/* Body text */}
                    <div style={{
                        color: isTerminal ? p.accent : p.text,
                        fontFamily: font,
                        fontSize: '6.5px',
                        opacity: isTerminal ? 0.85 : 0.65,
                        marginTop: '2px',
                        textShadow: s.glow ? `0 0 4px ${p.primary}99` : undefined,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}>
                        {body}
                    </div>
                    {/* Tiny action button */}
                    <div style={{
                        marginTop: '4px',
                        display: 'inline-block',
                        background: s.glow ? p.primary : `${p.primary}22`,
                        color: s.glow ? p.bg : p.primary,
                        border: `1px solid ${p.primary}${s.glow ? 'ee' : '66'}`,
                        borderRadius: radius === 0 ? 0 : (s.glow ? 2 : 3),
                        padding: '1px 4px',
                        fontSize: '6px',
                        fontFamily: font,
                        textShadow: s.glow ? `0 0 5px ${p.primary}` : undefined,
                        boxShadow: s.glow ? `0 0 8px ${p.primary}66` : undefined,
                        whiteSpace: 'nowrap',
                    }}>
                        {btn}
                    </div>
                </div>
            </div>

            {/* CRT scanline overlay — only on terminal-dark */}
            {s.scanlines && (
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                    zIndex: 10,
                }} />
            )}
        </div>
    );
}

// Split preview for day/night themes — night half on left, day half on right.
// Each half shows a tiny navbar + card so you can see both palettes at a glance.
function DayNightHalf({ p }: { p: ThemePreview }) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: p.bg }}>
            {/* Mini navbar */}
            <div style={{
                background: p.surface,
                borderBottom: `1px solid ${p.primary}44`,
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
            }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: p.primary, flexShrink: 0 }} />
            </div>
            {/* Mini card */}
            <div style={{ padding: '3px 4px', flex: 1 }}>
                <div style={{
                    background: p.surface,
                    border: `1px solid ${p.primary}44`,
                    borderRadius: 2,
                    padding: '3px 4px',
                    height: '100%',
                }}>
                    <div style={{ color: p.text, fontFamily: 'system-ui', fontSize: '7px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        Dash
                    </div>
                    <div style={{ color: p.primary, fontSize: '5.5px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                        ● Active
                    </div>
                </div>
            </div>
        </div>
    );
}

function DayNightPreview({ day, night }: { day: ThemePreview; night: ThemePreview }) {
    return (
        <div className="h-full flex relative overflow-hidden">
            <DayNightHalf p={night} />
            <DayNightHalf p={day} />
            {/* Diagonal divider between night and day halves */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to bottom right, transparent calc(50% - 0.5px), rgba(255,255,255,0.45) calc(50% - 0.5px), rgba(255,255,255,0.45) calc(50% + 0.5px), transparent calc(50% + 0.5px))',
            }} />
        </div>
    );
}

// ─── Swatch card ─────────────────────────────────────────────────────────────

function ThemeSwatchCard({ theme, isSelected, onClick }: {
    theme: ThemeEntry;
    isSelected: boolean;
    onClick: () => void;
}) {
    const isDN = theme.isDayNight === true;
    // Primary/bg used for the selection ring and the checkmark badge colors
    const primaryColor = isDN
        ? (theme.preview as { day: ThemePreview; night: ThemePreview }).day.primary
        : (theme.preview as ThemePreview).primary;
    const bgColor = isDN
        ? (theme.preview as { day: ThemePreview; night: ThemePreview }).night.bg
        : (theme.preview as ThemePreview).bg;

    return (
        <button
            onClick={onClick}
            aria-label={`Select ${theme.label} theme`}
            aria-pressed={isSelected}
            className="relative flex flex-col rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.04] focus-visible:outline-none"
            style={{
                outline: isSelected ? `2px solid ${primaryColor}` : '2px solid transparent',
                outlineOffset: '2px',
            }}
        >
            {/* Color preview area */}
            <div className="h-20">
                {isDN
                    ? <DayNightPreview
                        day={(theme.preview as { day: ThemePreview; night: ThemePreview }).day}
                        night={(theme.preview as { day: ThemePreview; night: ThemePreview }).night}
                      />
                    : <MiniUI value={theme.value} p={theme.preview as ThemePreview} />
                }
            </div>

            {/* Label — uses current app theme so it's always readable */}
            <div className="text-[11px] leading-tight px-1.5 py-1.5 text-center truncate bg-surface-raised text-text-muted">
                {theme.label}
            </div>

            {/* Checkmark badge on the selected swatch */}
            {isSelected && (
                <div
                    className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold leading-none"
                    style={{ background: primaryColor, color: bgColor }}
                >
                    ✓
                </div>
            )}
        </button>
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ThemePicker() {
    const dispatch = useDispatch<AppDispatch>();
    const { currentTheme } = useSelector((state: RootState) => state.theme);

    return (
        // a11y: group role + label so screen readers announce "Color theme" for the whole picker
        <div className="space-y-6" role="group" aria-label="Color theme">
            {THEME_GROUPS.map(group => (
                <section key={group.label}>
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                        {group.label}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {group.themes.map(theme => (
                            <ThemeSwatchCard
                                key={String(theme.value)}
                                theme={theme}
                                isSelected={currentTheme === theme.value}
                                onClick={() => dispatch(setCurrentTheme(theme.value))}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

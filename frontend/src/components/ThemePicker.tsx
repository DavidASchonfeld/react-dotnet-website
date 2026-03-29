// useState no longer needed — variant state is lifted to the parent (MySettingsPage)
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentTheme, type Theme } from '../store/themeSlice';
import type { AppDispatch, RootState } from '../store/store';
// ThemeFamily type, THEME_FAMILIES data, and getThemeDisplayName live here to satisfy fast-refresh (components-only exports rule)
import { type ThemeFamily, THEME_FAMILIES } from '../utils/themeDisplayName';

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
    'ocean-dark':     { bg: '#0f172a', surface: '#1e293b',                primary: '#3b82f6', accent: '#f59e0b', text: '#f1f5f9' },
    'ocean-light':    { bg: '#f8fafc', surface: '#d8e8ff',                primary: '#2563eb', accent: '#d97706', text: '#0f172a' },
    'forest-dark':    { bg: '#0d1a12', surface: '#1a2e1f',                primary: '#10b981', accent: '#f59e0b', text: '#ecfdf5' },
    'forest-light':   { bg: '#f0fdf4', surface: '#cce8d4',                primary: '#16a34a', accent: '#d97706', text: '#14532d' },
    'sunset-dark':    { bg: '#150600', surface: '#2a1000',                primary: '#f97316', accent: '#facc15', text: '#fff7ed' },
    'sunset-light':   { bg: '#fff7ed', surface: '#fcdfc4',                primary: '#ea580c', accent: '#ca8a04', text: '#7c2d12' },
    'lavender-dark':  { bg: '#0d0514', surface: '#1a0d28',                primary: '#a855f7', accent: '#f59e0b', text: '#faf5ff' },
    'lavender-light': { bg: '#faf5ff', surface: '#e8d0ff',                primary: '#9333ea', accent: '#d97706', text: '#3b0764' },
    'crimson-dark':   { bg: '#0f0506', surface: '#1f0a0d',                primary: '#f43f5e', accent: '#06b6d4', text: '#fff1f2' }, /* accent → cyan (complement of red) */
    'crimson-light':  { bg: '#fff1f2', surface: '#f5c8d0',                primary: '#e11d48', accent: '#0e7490', text: '#881337' }, /* accent → cyan-700 (complement of rose) */
    'amber-dark':     { bg: '#140c00', surface: '#211500',                primary: '#f59e0b', accent: '#84cc16', text: '#fffbeb' },
    'amber-light':    { bg: '#fffbeb', surface: '#fce6a8',                primary: '#d97706', accent: '#65a30d', text: '#78350f' },
    'midnight-dark':  { bg: '#06071a', surface: '#0f1033',                primary: '#6366f1', accent: '#f59e0b', text: '#eef2ff' },
    'midnight-light': { bg: '#eef2ff', surface: '#ccd2ff',                primary: '#4f46e5', accent: '#d97706', text: '#1e1b4b' },
    'azure-dark':     { bg: '#0a0f1e', surface: 'rgba(255,255,255,0.18)', primary: '#7eb8f7', accent: '#ffd166', text: '#e8eeff' },
    'azure-light':    { bg: '#e8f4fd', surface: 'rgba(190,225,255,0.82)', primary: '#6488c8', accent: '#5dc8b0', text: '#1e3a5a' },
    'terminal-dark':       { bg: '#000000', surface: '#0d0d0d', primary: '#33ff33', accent: '#ffaa00', text: '#33ff33' },
    'cream-office':        { bg: '#f0e8d0', surface: '#f4edd8', primary: '#8b1a1a', accent: '#8b6914', text: '#1a1a1a' },
    'cream-office-dark':   { bg: '#1a1008', surface: '#2a1c0e', primary: '#c04030', accent: '#c8a020', text: '#f0e0c0' },
    'neon-dark':           { bg: '#05050e', surface: '#0d0d22', primary: '#00eeff', accent: '#ff00ff', text: '#e8f0ff' },
    'cream':               { bg: '#fef9f0', surface: '#fff8eb', primary: '#c0622f', accent: '#8b7355', text: '#3d2b1f' },
    'cream-dark':          { bg: '#180c04', surface: '#281808', primary: '#d4733a', accent: '#a08060', text: '#f5e8c8' },
    'amoled':              { bg: '#000000', surface: '#111111', primary: '#60a5fa', accent: '#fbbf24', text: '#ffffff' },
    // Popular / Professional Palettes
    'nord-dark':         { bg: '#2E3440', surface: '#3B4252', primary: '#88C0D0', accent: '#EBCB8B', text: '#ECEFF4' },
    'nord-light':        { bg: '#E5E9F0', surface: '#ECEFF4', primary: '#5E81AC', accent: '#D08770', text: '#2E3440' },
    'teal-dark':         { bg: '#081A1A', surface: '#0F2828', primary: '#2DD4BF', accent: '#34D399', text: '#C8E6E6' },
    'teal-light':        { bg: '#145454', surface: '#1A6464', primary: '#5EEAD4', accent: '#6EE7B7', text: '#EEFAFA' },
    'monochrome-dark':   { bg: '#0a0a0a', surface: '#1a1a1a', primary: '#e0e0e0', accent: '#888888', text: '#f0f0f0' },
    'monochrome-light':  { bg: '#f5f5f5', surface: '#cccccc', primary: '#171717', accent: '#525252', text: '#171717' },
};

// ─── Theme-specific rendering characteristics ────────────────────────────────

type ThemeStyle = {
    fontFamily: string;
    scanlines?: boolean;
    glow?: boolean;
    glassBlur?: boolean;
    bodyBg?: string;
    titleCase?: 'uppercase';
    cardRadius?: number;
};

const THEME_STYLES: Record<string, ThemeStyle> = {
    'terminal-dark': { fontFamily: "'Courier New', Courier, monospace", scanlines: true, cardRadius: 0 },
    'cream-office':      { fontFamily: "Georgia, 'Times New Roman', serif" },
    'cream-office-dark': { fontFamily: "Georgia, 'Times New Roman', serif" },
    'cream':             { fontFamily: "Georgia, serif" },
    'cream-dark':        { fontFamily: "Georgia, serif" },
    'neon-dark':     { fontFamily: "system-ui, sans-serif", glow: true },
    'azure-dark':    {
        fontFamily: "system-ui, sans-serif",
        glassBlur: true,
        bodyBg: 'radial-gradient(ellipse at 20% 20%, #1a3a6e 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #0d4a5e 0%, transparent 60%), #0a0f1e',
    },
    'azure-light':   {
        fontFamily: "system-ui, sans-serif",
        glassBlur: true,
        bodyBg: 'radial-gradient(ellipse at 25% 15%, rgba(190,225,255,0.9) 0%, transparent 50%), radial-gradient(ellipse at 75% 80%, rgba(180,235,235,0.7) 0%, transparent 50%), #e8f4fd',
    },
};

const DEFAULT_STYLE: ThemeStyle = { fontFamily: "system-ui, -apple-system, sans-serif" };

// All swatches show identical text — only font, color, and effects differ per theme
const SWATCH_CONTENT = { title: 'Dashboard', body: 'Updated today', btn: '→ View' };

// ─── Color sort helper ───────────────────────────────────────────────────────

// Returns the HSL hue (0–360) of a #rrggbb hex color, used for palette sorting
function hexToHue(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return 0;
    let h: number;
    if (max === r)      h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else                h = (r - g) / d + 4;
    return h * 60;
}

// ─── Theme families (Dark / Light / Day/Night variants) ──────────────────────

// ThemeFamily type and THEME_FAMILIES data are imported from utils/themeDisplayName
// Exported so MySettingsPage can use it for the inline variant buttons
export type Variant = 'dark' | 'light' | 'dayNight';

// ─── Standalone themes ───────────────────────────────────────────────────────

type StandaloneEntry =
    | { value: Theme | null; label: string; isDayNight?: false; preview: ThemePreview }
    | { value: Theme | null; label: string; isDayNight: true;  preview: { day: ThemePreview; night: ThemePreview } };

const STANDALONE_ENTRIES: StandaloneEntry[] = [
    { value: null,            label: 'Tailwind Default', isDayNight: true, preview: { day: CSS_PREVIEW['ocean-light'], night: CSS_PREVIEW['ocean-dark'] } },
    { value: 'terminal-dark', label: 'Terminal',  preview: CSS_PREVIEW['terminal-dark'] },
    { value: 'neon-dark',     label: 'Neon',      preview: CSS_PREVIEW['neon-dark']     },
    { value: 'amoled',        label: 'Pure Black', preview: CSS_PREVIEW['amoled']       },
];

// ─── Unified sorted item list ────────────────────────────────────────────────

// Sort hue for each standalone entry (day/night entries use the night half's primary)
function standaloneHue(entry: StandaloneEntry): number {
    if (entry.isDayNight) {
        return hexToHue((entry.preview as { day: ThemePreview; night: ThemePreview }).night.primary);
    }
    return hexToHue((entry.preview as ThemePreview).primary);
}

type AnyItem =
    | { kind: 'family';     family: ThemeFamily;    sortHue: number }
    | { kind: 'standalone'; entry: StandaloneEntry; sortHue: number };

// Build once at module level — sort all items together by hue for a palette-like order
const ALL_ITEMS: AnyItem[] = [
    ...THEME_FAMILIES.map(family => ({
        kind: 'family'  as const,
        family,
        sortHue: hexToHue(CSS_PREVIEW[family.dark].primary),
    })),
    ...STANDALONE_ENTRIES.map(entry => ({
        kind: 'standalone' as const,
        entry,
        sortHue: standaloneHue(entry),
    })),
].sort((a, b) => a.sortHue - b.sortHue);

// ─── Preview components ──────────────────────────────────────────────────────

function MiniUI({ value, p }: { value: Theme | null; p: ThemePreview }) {
    const s = THEME_STYLES[value as string] ?? DEFAULT_STYLE;
    const { title, body, btn } = SWATCH_CONTENT;
    const font       = s.fontFamily;
    const isTerminal = value === 'terminal-dark';
    const radius     = s.cardRadius ?? 3;

    return (
        <div className="h-full relative overflow-hidden" style={{ background: s.bodyBg ?? p.bg }}>
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
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.accent,  flexShrink: 0 }} />
                <div style={{ flex: 1 }} />
                <div style={{ width: 18, height: 3, borderRadius: 1, background: `${p.primary}55` }} />
            </div>
            <div style={{ padding: '4px 5px' }}>
                <div style={{
                    background: p.surface,
                    border: `1px solid ${p.primary}44`,
                    borderRadius: radius,
                    padding: '4px 5px',
                    ...(s.glassBlur ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : {}),
                }}>
                    <div style={{
                        color: isTerminal ? p.primary : p.text,
                        fontFamily: font, fontSize: '8px', fontWeight: 600,
                        textTransform: s.titleCase === 'uppercase' ? 'uppercase' : undefined,
                        textShadow: s.glow ? `0 0 6px ${p.primary}, 0 0 12px ${p.primary}66` : undefined,
                        lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden',
                    }}>
                        {title}
                    </div>
                    <div style={{
                        color: isTerminal ? p.accent : p.text,
                        fontFamily: font, fontSize: '6.5px',
                        opacity: isTerminal ? 0.85 : 0.65, marginTop: '2px',
                        textShadow: s.glow ? `0 0 4px ${p.primary}99` : undefined,
                        whiteSpace: 'nowrap', overflow: 'hidden',
                    }}>
                        {body}
                    </div>
                    <div style={{
                        marginTop: '4px', display: 'inline-block',
                        background: s.glow ? p.primary : `${p.primary}22`,
                        color: s.glow ? p.bg : p.primary,
                        border: `1px solid ${p.primary}${s.glow ? 'ee' : '66'}`,
                        borderRadius: radius === 0 ? 0 : (s.glow ? 2 : 3),
                        padding: '1px 4px', fontSize: '6px', fontFamily: font,
                        textShadow: s.glow ? `0 0 5px ${p.primary}` : undefined,
                        boxShadow:  s.glow ? `0 0 8px ${p.primary}66` : undefined,
                        whiteSpace: 'nowrap',
                    }}>
                        {btn}
                    </div>
                </div>
            </div>
            {s.scanlines && (
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                    zIndex: 10,
                }} />
            )}
        </div>
    );
}

function DayNightHalf({ p }: { p: ThemePreview }) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: p.bg }}>
            <div style={{
                background: p.surface, borderBottom: `1px solid ${p.primary}44`,
                padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '2px',
            }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: p.primary, flexShrink: 0 }} />
            </div>
            <div style={{ padding: '3px 4px', flex: 1 }}>
                <div style={{
                    background: p.surface, border: `1px solid ${p.primary}44`,
                    borderRadius: 2, padding: '3px 4px', height: '100%',
                }}>
                    <div style={{ color: p.text, fontFamily: 'system-ui', fontSize: '7px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        Dashboard
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
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to bottom right, transparent calc(50% - 0.5px), rgba(255,255,255,0.45) calc(50% - 0.5px), rgba(255,255,255,0.45) calc(50% + 0.5px), transparent calc(50% + 0.5px))',
            }} />
        </div>
    );
}

// ─── Family swatch card ──────────────────────────────────────────────────────

// Renders a single family card; variant is controlled by the page-level toggle
function FamilySwatchCard({ family, currentTheme, activeVariant, onSelect }: {
    family: ThemeFamily;
    currentTheme: Theme | null;
    activeVariant: Variant;
    onSelect: (theme: Theme) => void;
}) {
    // Card is "selected" if any variant of this family is the active theme
    const isSelected =
        currentTheme === family.dark ||
        currentTheme === family.light ||
        currentTheme === family.dayNight;

    const darkP  = CSS_PREVIEW[family.dark];
    const lightP = CSS_PREVIEW[family.light];
    const ringPrimary = activeVariant === 'light' ? lightP.primary : darkP.primary;
    const ringBg      = activeVariant === 'light' ? lightP.bg      : darkP.bg;

    return (
        <button
            className="relative flex flex-col rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.04] focus-visible:outline-none text-left w-full"
            style={{ outline: isSelected ? `2px solid ${ringPrimary}` : '2px solid transparent', outlineOffset: '2px' }}
            onClick={() => onSelect(family[activeVariant] as Theme)}
            aria-label={`Select ${family.name} theme`}
            aria-pressed={isSelected}
        >
            <div className="h-20">
                {activeVariant === 'dayNight'
                    ? <DayNightPreview day={lightP} night={darkP} />
                    : <MiniUI
                        value={(activeVariant === 'dark' ? family.dark : family.light) as Theme}
                        p={activeVariant === 'dark' ? darkP : lightP}
                      />
                }
            </div>
            <div className="text-[11px] leading-tight px-1.5 py-1.5 text-center bg-surface-raised text-text-muted">
                {family.name}
            </div>
            {isSelected && (
                <div
                    className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold leading-none"
                    style={{ background: ringPrimary, color: ringBg }}
                >
                    ✓
                </div>
            )}
        </button>
    );
}

// ─── No-variant badge ────────────────────────────────────────────────────────

// Shown on standalone cards that have no Dark / Light / Day-Night variant
function NoVariantBadge() {
    return (
        <div
            className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center"
            title="No Dark / Light / Day-Night variant"
            aria-label="No variant"
        >
            {/* Red circle border */}
            <div style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                border: '1.5px solid #ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
                fontSize: '9px',
            }}>
                🌓
                {/* Diagonal restriction line */}
                <div style={{
                    position: 'absolute',
                    width: '130%',
                    height: '1.5px',
                    background: '#ef4444',
                    transform: 'rotate(-45deg)',
                    pointerEvents: 'none',
                }} />
            </div>
        </div>
    );
}

// ─── Standalone swatch card ──────────────────────────────────────────────────

function StandaloneSwatchCard({ entry, isSelected, onClick }: {
    entry: StandaloneEntry;
    isSelected: boolean;
    onClick: () => void;
}) {
    const isDN = entry.isDayNight === true;
    const primaryColor = isDN
        ? (entry.preview as { day: ThemePreview; night: ThemePreview }).day.primary
        : (entry.preview as ThemePreview).primary;
    const bgColor = isDN
        ? (entry.preview as { day: ThemePreview; night: ThemePreview }).night.bg
        : (entry.preview as ThemePreview).bg;

    return (
        <button
            onClick={onClick}
            aria-label={`Select ${entry.label} theme`}
            aria-pressed={isSelected}
            className="relative flex flex-col rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.04] focus-visible:outline-none"
            style={{ outline: isSelected ? `2px solid ${primaryColor}` : '2px solid transparent', outlineOffset: '2px' }}
        >
            <div className="h-20">
                {isDN
                    ? <DayNightPreview
                        day={(entry.preview as { day: ThemePreview; night: ThemePreview }).day}
                        night={(entry.preview as { day: ThemePreview; night: ThemePreview }).night}
                      />
                    : <MiniUI value={entry.value} p={entry.preview as ThemePreview} />
                }
            </div>
            <div className="text-[11px] leading-tight px-1.5 py-1.5 text-center truncate bg-surface-raised text-text-muted">
                {entry.label}
            </div>
            {/* Badge: no-variant warning, or day/night indicator for always-adaptive standalones */}
            {!isDN && <NoVariantBadge />}
            {isDN && (
                <div
                    className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center text-[11px]"
                    title="Automatically switches between light and dark based on time of day"
                    aria-label="Day/Night theme"
                >
                    🌓
                </div>
            )}
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

// Exported so MySettingsPage can initialize its activeVariant state from the active theme
export function inferVariant(theme: Theme | null): Variant {
    if (!theme) return 'dayNight';
    if (theme.endsWith('-dayNight')) return 'dayNight';
    if (theme.endsWith('-light'))    return 'light';
    if (theme.endsWith('-dark'))     return 'dark';
    return 'dayNight'; // standalone themes have no variant — default to Day/Night
}

// ThemePicker accepts activeVariant from the parent so the row's inline variant buttons and the palette stay in sync
export function ThemePicker({ activeVariant }: {
    activeVariant: Variant;
}) {
    const dispatch = useDispatch<AppDispatch>();
    const { currentTheme } = useSelector((state: RootState) => state.theme);

    return (
        <div className="flex flex-col gap-4">
            {/* Day/Night note — variant buttons moved to the settings row above */}
            <p className="text-xs text-text-muted">🌓 Day/Night: Switches between light and dark based on time of day.</p>

            {/* Single flat grid — all items sorted by primary-color hue (red → orange → yellow → green → cyan → blue → purple → crimson) */}
            <div
                className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2"
                role="group"
                aria-label="Color theme"
            >
                {ALL_ITEMS.map(item =>
                    item.kind === 'family'
                        ? <FamilySwatchCard
                            key={item.family.name}
                            family={item.family}
                            currentTheme={currentTheme}
                            activeVariant={activeVariant}
                            onSelect={(theme) => dispatch(setCurrentTheme(theme))}
                          />
                        : <StandaloneSwatchCard
                            key={String(item.entry.value)}
                            entry={item.entry}
                            isSelected={currentTheme === item.entry.value}
                            onClick={() => dispatch(setCurrentTheme(item.entry.value))}
                          />
                )}
            </div>
        </div>
    );
}

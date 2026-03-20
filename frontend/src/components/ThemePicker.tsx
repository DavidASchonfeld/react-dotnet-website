import { useDispatch, useSelector } from 'react-redux';
import { setCurrentTheme, type Theme } from '../store/themeSlice'
import type { AppDispatch, RootState } from '../store/store';

const THEMES: { value: Theme | null; label: string }[] = [
    // Built-in with Tailwind
    { value: null, label: 'Auto (OS)'},

    // Defined in frontend/src/index.css
    { value: 'ocean-dark', label: 'Ocean Dark'},
    { value: 'ocean-light', label: 'Ocean Light'},
    { value: 'forest-dark', label: 'Forest Dark'},
    { value: 'forest-light', label: 'Forest Light'},

    // JavaScript-Affected
    //    The JavaScript logic is in App.tsx, since that is where themes are loaded.
    //// Day-Night Cycle: Switches between 2 CSS themes above,
    ////    depending on time of day. Day = 7am-8pm, as defined in App.tsx
    { value: 'ocean-dayNight', label: 'Ocean (Day/Night)'},
    { value: 'forest-dayNight', label: 'Forest (Day/Night)'},
];

export function ThemePicker() {
    const dispatch = useDispatch<AppDispatch>();
    const { currentTheme } = useSelector((state: RootState) => state.theme);

    return (
        <select
            value = {currentTheme ?? ''}
            onChange = {e => dispatch(setCurrentTheme((e.target.value || null) as Theme | null))}
            className = "bg-surface text-text border-border rounded px-2 py-1 text-sm"
        >
                {THEMES.map(t => (
                    <option key = {t.label} value= {t.value ?? ''}>
                        {t.label}
                    </option>
                ))}
        </select>
    );
}
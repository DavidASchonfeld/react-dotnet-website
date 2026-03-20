import { useDispatch, useSelector } from 'react-redux';
import { setCurrentTheme, type Theme } from '../store/themeSlice'
import type { AppDispatch, RootState } from '../store/store';

const THEMES: { value: Theme | null; label: string }[] = [
    { value: null, label: 'Auto (OS)'},
    { value: 'ocean-dark', label: 'Ocean Dark'},
    { value: 'ocean-light', label: 'Ocean Light'},
    { value: 'forest-dark', label: 'Forest Dark'},
    { value: 'forest-light', label: 'Forest Light'},
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
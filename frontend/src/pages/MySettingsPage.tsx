import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AnimatedPage from '../components/AnimatedPage';
import type { AppDispatch, RootState } from '../store/store';
import { setUserName } from '../store/authSlice';
import { useUpdateUsernameMutation, useUpdatePasswordMutation, useGetAppearanceDefaultsQuery } from '../services/apiSlice';
import { setCurrentModifier, setCurrentTheme, type Theme, type ThemeModifier } from '../store/themeSlice';
import { safeToast } from '../utils/safeToast';
import { ThemePicker, type Variant, inferVariant } from '../components/ThemePicker';
import { THEME_FAMILIES, getThemeDisplayName } from '../utils/themeDisplayName'; // THEME_FAMILIES: family lookup in handleVariantChange; getThemeDisplayName: current theme label in the Theme row


// ---- Settings Section Card ----
// Wraps a group of related settings rows in a labeled card.

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 bg-surface border-b border-border">
                <h2 className="font-semibold text-sm uppercase tracking-wide text-text-muted">{title}</h2>
            </div>
            <div className="divide-y divide-border">
                {children}
            </div>
        </div>
    );
}


// ---- Settings Row ----
// A single setting: label + description on the left, control on the right.
// Optionally renders an expanded inline form below when `expanded` is true.

function SettingsRow({
    label,
    description,
    middleContent,
    control,
    expandedForm,
}: {
    label: string;
    description?: string;
    middleContent?: React.ReactNode;
    control: React.ReactNode;
    expandedForm?: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
                </div>
                {/* Optional centered content between label and control */}
                {middleContent && <div className="flex-1 text-center">{middleContent}</div>}
                <div className="shrink-0">{control}</div>
            </div>
            {/* a11y: aria-live announces the form to screen readers when it appears, supplementing aria-expanded */}
            <div aria-live="polite">
                {expandedForm && (
                    <div className="px-5 pb-4">
                        {expandedForm}
                    </div>
                )}
            </div>
        </div>
    );
}


// ---- Change Username Form ----

function ChangeUsernameForm({ currentUserName, onClose }: { currentUserName: string; onClose: () => void }) {
    const dispatch = useDispatch<AppDispatch>();
    const [updateUsername, { isLoading }] = useUpdateUsernameMutation();
    const [newUserName, setNewUserName] = useState(currentUserName);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (newUserName.trim() === currentUserName) { onClose(); return; }
        try {
            const result = await updateUsername(newUserName.trim()).unwrap();
            dispatch(setUserName(result));  // sync new username into Redux state
            safeToast.success('Username updated');
            onClose();
        } catch (err: unknown) {
            const msg = (err as { data?: string })?.data;
            setError(typeof msg === 'string' ? msg : 'Failed to update username.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" aria-label="Change username">
            {/* a11y: sr-only label associated via htmlFor so screen readers name this field */}
            <label htmlFor="settings-new-username" className="sr-only">New username</label>
            <input
                id="settings-new-username"
                className="form-input"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="New username"
                maxLength={100}
                autoFocus
                // a11y: aria-required signals this field must be filled before saving
                aria-required="true"
                // a11y: aria-describedby links this input to the error message so it is read together
                aria-describedby={error ? 'username-error' : undefined}
            />
            {/* a11y: role="alert" causes screen readers to announce the error immediately when it appears */}
            {error && <p id="username-error" role="alert" className="text-xs text-red-500">{error}</p>}
            {/* flex-wrap lets buttons stack on narrow mobile screens */}
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={isLoading || !newUserName.trim()} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                    Save
                </button>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                    Cancel
                </button>
            </div>
        </form>
    );
}


// ---- Change Password Form ----

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
    const [updatePassword, { isLoading }] = useUpdatePasswordMutation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
        if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
        try {
            await updatePassword({ currentPassword, newPassword }).unwrap();
            safeToast.success('Password changed successfully');
            onClose();
        } catch (err: unknown) {
            const msg = (err as { data?: string })?.data;
            setError(typeof msg === 'string' ? msg : 'Failed to change password.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" aria-label="Change password">
            {/* a11y: sr-only labels for each password field so screen readers distinguish them */}
            <label htmlFor="settings-current-password" className="sr-only">Current password</label>
            <input
                id="settings-current-password"
                className="form-input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                autoFocus
                aria-required="true"
                // a11y: aria-describedby links to error message so it is announced together with the field
                aria-describedby={error ? 'password-error' : undefined}
            />
            <label htmlFor="settings-new-password" className="sr-only">New password</label>
            <input
                id="settings-new-password"
                className="form-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                aria-required="true"
                aria-describedby={error ? 'password-error' : undefined}
            />
            <label htmlFor="settings-confirm-password" className="sr-only">Confirm new password</label>
            <input
                id="settings-confirm-password"
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                aria-required="true"
                aria-describedby={error ? 'password-error' : undefined}
            />
            {/* a11y: role="alert" causes screen readers to announce the error immediately when it appears */}
            {error && <p id="password-error" role="alert" className="text-xs text-red-500">{error}</p>}
            {/* flex-wrap lets buttons stack on narrow mobile screens */}
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={isLoading || !currentPassword || !newPassword} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                    Change Password
                </button>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                    Cancel
                </button>
            </div>
        </form>
    );
}


// ---- Circle Option Row ----
// A settings row with 3 circular icon-buttons on the left (one active at a time) and a
// description of the currently selected option on the right. Mirrors the variant-selector
// style from ThemePicker.

type CircleOption = {
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
};

function CircleOptionRow({
    options,
    activeLabel,
    activeDescription,
    ariaLabel,
}: {
    options: CircleOption[];
    activeLabel: string;
    activeDescription?: string;
    ariaLabel: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-4">
            {/* Circular selector buttons */}
            <div className="flex gap-4" role="group" aria-label={ariaLabel}>
                {options.map(({ icon, label, isActive, onClick }) => (
                    <button
                        key={label}
                        onClick={onClick}
                        aria-label={label}
                        aria-pressed={isActive}
                        className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all group-hover:scale-110"
                            style={{
                                background:    isActive ? 'var(--color-primary)' : 'transparent',
                                outline:       isActive ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                                outlineOffset: '2px',
                            }}
                        >
                            {icon}
                        </div>
                        <span className="text-xs text-text-muted">{label}</span>
                    </button>
                ))}
            </div>
            {/* Description of the currently selected option */}
            <div className="text-right shrink-0">
                <p className="font-medium text-sm">{activeLabel}</p>
                {activeDescription && <p className="text-xs text-text-muted mt-0.5">{activeDescription}</p>}
            </div>
        </div>
    );
}


// ---- Main Page ----

export default function MySettingsPage() {
    const dispatch = useDispatch<AppDispatch>();
    const userName = useSelector((state: RootState) => state.auth.userName);
    const currentTheme = useSelector((state: RootState) => state.theme.currentTheme);
    const currentModifier = useSelector((state: RootState) => state.theme.currentModifier);

    // Track which inline form/picker is open ('username' | 'password' | 'theme' | null)
    const [openForm, setOpenForm] = useState<'username' | 'password' | 'theme' | null>(null);

    const toggle = (form: 'username' | 'password' | 'theme') =>
        setOpenForm(prev => (prev === form ? null : form));

    // Active theme variant (Dark / Day/Night / Light) — initialized from the persisted theme
    const [activeVariant, setActiveVariant] = useState<Variant>(() => inferVariant(currentTheme));

    // Fetch app-wide defaults (cached by RTK Query after the first call in App.tsx).
    const { data: appearanceDefaults } = useGetAppearanceDefaultsQuery();

    // Resets theme + modifier to the app defaults; listener middleware auto-syncs to backend if logged in.
    function handleResetToDefault() {
        if (!appearanceDefaults) return;
        dispatch(setCurrentTheme(appearanceDefaults.theme as Theme));
        dispatch(setCurrentModifier(appearanceDefaults.modifier as ThemeModifier));
        setActiveVariant('dayNight');  // keep variant row in sync with the default (teal-dayNight)
    }

    // Switch variant: update local state + apply to the active family theme if one is selected
    function handleVariantChange(v: Variant) {
        setActiveVariant(v);
        if (currentTheme) {
            const family = THEME_FAMILIES.find(f =>
                currentTheme === f.dark || currentTheme === f.light || currentTheme === f.dayNight
            );
            if (family) dispatch(setCurrentTheme(family[v] as Theme)); // ThemeFamily values are always valid Theme strings
        }
    }

    return (
        <AnimatedPage>
            <div className="page flex flex-col gap-6">
                <h1 className="h1-styling">Settings</h1>

                {/* Account section */}
                <SettingsSection title="Account">
                    <SettingsRow
                        label="Username"
                        description={userName ?? undefined}
                        control={
                            <button
                                className="btn btn-secondary text-sm"
                                onClick={() => toggle('username')}
                                // a11y: aria-expanded tells screen readers whether the username form is currently shown
                                aria-expanded={openForm === 'username'}
                                // a11y: aria-label adds context so screen readers announce "Edit username" not just "Edit"
                                aria-label={openForm === 'username' ? 'Cancel editing username' : 'Edit username'}
                            >
                                {openForm === 'username' ? 'Cancel' : 'Edit'}
                            </button>
                        }
                        expandedForm={
                            openForm === 'username'
                                ? <ChangeUsernameForm
                                    currentUserName={userName ?? ''}
                                    onClose={() => setOpenForm(null)}
                                  />
                                : undefined
                        }
                    />
                    <SettingsRow
                        label="Password"
                        description="Change your account password"
                        control={
                            <button
                                className="btn btn-secondary text-sm"
                                onClick={() => toggle('password')}
                                // a11y: aria-expanded tells screen readers whether the password form is currently shown
                                aria-expanded={openForm === 'password'}
                                // a11y: aria-label adds context so screen readers announce "Edit password" not just "Edit"
                                aria-label={openForm === 'password' ? 'Cancel editing password' : 'Edit password'}
                            >
                                {openForm === 'password' ? 'Cancel' : 'Edit'}
                            </button>
                        }
                        expandedForm={
                            openForm === 'password'
                                ? <ChangePasswordForm onClose={() => setOpenForm(null)} />
                                : undefined
                        }
                    />
                </SettingsSection>

                {/* Appearance section */}
                <SettingsSection title="Appearance">

                    {/* Theme row — expand/collapse the full color-palette picker */}
                    <SettingsRow
                        label="Theme"
                        description="Choose your color theme"
                        middleContent={<span className="text-sm font-medium">{getThemeDisplayName(currentTheme)}</span>}
                        control={
                            <button
                                className="btn btn-secondary text-sm"
                                onClick={() => toggle('theme')}
                                // a11y: aria-expanded tells screen readers whether the theme picker is currently shown
                                aria-expanded={openForm === 'theme'}
                                // a11y: aria-label adds context so screen readers announce "Change theme" not just "Change"
                                aria-label={openForm === 'theme' ? 'Close theme picker' : 'Change theme'}
                            >
                                {openForm === 'theme' ? 'Close' : 'Change'}
                            </button>
                        }
                        expandedForm={openForm === 'theme'
                            ? <ThemePicker activeVariant={activeVariant} />
                            : undefined}
                    />

                    {/* Style modifier row — 🪟 Glass / 🔲 Bordered / 🚫 Standard */}
                    <CircleOptionRow
                        ariaLabel="Style modifier"
                        options={[
                            {
                                icon: '🪟',
                                label: 'Glass',
                                isActive: currentModifier === 'glass',
                                onClick: () => dispatch(setCurrentModifier('glass')),
                            },
                            {
                                icon: '🔲',
                                label: 'Bordered',
                                isActive: currentModifier === 'bordered',
                                onClick: () => dispatch(setCurrentModifier('bordered')),
                            },
                            {
                                icon: '🚫',
                                label: 'Standard',
                                isActive: currentModifier === null,
                                onClick: () => dispatch(setCurrentModifier(null)),
                            },
                        ]}
                        activeLabel={
                            currentModifier === 'glass'    ? 'Glass Mode'    :
                            currentModifier === 'bordered' ? 'Bordered Mode' :
                            'Standard'
                        }
                        activeDescription={
                            currentModifier === 'glass'    ? 'Frosted glass surfaces'   :
                            currentModifier === 'bordered' ? 'Bold borders, no shadows' :
                            'No modifier applied'
                        }
                    />

                    {/* Variant row — 🌙 Dark / 🌓 Day/Night / ☀️ Light */}
                    <CircleOptionRow
                        ariaLabel="Theme variant"
                        options={[
                            {
                                icon: '🌙',
                                label: 'Dark',
                                isActive: activeVariant === 'dark',
                                onClick: () => handleVariantChange('dark'),
                            },
                            {
                                icon: '🌓',
                                label: 'Day/Night',
                                isActive: activeVariant === 'dayNight',
                                onClick: () => handleVariantChange('dayNight'),
                            },
                            {
                                icon: '☀️',
                                label: 'Light',
                                isActive: activeVariant === 'light',
                                onClick: () => handleVariantChange('light'),
                            },
                        ]}
                        activeLabel={
                            activeVariant === 'dark'     ? 'Dark'      :
                            activeVariant === 'light'    ? 'Light'     : 'Day / Night'
                        }
                        activeDescription={activeVariant === 'dayNight' ? 'Auto-switches based on time of day' : undefined}
                    />

                    {/* Reset button — restores theme, modifier, and variant to app defaults */}
                    <div className="flex justify-end px-5 py-3">
                        <button
                            className="btn btn-secondary text-sm"
                            onClick={handleResetToDefault}
                            aria-label="Reset appearance to default settings"
                        >
                            Set Appearance to Default
                        </button>
                    </div>

                </SettingsSection>
            </div>
        </AnimatedPage>
    );
}

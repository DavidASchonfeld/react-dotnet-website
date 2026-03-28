import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AnimatedPage from '../components/AnimatedPage';
import type { AppDispatch, RootState } from '../store/store';
import { setUserName } from '../store/authSlice';
import { useUpdateUsernameMutation, useUpdatePasswordMutation } from '../services/apiSlice';
import { safeToast } from '../utils/safeToast';


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
    control,
    expandedForm,
}: {
    label: string;
    description?: string;
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
                <div className="shrink-0">{control}</div>
            </div>
            {/* Inline expanded form, shown when user clicks Edit */}
            {expandedForm && (
                <div className="px-5 pb-4">
                    {expandedForm}
                </div>
            )}
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
                className="form-input"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="New username"
                maxLength={100}
                autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
                className="form-input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                autoFocus
            />
            <input
                className="form-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
            />
            <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
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


// ---- Main Page ----

export default function MySettingsPage() {
    const navigate = useNavigate();
    const userName = useSelector((state: RootState) => state.auth.userName);
    const currentTheme = useSelector((state: RootState) => state.theme.currentTheme);

    // Track which inline form is open ('username' | 'password' | null)
    const [openForm, setOpenForm] = useState<'username' | 'password' | null>(null);

    const toggle = (form: 'username' | 'password') =>
        setOpenForm(prev => (prev === form ? null : form));

    // Format the theme name for display (e.g. "ocean-dayNight" → "Ocean Day/Night")
    const displayTheme = currentTheme
        ? currentTheme.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace('Daynight', 'Day/Night')
        : 'Default';

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
                    <SettingsRow
                        label="Theme"
                        description={displayTheme}
                        control={
                            <button
                                className="btn btn-secondary text-sm"
                                onClick={() => navigate('/my-settings/theme')}
                            >
                                Change
                            </button>
                        }
                    />
                </SettingsSection>
            </div>
        </AnimatedPage>
    );
}

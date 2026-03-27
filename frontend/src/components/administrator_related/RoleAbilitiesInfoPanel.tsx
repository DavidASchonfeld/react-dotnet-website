import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import RoleBadge from './RoleBadge';

// Info panel explaining elevated role abilities to moderators and administrators
export function RoleAbilitiesInfoPanel() {
    const { roleLevel } = useSelector((state: RootState) => state.auth);

    const isMod = roleLevel === 'Moderator' || roleLevel === 'Administrator';
    const isAdmin = roleLevel === 'Administrator';

    if (!isMod) return null;

    return (
        <div className="my-4 rounded-xl border border-border p-4 bg-surface">
            {/* Abilities shared by moderators and administrators */}
            <div className="flex items-center gap-2 mb-3">
                <RoleBadge role={roleLevel as 'Administrator' | 'Moderator'} />
                <p className="text-sm font-semibold text-text">Your Abilities</p>
            </div>
            <ul className="text-sm text-text/70 space-y-1 list-disc list-inside">
                <li>Create public MediaLists and tags (basic users cannot)</li>
                <li>Make your own MediaLists and tags public (basic users cannot)</li>
            </ul>

            {/* Abilities exclusive to administrators */}
            {isAdmin && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                        <RoleBadge role="Administrator" />
                        <p className="text-sm font-semibold text-text">Administrator-Only Abilities</p>
                    </div>
                    <ul className="text-sm text-text/70 space-y-1 list-disc list-inside">
                        <li>Add or remove items from any public list or tag, even if you are not the owner</li>
                        <li>Delete any public MediaList or tag, even if you are not the owner</li>
                        <li>Set any public MediaList or tag to private, even if you are not the owner</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

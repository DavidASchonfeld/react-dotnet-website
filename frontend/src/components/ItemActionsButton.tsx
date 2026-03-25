import { useState, type ReactNode } from 'react';
import ItemSettingsDrawerModal, { SettingsRow } from './modals/ItemSettingsDrawerModal';
import type { MenuAction } from '../utils/menuActions';

interface Props {
    preview?: ReactNode;
    buttonClassName?: string;
    onMenuClick: MenuAction[];
}

export default function ItemActionsButton({ preview, buttonClassName, onMenuClick }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                className={buttonClassName ?? 'self-center shrink-0 px-2 py-1 text-text/60 hover:text-text leading-none'}
                onClick={e => { e.stopPropagation(); setOpen(true); }}
            >
                {onMenuClick.length === 1 ? onMenuClick[0].icon : '...'}
            </button>
            <ItemSettingsDrawerModal open={open} onClose={() => setOpen(false)} preview={preview}>
                {close => <>{onMenuClick.map(action => (
                    <SettingsRow
                        key={action.label}
                        icon={action.icon}
                        label={action.label}
                        onClick={() => { action.onClick(); close(); }}
                    />
                ))}</>}
            </ItemSettingsDrawerModal>
        </>
    );
}

export { SettingsRow };

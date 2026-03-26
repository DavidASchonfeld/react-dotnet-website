import { useState, type ReactNode } from 'react';
import ItemSettingsDrawerModal, { SettingsRow } from '../modals/ItemSettingsDrawerModal';
import type { MenuAction } from '../../utils/menuActions';
import RowItemStyling from './RowItemStyling';
import RowItemContent from './RowItemContent';
import type { RowItemDisplayProps } from '../../types/rowItemTypes';

// `larger` is intentionally excluded: the drawer preview is always compact regardless of
// how the row itself is displayed.
interface Props extends Omit<Partial<RowItemDisplayProps>, 'larger'> {
    preview?: ReactNode;
    buttonClassName?: string;
    onMenuClick: MenuAction[];
}

export default function ItemActionsButton({ preview, firstString, secondString, thirdString, labelPill, photographOnLeft, useDirectUrl, buttonClassName, onMenuClick }: Props) {
    const [open, setOpen] = useState(false);

    const previewNode = preview ?? (firstString ? (
        <RowItemStyling>
            <RowItemContent
                firstString={firstString}
                secondString={secondString}
                thirdString={thirdString}
                labelPill={labelPill}
                photographOnLeft={photographOnLeft}
                useDirectUrl={useDirectUrl}
            />
        </RowItemStyling>
    ) : undefined);

    return (
        <>
            <button
                className={buttonClassName ?? 'self-center shrink-0 px-2 py-1 text-text/60 hover:text-text leading-none'}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); setOpen(true); }}
            >
                {onMenuClick.length === 1 ? onMenuClick[0].icon : '...'}
            </button>
            <ItemSettingsDrawerModal open={open} onClose={() => setOpen(false)} preview={previewNode}>
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

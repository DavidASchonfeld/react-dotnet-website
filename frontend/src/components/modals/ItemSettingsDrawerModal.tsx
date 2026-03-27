import type { ReactNode } from "react";
import DrawerModal from "./modal_frame/DrawerModal";

interface Props {
    open: boolean;
    onClose: () => void;
    preview?: ReactNode;
    children: (close: () => void) => ReactNode;
}

export default function ItemSettingsDrawerModal({ open, onClose, preview, children }: Props) {
    return (
        <DrawerModal open={open} onClose={onClose}>
            {(close) => (
                <>
                    {/* Read-only item preview — tells the user which item they're editing.
                        Typically a <RowItemStyling><RowItemContent /></RowItemStyling> */}
                    {preview}

                    {/* Menu Options */}
                    <div className="flex flex-col">
                        {children(close)}
                    </div>
                </>
            )}
        </DrawerModal>
    );
}

export function SettingsRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 px-6 py-4 text-left text-text hover:bg-surface active:bg-border transition-colors w-full"
        >
            <span className="text-xl w-6 text-center">{icon}</span>
            <span className="text-base">{label}</span>
        </button>
    );
}

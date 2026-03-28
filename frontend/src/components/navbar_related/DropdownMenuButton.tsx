interface DropdownMenuButtonProps {
    icon: string;
    label: string;
    onClick: () => void;
    title: string;
    variant?: 'RedText';
}

const DropdownMenuButton = ({ icon, label, onClick, title, variant }: DropdownMenuButtonProps) => (
    <button
        title={title}
        // a11y: aria-label names the button for screen readers (title is tooltip-only, not reliable for AT)
        aria-label={label}
        // a11y: role="menuitem" marks this as an item inside a role="menu" parent for screen readers
        role="menuitem"
        className={`relative flex items-center w-full px-4 py-2.5 text-sm text-text hover:bg-surface-raised transition-colors duration-150${variant === 'RedText' ? ' text-red-600 hover:bg-red-50' : ''}`}
        onClick={onClick}
    >
        {/* a11y: aria-hidden hides the decorative icon from screen readers (the aria-label covers it) */}
        <span className="absolute left-4" aria-hidden="true">{icon}</span>
        <span className="flex-1 text-center">{label}</span>
    </button>
);

export default DropdownMenuButton;

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
        className={`relative flex items-center w-full px-4 py-2.5 text-sm text-text hover:bg-surface-raised transition-colors duration-150${variant === 'RedText' ? ' text-red-600 hover:bg-red-50' : ''}`}
        onClick={onClick}
    >
        <span className="absolute left-4">{icon}</span>
        <span className="flex-1 text-center">{label}</span>
    </button>
);

export default DropdownMenuButton;

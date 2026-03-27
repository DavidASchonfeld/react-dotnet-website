interface Props {
    label: string;
}

export default function BadgePill({ label }: Props) {
    return (
        <span className="text-xs px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] select-none">
            {label}
        </span>
    );
}

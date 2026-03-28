// 'muted' is the original style; 'primary' and 'danger' are tinted variants
type BadgeVariant = 'muted' | 'primary' | 'danger';

interface Props {
    label: string;
    variant?: BadgeVariant;
}

// Tailwind class sets per variant — each uses a tinted bg + matching text + border
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    muted:   'border-[var(--color-border)] text-[var(--color-text-muted)] bg-transparent',
    primary: 'border-primary/30 text-primary bg-primary/10',
    danger:  'border-danger/30 text-danger bg-danger/10',
};

export default function BadgePill({ label, variant = 'muted' }: Props) {
    return (
        <span className={`text-xs px-3 py-1 rounded-full border select-none ${VARIANT_CLASSES[variant]}`}>
            {label}
        </span>
    );
}

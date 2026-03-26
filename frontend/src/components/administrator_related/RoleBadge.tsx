type RoleBadgeProps = {
  role: 'Administrator' | 'Moderator';
};

const roleConfig: Record<RoleBadgeProps['role'], { color: string; label: string }> = {
  Administrator: { color: 'bg-amber-500', label: 'ADMIN' },
  Moderator:     { color: 'bg-gray-400',  label: 'MOD'   },
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const { color, label } = roleConfig[role];
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold text-white ${color}`}>
      {label}
    </span>
  );
}

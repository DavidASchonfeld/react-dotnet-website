type RoleBadgeProps = {
  role: 'Administrator' | 'Moderator';
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const isAdmin = role === 'Administrator';
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold text-white ${isAdmin ? 'bg-amber-500' : 'bg-gray-400'}`}>
      {isAdmin ? 'ADMIN' : 'MOD'}
    </span>
  );
}

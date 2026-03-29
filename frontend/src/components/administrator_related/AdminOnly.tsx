import type { ReactNode } from 'react';

interface AdminOnlyProps {
    roleLevel: string | null | undefined;
    children: ReactNode;
}

// Renders children only when the user is an Administrator — use to gate any admin-only JSX.
export default function AdminOnly({ roleLevel, children }: AdminOnlyProps) {
    if (roleLevel !== 'Administrator') return null;
    return <>{children}</>;
}

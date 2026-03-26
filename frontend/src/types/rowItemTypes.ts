import type { ReactNode } from 'react';

export interface RowItemDisplayProps {
    firstString: string;
    secondString?: string;
    thirdString?: string;
    larger?: boolean;
    photographOnLeft?: string;
    useDirectUrl?: boolean;
    labelPill?: ReactNode;
}

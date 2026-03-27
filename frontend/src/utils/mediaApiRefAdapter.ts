import type { RowItemDisplayProps } from '../types/rowItemTypes';

// Minimal interface covering only the fields needed for display in a row item.
// Both MediaApiRefSummary and ExternalApiSearchResult satisfy this structurally.
export interface MediaDisplayable {
    name: string;
    creatorName: string | null;
    publishedDate: string | null;
    thumbnailUrl?: string | null;
}

export interface MediaApiRefRowItemOptions {
    includeYear?: boolean;
    // Controls what appears in secondString.
    // 'creator' (default): item.creatorName
    // 'date': item.publishedDate formatted as a year string
    secondStringField?: 'creator' | 'date';
}

export function mediaApiRefToRowItemProps(
    item: MediaDisplayable,
    options?: MediaApiRefRowItemOptions
): Omit<RowItemDisplayProps, 'labelPill' | 'larger'> {
    const nameWithYear =
        options?.includeYear && item.publishedDate
            ? `${item.name} (${new Date(item.publishedDate).getFullYear()})`
            : item.name;

    const secondString =
        options?.secondStringField === 'date'
            ? (item.publishedDate ? String(new Date(item.publishedDate).getFullYear()) : undefined)
            : (item.creatorName ?? undefined);

    return {
        firstString: nameWithYear,
        secondString,
        photographOnLeft: item.thumbnailUrl ?? undefined,
    };
}

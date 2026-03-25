// TypeScript mirror of backend MediaApiRef DTOs

export interface MediaApiRefSummary {
    id: number;
    name: string;
    mediaTypeId: number;
    creatorName: string | null;
    publishedDate: string | null;
    externalId: string;
}

export interface MediaApiRefDetail {
    id: number;
    name: string;
    mediaTypeId: number;
    creatorName: string | null;
    publishedDate: string | null;
    externalApiSourceId: number;
    apiSourceName: string;
    externalId: string;
    dateAdded: string;
    apiHomepageUrl?: string;
    // Staleness detection: when details were last refreshed from the external API
    detailsFetchedAt: string | null;
    // True when details are older than the backend's DetailsStaleDays threshold
    isStale: boolean;
    // Image URLs stored on MediaApiRef entity
    thumbnailUrl?: string | null;   // small image from search results
    // Detail fields sourced from CacheItem.ResponseJson, not MediaApiRef columns
    poster?: string | null;         // full-size image from detail fetch
    plot?: string | null;
    runtime?: string | null;
    country?: string | null;
    genres?: string | null;
    rated?: string | null;
}

export interface FindOrCreateMediaApiRefRequest {
    externalApiSourceId: number;
    externalId: string;
    name: string;
    mediaTypeId: number;
    creatorName?: string | null;
    publishedDate?: string | null;
    thumbnailUrl?: string | null;
}

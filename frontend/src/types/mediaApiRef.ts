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
    poster?: string | null;
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
}

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
}

export interface FindOrCreateMediaApiRefRequest {
    externalApiSourceId: number;
    externalId: string;
    name: string;
    mediaTypeId: number;
    creatorName?: string | null;
    publishedDate?: string | null;
}

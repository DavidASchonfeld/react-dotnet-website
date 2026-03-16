// This mirrros all MEdiaItem DTOs

// Mirrors /backend/MyDotNetWebsiteApi/DTOs/MediaItemDTOs/MediaItemSummaryDto.cs

export interface MediaItemSummary {
    id: number;
    name: string;
    mediaTypeId: number;
    mediaTypeName: string; // I'm including it here, though if the front-end needs more details about the specific media type, it will use the mediaTypeId to do so.
}
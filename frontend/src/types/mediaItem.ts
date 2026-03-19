// This mirrros all MEdiaItem DTOs

// Mirrors /backend/MyDotNetWebsiteApi/DTOs/MediaItemDTOs/MediaItemSummaryDto.cs

export interface MediaItemSummary {
    id: number;
    name: string;
    mediaTypeId: number;
}

export interface MediaItemDetail {
    id: number;
    name: string;
    mediaTypeId: number;
    description: string | null;
    isApproved: boolean;

    // Published is when the book/movie was actually published.
    // Submitted is when a user submitted to the database this MediaItem that represents this book/movie.

    publishedDateTime: string | null;
    submittedById: string;
    dateSubmitted: string;
    canEdit: boolean;
}


// Requests


// Mirrored by DTO: /backend/MyDotNetWebsiteApi/DTOs/MediaItemDTOs/CreateUpdate/CreateMediaItemDto.cs
export interface CreateMediaItemRequest
{
    name: string;
    description?: string;  // Optional: Adding a descriptiohn
    mediaTypeId: number;

    // Reminder: Published is about when the actual MediaItem was published (Ex: "Finding Nemo" was published in 2003)
    publishedDateTime: string | null;
}

// Mirrored by DTO: /backend/MyDotNetWebsiteApi/DTOs/MediaItemDTOs/CreateUpdate/UpdateMediaItemBasicInfoDto.cs
export interface PatchMediaItemBasicInfoRequest
{
    // Id NOT included here (aka it is commented out) because it will be passed via the URL when I send this over
    // id: int

    name?: string;
    description?: string;
    mediaTypeId?: number;
    publishedDateTime?: string;
}
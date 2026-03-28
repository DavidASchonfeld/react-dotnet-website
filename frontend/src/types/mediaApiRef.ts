// TypeScript mirror of backend MediaApiRef DTOs

export interface MediaApiRefSummary {
    id: number;
    name: string;
    mediaTypeId: number;
    // API-specific subtype (e.g. "movie"/"series"/"episode" for OMDB, "game"/"publisher"/"developer" for RAWG)
    subtype?: string | null;
    creatorName: string | null;
    publishedDate: string | null;
    externalId: string;
    apiSourceName: string;
    thumbnailUrl?: string | null;
}

export interface MediaApiRefDetail {
    id: number;
    name: string;
    mediaTypeId: number;
    // API-specific subtype (e.g. "movie"/"series"/"episode" for OMDB, "game"/"publisher"/"developer" for RAWG)
    subtype?: string | null;
    creatorName: string | null;
    publishedDate: string | null;
    externalApiSourceId: number;
    apiSourceName: string;
    externalId: string;
    apiHomepageUrl?: string;
    // Admin-only: DB record metadata. Null for non-administrators.
    adminInfo?: {
        dateAdded: string;
        detailsFetchedAt: string | null;
        isStale: boolean;
    } | null;
    // True when the external API source is temporarily disabled by an administrator.
    // Some detail fields (plot, runtime, etc.) may be missing if the cache is also empty.
    isApiDisabled?: boolean;
    // Image URLs stored on MediaApiRef entity
    thumbnailUrl?: string | null;   // small image from search results
    // Detail fields sourced from CacheItem.ResponseJson, not MediaApiRef columns
    poster?: string | null;         // full-size CDN poster URL from detail fetch
    // "poster-api://{apiName}/{externalId}" when the Poster API is enabled — null otherwise.
    // The page converts this pseudo-URL to /api/imagecache/poster-api/{apiName}/{externalId}.
    bigPosterUrl?: string | null;
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
    // API-specific subtype to persist (e.g. "movie"/"series"/"episode" for OMDB, "game"/"publisher"/"developer" for RAWG)
    subtype?: string | null;
    creatorName?: string | null;
    publishedDate?: string | null;
    thumbnailUrl?: string | null;
}

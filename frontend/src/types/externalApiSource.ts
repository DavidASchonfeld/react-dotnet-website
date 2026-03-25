// TypeScript mirror of backend ExternalApiSourceSummaryDto
// Used so the frontend knows which APIs to offer/select as options in the search components.

export interface ExternalApiSourceSummary {
    id: number;
    apiName: string;
    mediaTypeId: number; // Tells the frontend which mediaType (Ex; Movie, Videogame) that the specific API provides data for.
    isActive: boolean;
}

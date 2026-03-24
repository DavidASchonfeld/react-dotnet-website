// TypeScript mirror of backend ExternalApiSearchResult
// Represents a raw search result from an external API (e.g. OMDB, RAWG).
// These are NOT yet stored in our database — they become MediaApiRef records
// only after the user selects one and we call find-or-create.

export interface ExternalApiSearchResult {
    externalId: string;
    name: string;
    creatorName: string | null;
    publishedDate: string | null;
    thumbnailUrl: string | null;
}

export interface CacheMetadata {
  isFromCache: boolean;
  cachedAt: string | null;
}


//  Wrapper for API responses that includes cache metadata (in case if includes a cache)

//  ALL 3rd-party API search results are wrapped in this structure,
//  whether they come from my backend's cache or freshly fetched from the external API.

// // Backend response structure (both cached AND fresh):
// {
//     data: [movie1, movie2, movie3],
//     cacheMetadata: {
//         isFromCache: true,
//         cachedAt: "2026-03-24T10:30:00Z"
//     }
// }

// // How to use in components:
// const result = await triggerSearch({ query: "avatar", ... });

// // Access the actual results (need to unwrap twice):
// const results = result.data?.data;  // First .data is RTK Query wrapper, second is CachedResponse

// // Check if results are cached:
// const isCached = result.data?.cacheMetadata?.isFromCache;

export interface CachedResponse<T> {
  data: T;
  cacheMetadata: CacheMetadata | null;
}

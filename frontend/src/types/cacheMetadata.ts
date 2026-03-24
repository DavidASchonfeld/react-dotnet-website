export interface CacheMetadata {
  isFromCache: boolean;
  cachedAt: string | null;
}

export interface CachedResponse<T> {
  data: T;
  cacheMetadata: CacheMetadata | null;
}

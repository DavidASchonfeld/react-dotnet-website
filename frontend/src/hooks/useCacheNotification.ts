import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { safeToast } from '../utils/safeToast';
import { formatCacheAge } from '../utils/formatCacheAge';
import type { RootState } from '../store/store';
import type { CacheMetadata } from '../types/cacheMetadata';

export function useCacheNotification(cacheMetadata: CacheMetadata | null | undefined) {
  const { roleLevel } = useSelector((state: RootState) => state.auth);
  const isAdmin = roleLevel === 'Administrator';

  useEffect(() => {
    if (!isAdmin || !cacheMetadata) return;

    if (cacheMetadata.isFromCache && cacheMetadata.cachedAt) {
      const cacheAge = formatCacheAge(cacheMetadata.cachedAt);
      safeToast.info(`Showing cached results from ${cacheAge}`);
    } else if (cacheMetadata.isFromCache && !cacheMetadata.cachedAt) {
      safeToast.warn('Showing cached results (cached time unknown)');
    } else if (!cacheMetadata.isFromCache) {
      safeToast.info('Fresh data from external API');
    }
  }, [cacheMetadata, isAdmin]);
}

import { useSelector } from 'react-redux';
import { formatCacheAge } from '../../utils/formatCacheAge';
import type { RootState } from '../../store/store';
import type { CacheMetadata } from '../../types/cacheMetadata';

interface CacheStatusPillProps {
  cacheMetadata: CacheMetadata | null | undefined;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function CacheStatusPill({ cacheMetadata }: CacheStatusPillProps) {
  const { roleLevel } = useSelector((state: RootState) => state.auth);
  const isAdmin = roleLevel === 'Administrator';

  if (!isAdmin) {
    return null;
  }

  if (cacheMetadata?.isFromCache && cacheMetadata?.cachedAt) {
    const cacheAge = formatCacheAge(cacheMetadata.cachedAt);
    const cacheTime = formatTime(cacheMetadata.cachedAt);
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full">
          <span>📦</span>
          <span>Cached {cacheAge} ({cacheTime})</span>
        </div>
      </div>
    );
  }

  if (cacheMetadata?.isFromCache && !cacheMetadata?.cachedAt) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 text-sm rounded-full">
          <span>⚠️</span>
          <span>Cached (time unknown)</span>
        </div>
      </div>
    );
  }

  // Show "Fresh data" for non-cached results (when cacheMetadata is null or isFromCache is false)
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full">
        <span>✨</span>
        <span>Fresh data</span>
      </div>
    </div>
  );
}

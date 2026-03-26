import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { CacheStatusPill } from './CacheStatusPill';
import { RefInDbPill } from './RefInDbPill';
import type { CacheMetadata } from '../types/cacheMetadata';

interface AdminItemStatusPanelProps {
  cacheMetadata: CacheMetadata | null | undefined;
  isInDb: boolean;
}

export function AdminItemStatusPanel({ cacheMetadata, isInDb }: AdminItemStatusPanelProps) {
  const { roleLevel } = useSelector((state: RootState) => state.auth);
  if (roleLevel !== 'Administrator') return null;

  return (
    <div className="flex flex-wrap justify-center gap-x-3">
      <CacheStatusPill cacheMetadata={cacheMetadata} />
      <RefInDbPill isInDb={isInDb} />
    </div>
  );
}

import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { CacheStatusPill } from './CacheStatusPill';
import RoleBadge from '../RoleBadge';
import { RefInDbPill } from './RefInDbPill';
import type { CacheMetadata } from '../../types/cacheMetadata';

interface AdminItemStatusPanelProps {
  cacheMetadata: CacheMetadata | null | undefined;
  isInDb?: boolean;
  showRefInDb?: boolean;
}

export function AdminItemStatusPanel({ cacheMetadata, isInDb, showRefInDb = true }: AdminItemStatusPanelProps) {
  const { roleLevel } = useSelector((state: RootState) => state.auth);
  if (roleLevel !== 'Administrator') return null;

  return (
    <div className="my-4 rounded-xl border border-border p-4 bg-surface">
      <div className="flex items-center gap-2 mb-3">
        <RoleBadge role="Administrator" />
        <p className="text-sm font-semibold text-text">Item Status</p>
      </div>
      <div className="flex flex-wrap gap-x-3">
        <CacheStatusPill cacheMetadata={cacheMetadata} />
        {showRefInDb && isInDb !== undefined && <RefInDbPill isInDb={isInDb} />}
      </div>
    </div>
  );
}

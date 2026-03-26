import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

interface RefInDbPillProps {
  isInDb: boolean;
}

export function RefInDbPill({ isInDb }: RefInDbPillProps) {
  const { roleLevel } = useSelector((state: RootState) => state.auth);
  if (roleLevel !== 'Administrator') return null;

  return (
    <div className="flex justify-center mt-8 mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full">
        {isInDb ? (
          <><span>🗃️</span><span>Ref in DB</span></>
        ) : (
          <><span>📭</span><span>Not in DB</span></>
        )}
      </div>
    </div>
  );
}

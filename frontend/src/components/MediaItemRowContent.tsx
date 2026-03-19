import MediaTypeLabel from './MediaTypeLabel';
import type { MediaItemSummary } from '../types/mediaItem';

interface Props {
    item: MediaItemSummary;
    // Future: imageUrl?: string;
    // Future: actionButton?: React.ReactNode;
}

// The shared core display content for a media item row (name + type label).
// Used by both SwipeableRow and StaticRow in SortableMediaItem.
export default function MediaItemRowContent({ item }: Props) {
    return (
        <>
            {/* Future: optional small image here */}
            {/* <span className="flex-1">{item.name}</span>*/}
            <h2 className="flex-1">{item.name}</h2>
            <h3 className="flex-2">TODO: Add Creators</h3>
            <MediaTypeLabel mediaTypeId={item.mediaTypeId} />
            {/* Future: action button here */}
        </>
    );
}

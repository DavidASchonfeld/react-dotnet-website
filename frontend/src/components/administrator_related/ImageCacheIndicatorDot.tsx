import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

interface Props {
    src: string;
}

export default function ImageCacheIndicatorDot({ src }: Props) {
    const { roleLevel } = useSelector((state: RootState) => state.auth);
    const { showImageCacheIndicator } = useSelector((state: RootState) => state.adminSettings);

    if (roleLevel !== 'Administrator' || !showImageCacheIndicator) return null;
    if (!src || !src.startsWith('http')) return null;

    const isFromCache = src.includes('/api/imagecache');

    return (
        <span
            className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white/60 shadow-sm pointer-events-none z-10 ${
                isFromCache ? 'bg-green-500' : 'bg-orange-400'
            }`}
            title={isFromCache ? 'Served from backend cache' : 'Served from 3rd party CDN'}
            // a11y: role="img" + aria-label expose the color-coded status to screen readers (color alone is not accessible)
            role="img"
            aria-label={isFromCache ? 'Image cached on server' : 'Image from external CDN'}
        />
    );
}

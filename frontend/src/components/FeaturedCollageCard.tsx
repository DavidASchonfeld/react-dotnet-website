import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BACKEND_BASE_URL } from '../config';
import { routes } from '../utils/routes';
import ImageCacheIndicatorDot from './administrator_related/ImageCacheIndicatorDot';
import type { RootState } from '../store/store';

interface Props {
    apiSourceName: string;
    externalId: string;
    name: string;
    creatorName?: string | null;
    thumbnailUrl?: string | null;
    rotation: number;
    boxShadow?: string;
    defaultZ?: number;
    style?: React.CSSProperties;
    className?: string;
}

export default function FeaturedCollageCard({ apiSourceName, externalId, name, creatorName, thumbnailUrl, rotation, boxShadow, defaultZ, style, className }: Props) {

    const currentTheme = useSelector((s: RootState) => s.theme.currentTheme);
    const isCowboy = currentTheme?.includes('cowboy') ?? false;

    const proxiedUrl = thumbnailUrl
        ? thumbnailUrl.startsWith('http')
            ? `${BACKEND_BASE_URL}/api/imagecache?url=${encodeURIComponent(thumbnailUrl)}`
            : thumbnailUrl
        : null;

    const hoverHandlers = {
        onMouseEnter: (e: React.MouseEvent) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'rotate(0deg) translateY(-8px) scale(1.04)';
            el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.30)';
            el.style.zIndex = '20';
        },
        onMouseLeave: (e: React.MouseEvent) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = `rotate(${rotation}deg)`;
            el.style.boxShadow = boxShadow ?? '';
            el.style.zIndex = String(defaultZ ?? 1);
        },
    };

    // Cowboy theme: render as a western wanted poster (title on top, image below)
    if (isCowboy) {
        return (
            <Link
                to={routes.mediaApiRef(apiSourceName, externalId)}
                className={`wanted-card ${className ?? ''}`}
                style={{ ...style, transform: `rotate(${rotation}deg)`, boxShadow }}
                {...hoverHandlers}
            >
                <div className="wanted-title">{name}</div>
                <div className="wanted-photo bg-border relative">
                    {proxiedUrl && (
                        <img
                            src={proxiedUrl}
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                        />
                    )}
                    <ImageCacheIndicatorDot src={proxiedUrl ?? ''} />
                </div>
            </Link>
        );
    }

    // Default: polaroid layout
    return (
        <Link
            to={routes.mediaApiRef(apiSourceName, externalId)}
            className={`polaroid-card ${className ?? ''}`}
            style={{ ...style, transform: `rotate(${rotation}deg)`, boxShadow }}
            {...hoverHandlers}
        >
            <div className="polaroid-photo bg-border relative">
                {proxiedUrl && (
                    <img
                        src={proxiedUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                    />
                )}
                <ImageCacheIndicatorDot src={proxiedUrl ?? ''} />
            </div>

            <div className="polaroid-caption">
                <span className="polaroid-title">{name}</span>
                {creatorName && <span className="polaroid-creator">{creatorName}</span>}
            </div>
        </Link>
    );
}

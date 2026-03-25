import { Link } from 'react-router-dom';
import { BACKEND_BASE_URL } from '../config';
import { routes } from '../utils/routes';

interface Props {
    id: number;
    name: string;
    creatorName?: string | null;
    thumbnailUrl?: string | null;
    rotation: number;
}

export default function FeaturedCollageCard({ id, name, creatorName, thumbnailUrl, rotation }: Props) {

    const proxiedUrl = thumbnailUrl
        ? `${BACKEND_BASE_URL}/api/imagecache?url=${encodeURIComponent(thumbnailUrl)}`
        : null;

    return (
        <Link
            to={routes.mediaApiRef(id)}
            className="block overflow-hidden rounded-lg shadow-lg cursor-pointer
                       bg-card border border-border
                       transition-transform duration-200"
            style={{ transform: `rotate(${rotation}deg)` }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'rotate(0deg) scale(1.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = `rotate(${rotation}deg)`}
        >
            {/* Poster image area — 2:3 aspect ratio */}
            <div className="aspect-[2/3] bg-border flex items-center justify-center overflow-hidden">
                {proxiedUrl && (
                    <img
                        src={proxiedUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                    />
                )}
            </div>

            {/* Title + creator */}
            <div className="px-2 py-2 flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-text leading-tight line-clamp-2">{name}</span>
                {creatorName && (
                    <span className="text-[11px] text-text/70 truncate">{creatorName}</span>
                )}
            </div>
        </Link>
    );
}

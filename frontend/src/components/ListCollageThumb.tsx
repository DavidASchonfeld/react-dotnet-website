import { BACKEND_BASE_URL } from '../config';

interface Props {
    urls: string[];
}

// Renders a single cached image with retry-once + SVG fallback logic
function CollageImage({ url }: { url: string }) {
    return (
        <img
            src={`${BACKEND_BASE_URL}/api/imagecache?url=${encodeURIComponent(url)}`}
            alt=""
            className="w-full h-full object-cover"
            onError={e => {
                // Retry with direct URL once before falling back to placeholder
                const img = e.currentTarget as HTMLImageElement;
                if (!img.dataset.retried) {
                    img.dataset.retried = 'true';
                    setTimeout(() => { img.src = url; }, 1500);
                } else {
                    img.src = '/placeholder-thumbnail.svg';
                }
            }}
        />
    );
}

// Muted placeholder shown when there are no thumbnail URLs at all
function EmptyPlaceholder() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-border">
            {/* Generic photo-stack icon for empty lists */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-1/3 h-1/3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h2M3 12h2M3 17h2M7 3v2M12 3v2M17 3v2M7 4h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13l2 2 4-4" />
            </svg>
        </div>
    );
}

// Adaptive inner layout — 0 images: icon; 1: full; 2: halves; 3: top-wide + bottom-two; 4: 2×2
function CollageLayout({ urls }: { urls: string[] }) {
    const count = Math.min(urls.length, 4);

    if (count === 0) {
        return <EmptyPlaceholder />;
    }

    if (count === 1) {
        // Single image fills the entire square
        return <CollageImage url={urls[0]} />;
    }

    if (count === 2) {
        // Two equal vertical halves side by side
        return (
            <div className="grid grid-cols-2 gap-px w-full h-full">
                <CollageImage url={urls[0]} />
                <CollageImage url={urls[1]} />
            </div>
        );
    }

    if (count === 3) {
        // Top half: one full-width image; bottom half: two equal images
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-px w-full h-full">
                <div className="col-span-2"><CollageImage url={urls[0]} /></div>
                <CollageImage url={urls[1]} />
                <CollageImage url={urls[2]} />
            </div>
        );
    }

    // 4 images: standard 2×2 grid (original behaviour)
    return (
        <div className="grid grid-cols-2 grid-rows-2 gap-px w-full h-full">
            {urls.slice(0, 4).map((url, i) => <CollageImage key={i} url={url} />)}
        </div>
    );
}

// Renders an adaptive collage thumbnail; outer size is always a consistent square regardless of image count
export default function ListCollageThumb({ urls }: Props) {
    // aspect-square fixes the outer dimensions; CollageLayout adapts the inner grid to image count
    return (
        <div className="w-full aspect-square overflow-hidden">
            <CollageLayout urls={urls} />
        </div>
    );
}

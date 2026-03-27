import { BACKEND_BASE_URL } from '../config';

interface Props {
    urls: string[];
}

// Renders a 2×2 collage from the first 4 thumbnail URLs; empty slots show a muted placeholder
export default function ListCollageThumb({ urls }: Props) {
    // Always render exactly 4 slots; undefined slots become placeholder divs
    const slots = [urls[0], urls[1], urls[2], urls[3]];

    return (
        // aspect-square on each cell means height = width, so images are visible without a parent height
        <div className="grid grid-cols-2 gap-px w-full">
            {slots.map((url, i) =>
                url
                    ? <img
                        key={i}
                        src={`${BACKEND_BASE_URL}/api/imagecache?url=${encodeURIComponent(url)}`}
                        alt=""
                        className="w-full aspect-square object-cover"
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
                    : <div key={i} className="bg-border w-full aspect-square" />
            )}
        </div>
    );
}

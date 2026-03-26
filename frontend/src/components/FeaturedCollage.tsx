import FeaturedCollageCard from './FeaturedCollageCard';
import type { MediaApiRefSummary } from '../types/mediaApiRef';

const CARD_SLOTS = [
    { left: '22%', top: '10%', rotation: -7, z: 3 },
    { left: '30%', top:  '6%', rotation:  4, z: 5 },
    { left: '26%', top: '18%', rotation: -2, z: 7 },
    { left: '48%', top:  '8%', rotation:  8, z: 4 },
    { left: '52%', top: '22%', rotation: -5, z: 6 },
    { left:  '5%', top: '14%', rotation:  3, z: 2 },
    { left: '15%', top: '45%', rotation: -9, z: 1 },
    { left: '42%', top: '50%', rotation:  6, z: 3 },
];

const CARD_SHADOWS = [
    '0 2px 6px rgba(0,0,0,0.35), 0 10px 28px rgba(0,0,0,0.28)',
    '0 2px 6px rgba(0,0,0,0.30), 0 8px 22px rgba(0,0,0,0.32)',
    '0 3px 8px rgba(0,0,0,0.40), 0 12px 30px rgba(0,0,0,0.25)',
    '0 2px 5px rgba(0,0,0,0.28), 0 10px 24px rgba(0,0,0,0.30)',
    '0 4px 10px rgba(0,0,0,0.35), 0 14px 32px rgba(0,0,0,0.28)',
    '0 2px 6px rgba(0,0,0,0.32), 0 8px 20px rgba(0,0,0,0.26)',
    '0 3px 7px rgba(0,0,0,0.38), 0 10px 26px rgba(0,0,0,0.30)',
    '0 2px 5px rgba(0,0,0,0.30), 0 12px 28px rgba(0,0,0,0.27)',
];

interface Props {
    featuredItems: MediaApiRefSummary[];
    isLoading: boolean;
}

export default function FeaturedCollage({ featuredItems, isLoading }: Props) {
    if (!isLoading && featuredItems.length === 0) return null;

    return (
        <div className="polaroid-pile">
            {isLoading
                ? CARD_SLOTS.map((slot, i) => (
                    <div
                        key={i}
                        className="polaroid-card animate-pulse"
                        style={{
                            left: slot.left,
                            top: slot.top,
                            zIndex: slot.z,
                            transform: `rotate(${slot.rotation}deg)`,
                            boxShadow: CARD_SHADOWS[i],
                        }}
                    >
                        <div className="polaroid-photo bg-border" />
                        <div style={{ height: '30px' }} />
                    </div>
                ))
                : featuredItems.map((item, i) => {
                    const slot = CARD_SLOTS[i] ?? CARD_SLOTS[0];
                    return (
                        <FeaturedCollageCard
                            key={item.id}
                            apiSourceName={item.apiSourceName}
                            externalId={item.externalId}
                            name={item.name}
                            creatorName={item.creatorName}
                            thumbnailUrl={item.thumbnailUrl}
                            rotation={slot.rotation}
                            boxShadow={CARD_SHADOWS[i]}
                            defaultZ={slot.z}
                            style={{ left: slot.left, top: slot.top, zIndex: slot.z }}
                            className={i >= 5 ? 'hidden sm:block' : ''}
                        />
                    );
                })
            }
        </div>
    );
}

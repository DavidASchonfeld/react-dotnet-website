import FeaturedCollageCard from './FeaturedCollageCard';
import type { MediaApiRefSummary } from '../types/mediaApiRef';
import type { CollageConfig } from '../data/collageConfigs';

interface Props {
    featuredItems: MediaApiRefSummary[];
    isLoading: boolean;
    configs: CollageConfig[];
    activeConfigIndex?: number; // which config to use; defaults to 0
}

export default function FeaturedCollage({ featuredItems, isLoading, configs, activeConfigIndex }: Props) {
    // Resolve the active config, falling back to the first if index is out of range.
    const config = configs[activeConfigIndex ?? 0] ?? configs[0];

    // Slots sorted front-to-back so the first list item gets the highest z-index.
    const slotsByZ = [...config.slots].sort((a, b) => b.z - a.z);

    if (!isLoading && featuredItems.length === 0) return null;

    return (
        <div
            className="polaroid-pile"
            style={{
                // Inject container dimensions as CSS custom properties for responsive overrides in CSS.
                '--collage-height': config.container.height,
                '--collage-sm-height': config.container.heightSm,
                maxWidth: config.container.maxWidth,
            } as React.CSSProperties}
        >
            {isLoading
                ? slotsByZ.map((slot, i) => (
                    <div
                        key={i}
                        className="polaroid-card animate-pulse"
                        style={{
                            left: slot.left,
                            top: slot.top,
                            zIndex: slot.z,
                            transform: `rotate(${slot.rotation}deg)`,
                            boxShadow: config.shadows[i],
                        }}
                    >
                        <div className="polaroid-photo bg-border" />
                        <div style={{ height: '30px' }} />
                    </div>
                ))
                : featuredItems.map((item, i) => {
                    // Earlier list items map to higher-z slots so they appear in front.
                    const slot = slotsByZ[i] ?? slotsByZ[0];
                    return (
                        <FeaturedCollageCard
                            key={item.id}
                            apiSourceName={item.apiSourceName}
                            externalId={item.externalId}
                            name={item.name}
                            creatorName={item.creatorName}
                            thumbnailUrl={item.thumbnailUrl}
                            rotation={slot.rotation}
                            boxShadow={config.shadows[i]}
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

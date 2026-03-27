// Types and preset configurations for the FeaturedCollage component.

export interface CardSlot {
    left: string;
    top: string;
    rotation: number;
    z: number;
}

export interface CollageContainerSize {
    height: string;     // mobile height, e.g. '420px'
    heightSm: string;   // sm+ breakpoint height, e.g. '520px'
    maxWidth: string;   // max-width, e.g. '560px'
}

export interface CollageConfig {
    slots: CardSlot[];
    shadows: string[];
    container: CollageContainerSize;
}

// Default "polaroid pile" layout — add more configs here for variety.
const defaultConfig: CollageConfig = {
    slots: [
        { left: '22%', top: '10%', rotation: -7, z: 3 },
        { left: '30%', top:  '6%', rotation:  4, z: 5 },
        { left: '26%', top: '18%', rotation: -2, z: 7 },
        { left: '48%', top:  '8%', rotation:  8, z: 4 },
        { left: '52%', top: '22%', rotation: -5, z: 6 },
        { left:  '5%', top: '14%', rotation:  3, z: 2 },
        { left: '15%', top: '45%', rotation: -9, z: 1 },
        { left: '42%', top: '50%', rotation:  6, z: 3 },
    ],
    shadows: [
        '0 2px 6px rgba(0,0,0,0.35), 0 10px 28px rgba(0,0,0,0.28)',
        '0 2px 6px rgba(0,0,0,0.30), 0 8px 22px rgba(0,0,0,0.32)',
        '0 3px 8px rgba(0,0,0,0.40), 0 12px 30px rgba(0,0,0,0.25)',
        '0 2px 5px rgba(0,0,0,0.28), 0 10px 24px rgba(0,0,0,0.30)',
        '0 4px 10px rgba(0,0,0,0.35), 0 14px 32px rgba(0,0,0,0.28)',
        '0 2px 6px rgba(0,0,0,0.32), 0 8px 20px rgba(0,0,0,0.26)',
        '0 3px 7px rgba(0,0,0,0.38), 0 10px 26px rgba(0,0,0,0.30)',
        '0 2px 5px rgba(0,0,0,0.30), 0 12px 28px rgba(0,0,0,0.27)',
    ],
    container: {
        height: '420px',
        heightSm: '520px',
        maxWidth: '560px',
    },
};

export const DEFAULT_COLLAGE_CONFIGS: CollageConfig[] = [
    defaultConfig,
    // Add additional CollageConfig objects here for more layout options.
];

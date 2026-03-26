import type { Transition } from 'framer-motion';

export const ANIMATION_VARIANTS = {
  page: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 } as Transition,
  },
  dialogOverlay: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.35 } as Transition,
  },
  collapsible: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.4, ease: 'easeInOut' } as Transition,
  },
} as const;

export type AnimationVariant = keyof typeof ANIMATION_VARIANTS;

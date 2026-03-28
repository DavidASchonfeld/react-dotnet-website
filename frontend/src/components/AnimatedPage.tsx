// AnimatedPage: wraps page content in a subtle fade-up entrance.
// ErrorBoundary ensures the page still renders if Framer Motion fails.
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary';
import { ANIMATION_VARIANTS, type AnimationVariant } from '../constants/animations';

interface Props {
    children: ReactNode;
    variant?: AnimationVariant;
}

// Why a whole page for this?
// Because this is how the 3rd-party library "Framer Motion" works.
// Since you can't add motion to a regular div,
// "framer-motion" made "motion.div"
// This component is a named wrapped so you can wrap this item around other items
// so any wrapped item can use "framer-motion"
// And you can see in here, it is wrapped by my homemade <ErrorBoundary>
// so if there is an error, my website will still work.

function AnimatedPageInner({ children, variant = 'page' }: Props) {
    const config = ANIMATION_VARIANTS[variant];

    // a11y: respect the user's OS "Reduce Motion" preference — skip y-offset animations, keep only opacity
    const prefersReducedMotion = useReducedMotion();

    // a11y: when reduced-motion is preferred, only fade (no position shifts) to avoid vestibular discomfort
    const initial = prefersReducedMotion ? { opacity: 0 } : config.initial;
    const animate = prefersReducedMotion ? { opacity: 1 } : config.animate;
    const exit    = prefersReducedMotion ? { opacity: 0 } : config.exit;

    return (
        <motion.div
            initial={initial}
            animate={animate}
            exit={exit}
            transition={config.transition}
        >
            {children}
        </motion.div>
    );
}

export default function AnimatedPage({ children, variant = 'page' }: Props) {
    return (
        <ErrorBoundary label="AnimatedPage" fallback={<>{children}</>}>
            <AnimatedPageInner variant={variant}>{children}</AnimatedPageInner>
        </ErrorBoundary>
    );
}

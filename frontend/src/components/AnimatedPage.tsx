// AnimatedPage: wraps page content in a subtle fade-up entrance.
// ErrorBoundary ensures the page still renders if Framer Motion fails.
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
    children: ReactNode;
}

// Why a whole page for this?
// Because this is how the 3rd-party library "Framer Motion" works.
// Since you can't add motion to a regular div,
// "framer-motion" made "motion.div"
// This component is a named wrapped so you can wrap this item around other items
// so any wrapped item can use "framer-motion"
// And you can see in here, it is wrapped by my homemade <ErrorBoundary>
// so if there is an error, my website will still work.

function AnimatedPageInner({ children }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
        >
            {children}
        </motion.div>
    );
}

export default function AnimatedPage({ children }: Props) {
    return (
        <ErrorBoundary label="AnimatedPage" fallback={<>{children}</>}>
            <AnimatedPageInner>{children}</AnimatedPageInner>
        </ErrorBoundary>
    );
}

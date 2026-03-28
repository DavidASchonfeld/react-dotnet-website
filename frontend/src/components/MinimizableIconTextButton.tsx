import React, { useState, useEffect } from "react";
import { NAVBAR_AUTO_MINIMIZE_BREAKPOINT } from "../constants";

interface MinimizableIconTextButtonProps {
    title: string;
    icon: React.ReactNode;
    label: React.ReactNode;
    onClick: () => void;
    // "minimized" / "expanded": caller controls the state (e.g. Navbar passing effectiveMinimized).
    // "auto": the button self-manages — it listens to window resize and minimizes itself
    //         when the window is narrower than NAVBAR_AUTO_MINIMIZE_BREAKPOINT.
    mode: "minimized" | "expanded" | "auto";
    // isTop mirrors Navbar's isTop: affects label max-widths and whether the button fills
    // its container. Defaults to false (left/sidebar layout).
    isTop?: boolean;
    // a11y: optional aria-label — overrides title for screen readers when the two differ
    ariaLabel?: string;
    // a11y: optional aria-expanded — used on toggle buttons (e.g. user menu) to announce open/closed state
    ariaExpanded?: boolean;
    // a11y: optional aria-controls — links this button to the element it controls (e.g. a dropdown id)
    ariaControls?: string;
}

export default function MinimizableIconTextButton({
    title,
    icon,
    label,
    onClick,
    mode,
    isTop = false,
    ariaLabel,
    ariaExpanded,
    ariaControls,
}: MinimizableIconTextButtonProps) {

    // autoSmall is only used when mode === "auto".
    // Lazy initializer mirrors the pattern in Navbar so there is no flash on first render
    // (i.e. the button won't briefly appear expanded before collapsing when the page loads at a narrow width).
    const [autoSmall, setAutoSmall] = useState(() => window.innerWidth < NAVBAR_AUTO_MINIMIZE_BREAKPOINT);

    useEffect(() => {
        if (mode !== "auto") return;
        const check = () => setAutoSmall(window.innerWidth < NAVBAR_AUTO_MINIMIZE_BREAKPOINT);
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, [mode]);

    const effectiveMinimized =
        mode === "minimized" ? true :
        mode === "expanded"  ? false :
        autoSmall; // "auto"

    // This class string is applied to each nav item's text label <span>.
    // - overflow-hidden + whitespace-nowrap: prevents text from wrapping or visually
    //   bleeding outside the span while its width is animating.
    // - text-ellipsis: shows "..." when the text is too long to fit, instead of just cutting off abruptly.
    // - transition-all duration-300: makes the max-width and opacity changes animate smoothly
    //   over 300ms instead of snapping instantly.
    // - When minimized (either mode): max-w-0 shrinks the span's allowed width to zero
    //   (the text collapses away), and opacity-0 simultaneously fades it out.
    // - When in LEFT mode expanded: responsive max-w scales with screen size so labels don't
    //   overflow the sidebar on small screens (e.g. max-w-[80px] on mobile, up to max-w-[140px]
    //   on sm+ screens). The sidebar itself also scales (see nav className), so these track together.
    // - In top mode: responsive max-w compresses labels on narrow screens so items don't overflow
    //   the full-width bar (max-w-[60px] on mobile → max-w-[200px] on md+ screens).
    //
    // As equivalent if-statements, the ternary chain on the three lines inside resolves to:
    //
    //   if (effectiveMinimized) {
    //       classes = 'max-w-0 opacity-0'          // Nav is minimized -> collapse label to 0 width + fade out
    //   } else if (!isTop) {                       // Left-sidebar mode, expanded
    //       classes = 'max-w-[80px] sm:max-w-[120px] md:max-w-[140px] opacity-100'
    //   } else {                                   // Top-bar mode, expanded  (the final fallback)
    //       classes = 'max-w-[60px] sm:max-w-[120px] md:max-w-[200px] opacity-100'
    //   }
    //
    // The ternary chain is equivalent because:
    //   condA ? X : condB ? Y : Z
    //   reads as: "if condA then X, else if condB then Y, else Z"
    const labelClass = `overflow-hidden whitespace-nowrap text-ellipsis transition-all duration-300 ${
        effectiveMinimized ? "max-w-0 opacity-0" :
        !isTop             ? "max-w-[80px] sm:max-w-[120px] md:max-w-[140px] opacity-100" :
                             "max-w-[60px] sm:max-w-[120px] md:max-w-[200px] opacity-100"
    }`;

    // Icon span class: always visible. shrink-0 ensures the icon never gets squeezed by its flex container.
    const iconClass = `shrink-0 transition-all duration-300`;

    // In left mode:
    //   -- w-full fills the container so all buttons are the same width,
    //   -- px-2 py-1.5 (small screens) → px-3 py-2 (sm+) scales padding with the sidebar width
    //      so buttons don't feel cramped on narrow screens or over-padded on tiny ones.
    //   -- rounded-lg + hover:bg-white/10 gives a subtle pill-style hover highlight.
    // When minimized (applies in BOTH top and left modes):
    //   -- justify-center horizontally centers the icon within the button.
    //   -- gap-0 removes the gap between the icon and the now-invisible label.
    //      Without this, the 8px gap still takes up space to the right of the icon,
    //      which offsets it slightly left of true center even with justify-center.
    const buttonClass = `flex items-center${effectiveMinimized ? " justify-center gap-0" : " gap-2"} px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/10 transition-colors${!isTop ? " w-full" : ""}`;

    return (
        <button
            title={title}
            className={buttonClass}
            onClick={onClick}
            // a11y: aria-label overrides title for screen readers (title is tooltip-only; not reliable for AT)
            aria-label={ariaLabel ?? title}
            // a11y: aria-expanded tells screen readers whether a controlled panel (e.g. dropdown) is open
            aria-expanded={ariaExpanded}
            // a11y: aria-controls links this button to the element it toggles (e.g. user menu dropdown id)
            aria-controls={ariaControls}
        >
            <span className={iconClass}>{icon}</span>
            <span className={labelClass}>{label}</span>
        </button>
    );
}

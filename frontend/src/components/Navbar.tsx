import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from "react-redux";

// Importing from My Files
import type { RootState, AppDispatch } from "../store/store";
import { clearCredentials } from "../store/authSlice";
import SearchBar from "./SearchBar";



interface NavbarProps {
    isTop: boolean;
    setIsTop: (value: boolean) => void;
    // onMinimizedChange: called whenever the navbar's effective minimized state changes.
    // App.tsx uses this to know which padding variable to apply to <main>.
    onMinimizedChange: (minimized: boolean) => void;
}

export default function Navbar({ isTop, setIsTop, onMinimizedChange }: NavbarProps) {
    // export: So this function can be used in other files
    // default: The default function that is referenced when this file is imported. This is an optional tag

    const [manualMinimized, setManualMinimized] = useState(false)
    // useState lets React.js keep track of variables/functions
    // manualMinimized: variable keeping track of if this bar is minimized or not
    // setManualMinimized: the function we are using to set the "manualMinimized" variable.
    // This is needed to ensure that the variable is updated successfully
    // useState(false): means the default value will be set to false

    // overflowing: true when the window is narrower than Tailwind's "sm" breakpoint (640px).
    // The lazy initializer (() => ...) sets the correct value on the very first render,
    // so there is never a flash of "wrong" state on page load.
    // setState is only ever called inside the 'resize' event callback, never in the effect body,
    // which avoids the "calling setState synchronously in an effect" linter error.
    const [overflowing, setOverflowing] = useState(() => window.innerWidth < 640)

    // autoMinimized: derived (not its own state). True only when BOTH:
    //   -- the nav is in top mode (isTop), AND
    //   -- the window is too narrow (overflowing).
    // When isTop becomes false (sidebar mode), autoMinimized becomes false automatically
    // without needing any setState call in an effect — that's what fixes the linter error.
    const autoMinimized = isTop && overflowing

    // effectiveMinimized: the actual minimized state used throughout the render.
    // True if the user manually minimized OR the screen is too narrow.
    const effectiveMinimized = manualMinimized || autoMinimized

    // Notify App.tsx whenever effectiveMinimized changes so it can switch
    // between the normal and minimized padding CSS variables on <main>.
    // useCallback wraps onMinimizedChange so the effect dependency is stable
    // (avoids re-running the effect on every render just because the prop reference changed).
    // Unlike isTop, which is this component's in-house variable,
    // effectiveMinimized is technically not 1 variable,
    // but instead a value based on a series of if statements between multiple sources,
    // one of whom must stay in Navbar.tsx, so therefore the effectiveMinimzed
    // variable must remain inside Navbar.tsx
    // 
    // 
    const cachedOnMinimizedChange = useCallback((minimized: boolean) => onMinimizedChange(minimized), [onMinimizedChange])

    // Remember, this below means that it runs
    // when the component first renders
    // and again anytime one of its dependency's values change
    // the dependencies are:
    //    "effectiveMinimized" (the value that determines whether this Navbar is minimized or not). 
    //    stableOnMinimized function: a callback caching the results of anytime it ran "onMinimizedChange(AMinimizedValue)" in the past
    //        Remember, onMinimizedChange is the function passed in by this component (navbar)'s parent aka App.tsx
    //        so the function onMinimizedChange(newMinimizedBooleanValue) only runs when the minimizedValue changes
    //        so it is like a notification with the new Minimized value so App.tsx can move the padding
    //        as soon as it gets that function called.
    //     Why didn't I just give the App.tsx that minimized variable?
    //     Because minimized is defined like this (as seen in earlier lines in this smae file:)
    //        const effectiveMinimized = manualMinimized || autoMinimized
    //        so since const autoMinimized = isTop && overflowing
    //        that means const effectiveMinimized = manualMinimized || (isTop && overflowing)
    //        so effectiveMinmized IS partially made of the "overflowing variable",
    //        which is completely dependent on/reliant on the Navbar-specific window.eventListener,
    //        which would be extremely hard to handle if I had passed App.tsx that variable.
    // For isTop, both Navbar and App use it, so isTop could be a variable in either class.
    // Since it is a "tie", React prefers storing it in the parent of the relationship, so in App.tsx.
    // So this is why isTop is stored as a variable in App.tsx.
    // Technically, I could also do the same as OnMinimumChange but for isTop,
    // but React convention states that in a tie, the parent (in this case App.tsx)
    // should own the variable.
    //     
    useEffect(() => {
        cachedOnMinimizedChange(effectiveMinimized)
    }, [effectiveMinimized, cachedOnMinimizedChange])



    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);


    // Pulling in ability to dispatch functions and get username:
    const { userName, roleLevel } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();


    // Subscribe to window resize events to keep 'overflowing' up to date.
    // No setState is called directly in the effect body — only inside the 'resize' callback.
    useEffect(() => {
        const check = () => setOverflowing(window.innerWidth < 640)
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Importing ability to Redirect
    const navigate = useNavigate();  // set up useNavigate React.js to use it later (just like with useAuth()  ).


    const handleSearchSubmit = (query: string, mediaTypeId: number) => {
        navigate(`/search?q=${encodeURIComponent(query)}&mediaType=${mediaTypeId}&page=1`)
    }

    const handleLogout = () => {

        // calling the logout function was refactored into clearCredentials() in frontend/src/store/authSlice.ts
        dispatch(clearCredentials());

        // The following line(s) only run if the clearCrednetials() line above is successful.
        // Navigate to the login page.
        navigate('/login');
    }

    // Using Tailwind Classes to minimize
    //
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
        effectiveMinimized ? 'max-w-0 opacity-0' :
        !isTop             ? 'max-w-[80px] sm:max-w-[120px] md:max-w-[140px] opacity-100' :
                             'max-w-[60px] sm:max-w-[120px] md:max-w-[200px] opacity-100'
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
    const buttonClass = `flex items-center${effectiveMinimized ? ' justify-center gap-0' : ' gap-2'} px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/10 transition-colors${!isTop ? ' w-full' : ''}`;

    // When isTop = true, put the navigation bar on the top of the screen
    // When isTop = false, put the navigation bar on the left of the screen
    return (
        <nav
            className={
                // transition-all duration-300: the nav container's size change
                //     animates smoothly instead of snapping to the new size instantly.
                //
                // In left mode (!isTop), width switches between expanded and minimized.
                //   Responsive widths: smaller on mobile, full size on sm+ screens.
                //   w-[150px] sm:w-[200px] expanded — sidebar shrinks on small viewports so it
                //   doesn't eat most of the screen (e.g. on a 375px phone 200px = 53%).
                //   w-12 sm:w-16 minimized — icon-only strip is slightly thinner on mobile.
                //
                // In top mode (isTop), height switches between expanded and minimized.
                //   Responsive heights: slightly shorter on mobile to reclaim vertical space.
                //   h-11 sm:h-[60px] expanded / h-9 sm:h-10 minimized.
                //
                // Gap between nav items also scales: gap-x-1 sm:gap-x-4 (top) /
                //   gap-y-1 sm:gap-y-2 (left) — tighter on small screens so items don't crowd.
                //
                // justify-center centers items in top mode (horizontal bar).
                // justify-start + pt-3 sm:pt-4 pins items to the top in left mode (vertical sidebar).
                `fixed top-0 left-0 flex items-center
                gap-y-1 sm:gap-y-2 gap-x-2 sm:gap-x-4 bg-bg/80 backdrop-blur-md border border-border shadow-lg
                transition-all duration-300
                ${isTop ? 'rounded-b-xl' : 'rounded-r-xl'}
                ${isTop
                    ? `flex-row justify-center w-full ${effectiveMinimized ? 'h-9 sm:h-10' : 'h-11 sm:h-[60px]'}`
                    : `flex-col justify-start pt-3 sm:pt-4 ${effectiveMinimized ? 'w-12 sm:w-16' : 'w-[150px] sm:w-[200px]'} h-screen`
                }`
            }
        >
            {/*
                For minimization, we keep the items (like the button) in the DOM
                so animation works.

                CSS handles the show/hide transitions (and Tailwind handles the CSS).

                Items are always in the DOM, and CSS handles the show/hide transition:
                - In TOP mode minimized: text labels collapse (max-w-0) and icons shrink via iconClass,
                  so the icons remain visible and clickable in the thin h-8 strip.
                - In LEFT mode minimized: this wrapper's visibility never changes — instead, each button's
                  text label <span> uses labelClass (defined above) to animate its own width to zero.

                Note: overflow-hidden is intentionally NOT added to this wrapper, because the
                user dropdown menu uses position:absolute and needs to extend outside the wrapper
                bounds — overflow-hidden would clip it.
            */}
            <div className={`
                flex items-center
                transition-all duration-300
                ${isTop ? 'flex-row gap-x-1 sm:gap-x-4' : 'flex-col gap-y-0.5 sm:gap-y-1 w-full px-1 sm:px-2'}
                opacity-100
            `}>

                {/* Each button has 2 children:
                    1. The icon <span> (e.g. ⌂) has shrink-0 so it never gets squeezed — always visible.
                    2. A label <span> using labelClass — this is what animates away in left-minimized mode.
                    flex items-center gap-2 on the button keeps icon and label side by side with spacing. */}

                {/* title="..." is the browser's native tooltip — shown on hover (desktop only; no touch support).
                    Useful in minimized mode where the text label is hidden. */}
                <button title="Home" className={buttonClass} onClick={() => navigate("/")}>
                    <span className={iconClass}>⌂</span>
                    <span className={labelClass}>Home</span>
                </button>

                {/* Only appears if logged in */}
                {userName && <button title="My Tags" className={buttonClass} onClick={() => navigate("/my-tags")}>
                    <span className={iconClass}>◎</span>
                    <span className={labelClass}>My Tags</span>
                </button>}


                <button title="About" className={buttonClass} onClick={() => navigate("/about")}>
                    <span className={iconClass}>ⓘ</span>
                    <span className={labelClass}>About</span>
                </button>

                {/* Search bar — only shown when logged in (search requires auth) */}
                {userName && (
                    <SearchBar
                        mode="typeahead"
                        isTop={isTop}
                        effectiveMinimized={effectiveMinimized}
                        onSubmit={handleSearchSubmit}
                    />
                )}


                {!userName &&
                <button title="Log In" className={buttonClass} onClick={() => navigate("/login")}>
                    <span className={iconClass}>⇥</span>
                    <span className={labelClass}>Log In</span>
                </button>
                }

                {userName &&
                <>

                    <div className={`relative${!isTop ? ' w-full' : ''}`}>
                        {/* Clicking Username will toggle (open/close) this User-Specific Menu. */}
                        {/* Potential Icons to Use for Opening/Closing Menus:
                        ⇤⤒⬇︎▼▲—|⬅︎⬆︎
                        */}
                        <button title={userName ?? undefined} className={buttonClass} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                            {/* ● is the always-visible icon for the user button.
                                The username text, role badge, and dropdown arrow all live inside
                                the labelClass span, so they all collapse together in left-minimized mode. */}
                            <span className={iconClass}>●</span>
                            <span className={labelClass}>
                                {userName}
                                {/* If the user is a Moderator or an Administrator,
                                display a badge describing if he is a moderator or administrator
                                ml-1 means: Margin-Left add space 1
                                bg-amber-500 means set background to amber and use amber shade 500 (I could use any number between 50 and 950.)
                                */}
                                
                                {" "}
                                {/* {" "} is adding a manual space there. I'm adding it here
                                so there is a space between the username, the badge and the dropdown icon for the dropdown menu. */}
                                {roleLevel === 'Moderator' && (
                                    <>
                                        <span className="ml-1 text-xs bg-gray-400 text-white px-1 rounded">MOD</span>
                                        {" "}
                                    </>
                                )}
                                {roleLevel === 'Administrator' && (
                                    <>
                                        <span className="ml-1 text-xs bg-amber-500 text-white px-1 rounded">ADMIN</span>
                                        {" "}
                                    </>
                                    
                                )}
                                {isUserMenuOpen ? "▲" : "▼"}
                            </span>
                        </button>

                        {/* The Dropdown Menu */}
                        {isUserMenuOpen &&(
                            <>
                                {/* Invisible full-screen overlay sitting BEHIND the dropdown panel (z-40 < z-50).
                                     Clicking anywhere outside the panel hits this overlay, which closes the menu.
                                     This is the standard React-only "click outside to close" pattern — no useEffect needed.
                                     fixed inset-0 stretches it across the entire viewport. */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsUserMenuOpen(false)}
                                />

                                {/* Tailwind:
                                     -- absolute: removes element from normal page flow, puts it relative to the nearest relative parent.
                                            This is how we get this menu to float over other elements.
                                     -- In TOP mode:    top-full right-0 mt-2
                                            top-full positions the dropdown below the button.
                                            right-0 right-aligns it with the button.
                                            mt-2 adds a small gap below the button.
                                     -- In LEFT mode:   top-0 left-full ml-2
                                            top-0 aligns the dropdown's top with the button's top.
                                            left-full positions the dropdown's LEFT edge at the sidebar's RIGHT edge,
                                            so it opens to the right — into the main page content area where there is room.
                                            Without this, right-0 would push a 200px panel left past the narrow sidebar edge and off-screen.
                                            ml-2 adds a small gap between the sidebar and the panel.
                                     -- z-50: renders the panel above the z-40 overlay and all other page content.
                                     -- min-w-[200px]: guarantees enough width so menu items are always readable.
                                     -- overflow-hidden: clips the child buttons' hover backgrounds to the
                                            panel's rounded corners (without this, hover highlight bleeds outside).
                                     -- shadow-2xl + border: gives the panel depth and a subtle edge so it
                                            reads as a "floating card" above the page.
                                     -- ${isTop ? 'top-full right-0 mt-2' : 'top-0 left-full ml-2'}
                                        -- in "Top" mode: the menu will be below the button, right-aligned
                                        -- in "Left" mode: the menu will be to the right of the sidebar
                                    */}
                                <div
                                    className={`absolute min-w-[200px] bg-surface-raised rounded-xl shadow-2xl border border-border overflow-hidden z-50
                                        ${isTop ? 'top-full right-0 mt-2' : 'top-0 left-full ml-2'}`}

                                    // This onClick here, on the entire dropdown menu, means that no matter what you click in the dropdown menu itself,
                                    // it will still close the dropdown menu, so the dropdown menu doesn't awkwardly stay open when you navigate to another page.
                                    onClick={() => setIsUserMenuOpen(false)}
                                >

                                    {/* User info header — shows the logged-in username and role at the top of the menu.
                                        bg-gray-50 + border-b gives it a distinct "header" look separate from the action buttons. */}
                                    <div className="px-4 py-3 bg-surface border-b border-border text-center">
                                        <p className="text-sm font-semibold text-text truncate">{userName}</p>
                                        {roleLevel && <p className="text-xs text-text-muted mt-0.5">{roleLevel}</p>}
                                    </div>

                                    {/* Primary navigation items */}
                                    <div className="py-1">

                                        <button
                                            className="relative flex items-center w-full px-4 py-2.5 text-sm text-text hover:bg-surface-raised transition-colors duration-150"
                                            onClick={() => navigate("/my-medialists")}
                                        >
                                            <span className="absolute left-4">☰</span>
                                            <span className="flex-1 text-center">My Lists</span>
                                        </button>

                                        {/* These options only appear to users who are Administrators */}
                                        {roleLevel === 'Administrator' && (
                                            <>
                                                {/* Thin divider + "Admin" label to visually group admin-only actions */}
                                                <div className="h-px bg-border mx-3 my-1" />
                                                <p className="px-4 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Admin</p>
                                                <button
                                                    className="relative flex items-center w-full px-4 py-2.5 text-sm text-text hover:bg-surface-raised transition-colors duration-150"
                                                    onClick={() => navigate("/admin/users")}
                                                >
                                                    <span className="absolute left-4">⚙</span>
                                                    <span className="flex-1 text-center">Manage Users</span>
                                                </button>
                                                <button
                                                    className="relative flex items-center w-full px-4 py-2.5 text-sm text-text hover:bg-surface-raised transition-colors duration-150"
                                                    onClick={() => navigate("/admin/api-usage")}
                                                >
                                                    <span className="absolute left-4">📊</span>
                                                    <span className="flex-1 text-center">API Usage</span>
                                                </button>
                                            </>
                                        )}

                                    </div>

                                    {/* Log Out — separated from other actions by a border and colored red.
                                        Red signals a destructive/exit action (standard UX convention). */}
                                    <div className="border-t border-border py-1">
                                        <button
                                            className="relative flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                            onClick={handleLogout}
                                        >
                                            <span className="absolute left-4">⇤</span>
                                            <span className="flex-1 text-center">Log Out</span>
                                        </button>
                                    </div>

                                </div>
                            </>


                        )}

                    </div>

                </>
                }



                <button title={isTop ? 'Set Menu to Left' : 'Set Menu to Top'} className={buttonClass} onClick={() => setIsTop(!isTop)}>

                    <span className={iconClass}>{isTop ? '◀' : '▲'}</span>
                    <span className={labelClass}>{isTop ? 'Set Menu to Left' : 'Set Menu to Top'}</span>
                </button>
                {/* Here, setIsTop changes isTop to its opposite value. */}

            </div>

            {/*
                Using icons because plain text would be too wide and look broken in the narrow collapsed strip.
                Arrow icons remain readable at any nav size and hint at what clicking will do:
                  - Top mode expanded (▲): click to collapse the bar thinner
                  - Top mode collapsed (▼): click to expand the bar taller
                  - Left mode expanded (◀): click to collapse the bar narrower
                  - Left mode collapsed (▶): click to expand the bar wider
            */}
            {/* When autoMinimized, the screen is too narrow to show all items, so the button is locked
                and clicking it does nothing. The user can only expand by making the window wider. */}
            {/* Update: Now, when autoMinimzed, hide the expand/minimze button. */}
            {!autoMinimized && 
                <button
                    className="flex items-center justify-center shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => { if (!autoMinimized) setManualMinimized(!manualMinimized) }}
                >
                    {isTop
                        ? (effectiveMinimized ? '▼' : '▲')
                        : (effectiveMinimized ? '▶' : '◀')
                    }
                </button>
            }
        </nav>
    )
    // !manualMinimized = opposite of the manualMinimized value
    // This button will pass into the function the opposite of the current manualMinimized value.
    //    The point is to toggle the manualMinimized value to the opposite of what it currently is.

}

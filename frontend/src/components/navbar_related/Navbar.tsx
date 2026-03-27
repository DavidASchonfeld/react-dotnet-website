import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from "react-redux";

// Importing from My Files
import type { RootState, AppDispatch } from "../../store/store";
import { logoutThunk } from "../../store/authSlice";
import SearchBar from "../SearchBar";
import SearchFilterDropdown from "./SearchFilterDropdown";
import DropdownMenuButton from "./DropdownMenuButton";
import MinimizableIconTextButton from "../MinimizableIconTextButton";
import RoleBadge from "../administrator_related/RoleBadge";
import { NAVBAR_AUTO_MINIMIZE_BREAKPOINT } from "../../constants";
import { useGetActiveApiSourcesQuery } from "../../services/apiSlice";



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
    const [overflowing, setOverflowing] = useState(() => window.innerWidth < NAVBAR_AUTO_MINIMIZE_BREAKPOINT)

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
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isUserMenuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isUserMenuOpen]);

    const { data: activeSources } = useGetActiveApiSourcesQuery()

    // selectedApiSourceId holds explicit user selections only; null means "no selection yet".
    // effectiveSelectedApiSourceId below falls back to activeSources[0] when null — no effect needed.
    const [selectedApiSourceId, setSelectedApiSourceId] = useState<number | null>(() =>
        activeSources?.[0]?.id ?? null
    )

    // Derive effective API source ID: use selected value or fall back to first available
    const effectiveSelectedApiSourceId = selectedApiSourceId ?? activeSources?.[0]?.id ?? null

    // Pulling in ability to dispatch functions and get username:
    const { userName, roleLevel } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();


    // Subscribe to window resize events to keep 'overflowing' up to date.
    // No setState is called directly in the effect body — only inside the 'resize' callback.
    useEffect(() => {
        const check = () => setOverflowing(window.innerWidth < NAVBAR_AUTO_MINIMIZE_BREAKPOINT)
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Importing ability to Redirect
    const navigate = useNavigate();  // set up useNavigate React.js to use it later (just like with useAuth()  ).


    const handleSearchSubmit = (query: string) => {
        const params = new URLSearchParams({
            q: encodeURIComponent(query),
            page: '1',
        })
        if (effectiveSelectedApiSourceId !== null)
            params.set('api', String(effectiveSelectedApiSourceId))
        navigate(`/search?${params}`)
    }

    const handleLogout = () => {
        // logoutThunk tells the backend to invalidate the server-side refresh token
        // (so a stolen cookie can't be reused), then clears local Redux state.
        dispatch(logoutThunk());
        navigate('/login');
    }

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
                // z-30: page content elements (e.g. row items via .row-item-swipe-content) use z-10.
                //   Elements with no z-index specified default to z-index: auto, which is treated as 0 for
                //   stacking order purposes (though unlike explicit z-index: 0, auto does not create a new stacking context).
                //   When framer-motion ends its page animation, those z-10 elements can enter the root stacking context
                //   and beat a nav at z-10 via DOM order (<main> follows <nav>). z-30 ensures the nav always wins.
                //   The internal dropdown uses z-40/z-50 within the nav's own stacking context — those remain correct.
                `fixed top-0 left-0 z-30 flex items-center
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
                - In TOP mode minimized: text labels collapse (max-w-0) and icons remain visible,
                  so the icons remain visible and clickable in the thin h-8 strip.
                - In LEFT mode minimized: this wrapper's visibility never changes — instead, each button's
                  text label <span> animates its own width to zero (handled inside MinimizableIconTextButton).

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
                    2. A label <span> — this is what animates away in left-minimized mode (see MinimizableIconTextButton).
                    flex items-center gap-2 on the button keeps icon and label side by side with spacing. */}

                {/* title="..." is the browser's native tooltip — shown on hover (desktop only; no touch support).
                    Useful in minimized mode where the text label is hidden. */}
                <MinimizableIconTextButton title="Home" icon="⌂" label="Home" onClick={() => navigate("/")} mode={effectiveMinimized ? "minimized" : "expanded"} isTop={isTop} />

                <MinimizableIconTextButton title="About" icon="ⓘ" label="About" onClick={() => navigate("/about")} mode={effectiveMinimized ? "minimized" : "expanded"} isTop={isTop} />

                {effectiveMinimized ? (
                        <button
                            title="Search"
                            onClick={() => navigate("/search")}
                            className="flex items-center justify-center gap-0 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            🔍
                        </button>
                    ) : (
                        // Wrapper keeps input, filter button, and Search button aligned as a row (top) or column (left)
                        <div className={`flex items-center ${isTop ? 'flex-row gap-1' : 'flex-col gap-1 w-full'}`}>
                            <SearchBar
                                mode="on-submit"
                                showApiSourcePills={false}
                                showSearchButton={false}
                                isTop={isTop}
                                effectiveMinimized={effectiveMinimized}
                                defaultApiSourceId={selectedApiSourceId ?? undefined}
                                onSubmit={handleSearchSubmit}
                            />
                            {/* Filter dropdown: API source selection (OMDB, RAWG, etc.) */}
                            <SearchFilterDropdown
                                selectedApiSourceId={selectedApiSourceId}
                                onApiSourceChange={setSelectedApiSourceId}
                                isTop={isTop}
                            />
                        </div>
                    )
                }


                {!userName &&
                <MinimizableIconTextButton title="Log In" icon="⇥" label="Log In" onClick={() => navigate("/login")} mode={effectiveMinimized ? "minimized" : "expanded"} isTop={isTop} />
                }

                {userName &&
                <>

                    <div ref={userMenuRef} className={`relative${!isTop ? ' w-full' : ''}`}>
                        {/* Clicking Username will toggle (open/close) this User-Specific Menu. */}
                        {/* Potential Icons to Use for Opening/Closing Menus:
                        ⇤⤒⬇︎▼▲—|⬅︎⬆︎
                        */}
                        <MinimizableIconTextButton
                            title={userName ?? ''}
                            icon="●"
                            label={<>
                                {userName}
                                {/* If the user is a Moderator or an Administrator,
                                display a badge describing if he is a moderator or administrator
                                ml-1 means: Margin-Left add space 1
                                bg-amber-500 means set background to amber and use amber shade 500 (I could use any number between 50 and 950.)
                                */}

                                {" "}
                                {/* {" "} is adding a manual space there. I'm adding it here
                                so there is a space between the username, the badge and the dropdown icon for the dropdown menu. */}
                                {(roleLevel === 'Administrator' || roleLevel === 'Moderator') && (
                                    <><RoleBadge role={roleLevel} />{" "}</>
                                )}
                                {isUserMenuOpen ? "▲" : "▼"}
                            </>}
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            mode={effectiveMinimized ? "minimized" : "expanded"}
                            isTop={isTop}
                        />

                        {/* The Dropdown Menu */}
                        {isUserMenuOpen &&(
                            <>
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
                                     -- z-50: renders the panel above other page content.
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

                                        <DropdownMenuButton icon="☰" label="My Lists" title="My Lists" onClick={() => navigate("/search?type=lists&subtype=mine")} />

                                        <DropdownMenuButton icon="◎" label="My Tags" title="My Tags" onClick={() => navigate("/search?type=tags&subtype=mine")} />

                                        <DropdownMenuButton icon="⚙" label="My Settings" title="My Settings" onClick={() => navigate("/my-settings")} />

                                        {/* These options only appear to users who are Administrators */}
                                        {roleLevel === 'Administrator' && (
                                            <>
                                                {/* Thin divider + "Admin" label to visually group admin-only actions */}
                                                <div className="h-px bg-border mx-3 my-1" />
                                                <p className="px-4 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Admin</p>
                                                <DropdownMenuButton icon="⚙" label="Manage Users" title="Manage Users" onClick={() => navigate("/admin/users")} />
                                                <DropdownMenuButton icon="★" label="Edit Featured" title="Edit Featured" onClick={() => navigate("/admin/edit-featured")} />
                                                <DropdownMenuButton icon="📊" label="API Usage" title="API Usage" onClick={() => navigate("/admin/api-usage")} />
                                            </>
                                        )}

                                    </div>

                                    {/* Log Out — separated from other actions by a border and colored red.
                                        Red signals a destructive/exit action (standard UX convention). */}
                                    <div className="border-t border-border py-1">
                                        <DropdownMenuButton icon="⇤" label="Log Out" title="Log Out" onClick={handleLogout} variant="RedText" />
                                    </div>

                                </div>
                            </>


                        )}

                    </div>

                </>
                }



                <MinimizableIconTextButton
                    title={isTop ? 'Set Menu to Left' : 'Set Menu to Top'}
                    icon={isTop ? '◀' : '▲'}
                    label={isTop ? 'Set Menu to Left' : 'Set Menu to Top'}
                    onClick={() => setIsTop(!isTop)}
                    mode={effectiveMinimized ? "minimized" : "expanded"}
                    isTop={isTop}
                />
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

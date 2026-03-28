import { useNavigate, useLocation } from "react-router-dom";
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
    // onMinimizedChange: called whenever the navbar's effective minimized state changes.
    // App.tsx uses this to know which padding variable to apply to <main>.
    onMinimizedChange: (minimized: boolean) => void;
}

export default function Navbar({ onMinimizedChange }: NavbarProps) {
    // export: So this function can be used in other files
    // default: The default function that is referenced when this file is imported. This is an optional tag

    // overflowing: true when the window is narrower than Tailwind's "sm" breakpoint (640px).
    // The lazy initializer (() => ...) sets the correct value on the very first render,
    // so there is never a flash of "wrong" state on page load.
    // setState is only ever called inside the 'resize' event callback, never in the effect body,
    // which avoids the "calling setState synchronously in an effect" linter error.
    const [overflowing, setOverflowing] = useState(() => window.innerWidth < NAVBAR_AUTO_MINIMIZE_BREAKPOINT)

    // effectiveMinimized: navbar is always top-mode, so it auto-minimizes whenever the screen is too narrow.
    const effectiveMinimized = overflowing

    // Notify App.tsx whenever effectiveMinimized changes so it can switch
    // between the normal and minimized padding CSS variables on <main>.
    // useCallback wraps onMinimizedChange so the effect dependency is stable
    // (avoids re-running the effect on every render just because the prop reference changed).
    const cachedOnMinimizedChange = useCallback((minimized: boolean) => onMinimizedChange(minimized), [onMinimizedChange])

    // Runs on first render and whenever effectiveMinimized changes,
    // notifying App.tsx with the new minimized state so it adjusts <main> padding.
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
    // Track current path to highlight the active nav item
    const { pathname } = useLocation();


    const handleSearchSubmit = (query: string) => {
        const params = new URLSearchParams({
            q: query, // URLSearchParams handles encoding; manual encodeURIComponent causes double-encoding
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

    return (
        // a11y: aria-label="Main navigation" identifies this landmark for screen readers navigating by landmark
        <nav
            aria-label="Main navigation"
            className={
                // transition-all duration-300: the nav container's size change
                //     animates smoothly instead of snapping to the new size instantly.
                //
                // Height switches between expanded and minimized.
                //   Responsive heights: slightly shorter on mobile to reclaim vertical space.
                //   h-11 sm:h-[60px] expanded / h-9 sm:h-10 minimized.
                //
                // justify-center centers items in the horizontal top bar.
                // z-30: page content elements (e.g. row items via .row-item-swipe-content) use z-10.
                //   Elements with no z-index specified default to z-index: auto, which is treated as 0 for
                //   stacking order purposes (though unlike explicit z-index: 0, auto does not create a new stacking context).
                //   When framer-motion ends its page animation, those z-10 elements can enter the root stacking context
                //   and beat a nav at z-10 via DOM order (<main> follows <nav>). z-30 ensures the nav always wins.
                //   The internal dropdown uses z-40/z-50 within the nav's own stacking context — those remain correct.
                `fixed top-0 left-0 z-30 flex items-center
                gap-y-1 sm:gap-y-2 gap-x-2 sm:gap-x-4 bg-bg/80 backdrop-blur-md border border-border shadow-lg
                transition-all duration-300 rounded-b-xl
                flex-row justify-center w-full ${effectiveMinimized ? 'h-9 sm:h-10' : 'h-11 sm:h-[60px]'}`
            }
        >
            {/*
                Items stay in the DOM so CSS animations work.
                When minimized: text labels collapse (max-w-0) and icons remain visible and clickable.
                overflow-hidden is intentionally NOT on this wrapper — the dropdown menu uses position:absolute
                and needs to extend outside the wrapper bounds.
            */}
            <div className="flex items-center transition-all duration-300 flex-row gap-x-1 sm:gap-x-4 opacity-100">

                {/* Each button has 2 children:
                    1. The icon <span> (e.g. ⌂) has shrink-0 so it never gets squeezed — always visible.
                    2. A label <span> — this is what animates away in left-minimized mode (see MinimizableIconTextButton).
                    flex items-center gap-2 on the button keeps icon and label side by side with spacing. */}

                {/* title="..." is the browser's native tooltip — shown on hover (desktop only; no touch support).
                    Useful in minimized mode where the text label is hidden. */}
                {/* active prop highlights the button whose route matches the current page */}
                <MinimizableIconTextButton title="Home" icon="⌂" label="Home" onClick={() => navigate("/")} mode={effectiveMinimized ? "minimized" : "expanded"} isTop={true} active={pathname === "/"} />

                <MinimizableIconTextButton title="About" icon="ⓘ" label="About" onClick={() => navigate("/about")} mode={effectiveMinimized ? "minimized" : "expanded"} isTop={true} active={pathname === "/about"} />

                {effectiveMinimized ? (
                        // a11y: aria-label names the icon-only search button when the navbar is minimized
                        <button
                            title="Search"
                            aria-label="Search"
                            onClick={() => navigate("/search")}
                            className="flex items-center justify-center gap-0 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            🔍
                        </button>
                    ) : (
                        // Wrapper keeps input and filter button aligned as a row
                        <div className="flex items-center flex-row gap-1">
                            <SearchBar
                                mode="on-submit"
                                showApiSourcePills={false}
                                showSearchButton={false}
                                isTop={true}
                                effectiveMinimized={effectiveMinimized}
                                defaultApiSourceId={selectedApiSourceId ?? undefined}
                                onSubmit={handleSearchSubmit}
                            />
                            {/* Filter dropdown: API source selection (OMDB, RAWG, etc.) */}
                            <SearchFilterDropdown
                                selectedApiSourceId={selectedApiSourceId}
                                onApiSourceChange={setSelectedApiSourceId}
                                isTop={true}
                            />
                        </div>
                    )
                }


                {!userName &&
                <MinimizableIconTextButton title="Log In" icon="⇥" label="Log In" onClick={() => navigate("/login")} mode={effectiveMinimized ? "minimized" : "expanded"} isTop={true} />
                }

                {userName &&
                <>

                    <div ref={userMenuRef} className="relative">
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
                            isTop={true}
                            // a11y: aria-expanded announces whether the user dropdown menu is open or closed
                            ariaExpanded={isUserMenuOpen}
                            // a11y: aria-controls links this toggle button to the dropdown menu element
                            ariaControls="user-dropdown-menu"
                        />

                        {/* The Dropdown Menu */}
                        {isUserMenuOpen &&(
                            <>
                                {/* Tailwind:
                                     -- absolute: removes element from normal page flow, puts it relative to the nearest relative parent.
                                            This is how we get this menu to float over other elements.
                                     -- top-full right-0 mt-2: positions the dropdown below the button, right-aligned, with a small gap.
                                     -- z-50: renders the panel above other page content.
                                     -- min-w-[200px]: guarantees enough width so menu items are always readable.
                                     -- overflow-hidden: clips the child buttons' hover backgrounds to the
                                            panel's rounded corners (without this, hover highlight bleeds outside).
                                     -- shadow-2xl + border: gives the panel depth and a subtle edge so it
                                            reads as a "floating card" above the page.
                                    */}
                                <div
                                    // a11y: id matches aria-controls on the toggle button so screen readers link them
                                    id="user-dropdown-menu"
                                    // a11y: role="menu" tells screen readers this is a popup menu with menuitem children
                                    role="menu"
                                    aria-label="User menu"
                                    className="absolute min-w-[200px] bg-surface-raised rounded-xl shadow-2xl border border-border overflow-hidden z-50 top-full right-0 mt-2"

                                    // This onClick here, on the entire dropdown menu, means that no matter what you click in the dropdown menu itself,
                                    // it will still close the dropdown menu, so the dropdown menu doesn't awkwardly stay open when you navigate to another page.
                                    onClick={() => setIsUserMenuOpen(false)}
                                    // a11y: arrow key navigation so keyboard users can move between menu items without Tabbing
                                    onKeyDown={(e) => {
                                        const items = Array.from(
                                            (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')
                                        );
                                        const idx = items.indexOf(document.activeElement as HTMLElement);
                                        if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
                                        if (e.key === 'ArrowUp')   { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
                                        if (e.key === 'Home')      { e.preventDefault(); items[0]?.focus(); }
                                        if (e.key === 'End')       { e.preventDefault(); items[items.length - 1]?.focus(); }
                                        if (e.key === 'Escape')    { setIsUserMenuOpen(false); }
                                    }}
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



            </div>

        </nav>
    )

}

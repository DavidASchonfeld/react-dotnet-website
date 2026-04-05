# Accessibility & Mobile-Friendliness Changes

Target standard: **WCAG 2.1 AA**

Note: "a11y" stands for accessibility and marks places in code where accessibility-related content was added.
---

## 1. Skip Link (`index.css`, `App.tsx`)

A "Skip to content" link is the first focusable element on every page. It is visually hidden until a keyboard user presses Tab — then it appears as a pill in the top-left corner. Pressing Enter jumps focus past the navbar directly to the page content.

**Code location:**
- `App.tsx` — `<a href="#main-content">` is the *first child* of the root render, making it literally the first Tab stop on every page. A plain `<a>` (not a `<button>`) is used because it navigates to an anchor, which is the correct semantic for this pattern.
- `<main id="main-content" tabIndex={-1}>` wraps all routed page content so the anchor target exists and is programmatically focusable. `tabIndex={-1}` allows the element to receive `.focus()` without inserting it into the natural Tab order.
- `index.css` — `.skip-link` positions the link off-screen by default (`transform: translateY(-100%)`), then snaps it into view (`translateY(0)`) only on `:focus`, so sighted mouse users never see it.

**Who it helps:** Keyboard-only users and screen-reader users who would otherwise have to Tab through every navbar item on every page before reaching any content.

---

## 2. Global Focus Ring (`index.css`)

Every interactive element (`button`, `a`, `input`, `select`, `textarea`, anything with `tabindex`) now shows a 2px ring in the current theme's primary color when focused via keyboard.

**Code location:**
- `index.css` — a single `:focus-visible` rule targeting `*` (all elements) adds the ring globally rather than per-component. `:focus-visible` (not `:focus`) is used so the ring appears only for keyboard navigation and not for mouse clicks, preventing an unwanted box from appearing every time a user clicks a button.

**Who it helps:** Keyboard users who need to see which element is currently active. Without a visible ring, keyboard navigation is effectively unusable.

---

## 3. Reduced-Motion Support (`index.css`, `AnimatedPage.tsx`)

- **CSS layer:** All transitions and animations are cut to 0.01ms when the OS "Reduce Motion" setting is on.
- **Framer Motion layer:** `AnimatedPage` uses `useReducedMotion()` — when reduced motion is preferred, page transitions fade in/out (opacity only) instead of sliding.

**Code location:**
- `index.css` — `@media (prefers-reduced-motion: reduce)` sets `animation-duration` and `transition-duration` to `0.01ms` on `*` globally. Targeting `*` ensures no CSS animation anywhere is missed regardless of which component defines it.
- `AnimatedPage.tsx` — `useReducedMotion()` from Framer Motion is called here because `AnimatedPage` is the single wrapper around every routed page, making it the one chokepoint for all page-transition animations. Checking the preference once here avoids duplicating the check in every individual page component.
- `DrawerModal.tsx` — also calls `useReducedMotion()` because the drawer uses Framer Motion's `motion.div` for its slide-in animation. Framer Motion drives animations with JavaScript, not CSS transitions, so the CSS `@media` rule above does not intercept it — a JS-layer check is required here as well.

**Who it helps:** Users with vestibular disorders (inner-ear conditions) who experience nausea, dizziness, or disorientation from on-screen movement.

---

## 4. Focus Trap in Modals (`hooks/useFocusTrap.ts`, `DrawerModal.tsx`, `DialogOverlay.tsx`)

A new `useFocusTrap` hook:
- On open: saves the previously focused element, then moves focus to the first focusable element inside the modal.
- Traps Tab / Shift+Tab so focus cannot escape the modal.
- Closes the modal on Escape.
- On close: returns focus to the element that originally opened the modal.

**Code location:**
- New file `hooks/useFocusTrap.ts` — extracted as a reusable hook rather than inlined because both `DrawerModal` and `DialogOverlay` need identical logic. The hook accepts a `containerRef` and queries it for all focusable selectors (`a[href], button:not([disabled]), input, textarea, select, [tabindex]`), attaches a `keydown` listener on the container to intercept Tab and Escape, and saves/restores `document.activeElement` on mount/unmount.
- `DrawerModal.tsx` and `DialogOverlay.tsx` — the hook is called in these two files because they are the lowest-level modal wrapper components in the tree. Placing the trap here (rather than higher up in `ResponsiveModalFrame`) guarantees every modal automatically gets focus trapping regardless of which content is passed into it.

**Who it helps:** Keyboard and screen-reader users. Without a focus trap, pressing Tab while a modal is open sends focus behind the modal to the page underneath — making it impossible to interact with the modal via keyboard.

---

## 5. Modal ARIA Roles (`DrawerModal.tsx`, `DialogOverlay.tsx`, `ResponsiveModalFrame.tsx`)

Every modal now has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal's visible heading.

- `role="dialog"` — tells screen readers "this is a dialog window, not regular page content."
- `aria-modal="true"` — tells screen readers to ignore everything behind the dialog.
- `aria-labelledby` — tells screen readers the name of the dialog (the heading text) so they announce it when the dialog opens.

**Code location:**
- `DrawerModal.tsx` and `DialogOverlay.tsx` — `role="dialog"` and `aria-modal="true"` are placed on the outermost panel `<div>` of each modal type, because that is the element the screen reader treats as the dialog boundary.
- `aria-labelledby={titleId}` is threaded through `ResponsiveModalFrame.tsx` → `DrawerModal`/`DialogOverlay`. The `titleId` is generated once in `ResponsiveModalFrame` and passed down so the heading rendered by the caller (e.g. "Edit List") becomes the dialog's accessible name automatically, without duplicating any text.

**Who it helps:** Screen-reader users — without these, a screen reader may read the entire page behind the modal or give the dialog no name.

---

## 6. Form Labels (`LoginOrRegisterPage.tsx`, `MySettingsPage.tsx`, `NameAndDescriptionModal.tsx`, `ManageLinkModal.tsx`)

Every form input now has an associated `<label>` (visually hidden with `sr-only` where a visible label would clutter the UI). Inputs also have:
- `aria-required="true"` on required fields
- `aria-describedby` linking to any error message below the field
- `role="alert"` on error messages so they are announced automatically when they appear

**Code location:**
- `LoginOrRegisterPage.tsx` — labels added to the username, email, and password `<input>` elements. `role="alert"` added to the single shared error `<p id="auth-error">`. Each input's `aria-describedby` references that error paragraph so screen readers re-read the error text after announcing the field name.
- `MySettingsPage.tsx` — same pattern applied to the change-username and change-password forms, each with their own `<p id="...">` error element.
- `NameAndDescriptionModal.tsx` — sr-only `<label>` added for the name `<input>`, description `<textarea>`, and visibility `<select>`, because these live inside a modal with no room for visible label text.
- `ManageLinkModal.tsx` — sr-only labels added to the tab buttons and linked-item row buttons.

**Who it helps:** Screen-reader users — without a label, a screen reader announces "text field" with no context. With a label it announces "Username, required, text field."

---

## 7. Navbar Keyboard Navigation (`Navbar.tsx`, `DropdownMenuButton.tsx`, `MinimizableIconTextButton.tsx`)

- All icon-only buttons (Home, Search, expand/collapse, user menu) now have `aria-label` so screen readers announce their purpose.
- The user menu button gets `aria-expanded` (announces open/closed state) and `aria-controls` (links it to the dropdown).
- The dropdown gets `role="menu"` and each item gets `role="menuitem"`.
- Arrow keys (Up/Down), Home, End, and Escape all work inside the dropdown for full keyboard navigation.

**Code location:**
- `Navbar.tsx` — `aria-label="Main navigation"` added to the outer `<nav>` element so it registers as a landmark region. `aria-expanded` and `aria-controls` added to the user-menu `<button>` specifically because it controls a separate DOM element (the dropdown `<div>`). The `onKeyDown` handler is attached to the dropdown `<div>` container (not to each individual item) so a single listener routes all arrow-key and Escape events without adding per-item listeners.
- `DropdownMenuButton.tsx` — `role="menuitem"` added at this leaf component rather than in `Navbar.tsx` so every item automatically gets the role without `Navbar` needing to enumerate them.
- `MinimizableIconTextButton.tsx` — extended with optional `ariaLabel`, `ariaExpanded`, and `ariaControls` props so icon-only button instances (Home, Search) can expose accessible names without modifying every individual call site.

**Who it helps:** Keyboard users and screen-reader users who rely on standard menu keyboard patterns.

---

## 8. SearchBar Accessibility (`SearchBar.tsx`)

- A visually hidden `<label>` links to the search input.
- The input has `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete` — standard ARIA pattern for a search box with live suggestions.
- The search icon was converted from a `<span>` to a proper `<button aria-label="Submit search">` so keyboard users can activate it.
- The suggestion dropdown has `role="listbox"` and each result has `role="option"`.
- API source filter pills have `aria-pressed` to announce which filter is active.
- Dropdown width changed to `min(260px, 90vw)` so it never overflows a 320px phone screen.

**Code location:**
- `SearchBar.tsx` — `role="combobox"` placed directly on the `<input>` element (ARIA 1.1 pattern) because combobox semantics belong to the text-entry control itself, not a wrapper. `aria-controls` on the input points to the suggestions `<ul id>` below it.
- The search submit was previously a `<span>` with an `onClick`; changed to `<button type="submit" aria-label="Submit search">` so it is reachable by Tab and announced as a button. The clear `✕` was a raw character inside a `<span>`; changed to `<button aria-label="Clear search">` for the same reason — `<span>` elements are not keyboard-focusable and have no implicit role.
- Filter pills use `<button aria-pressed={active}>` rather than `aria-selected` because the pills are independent toggle buttons, not options within a single-select group. `aria-pressed` is the correct attribute for a button that toggles between on and off states.

**Who it helps:** Screen-reader users (announced as a combobox widget), keyboard users (search submit is now reachable), and mobile users (no horizontal overflow).

---

## 9. Pagination (`PaginationControls.tsx`)

- Wrapper changed from `<div>` to `<nav aria-label="Pagination">` — a landmark region keyboard users can jump to directly.
- Buttons have descriptive `aria-label` (e.g. "Go to page 3") instead of just "←" / "→".
- Page counter has `aria-live="polite"` + `aria-atomic="true"` — announced automatically when the page changes.

**Code location:**
- `PaginationControls.tsx` — the outermost `<div>` changed to `<nav aria-label="Pagination">` because `<nav>` is a landmark element that screen-reader users can jump to directly via their AT's landmark navigation. The page-counter `<span>` is wrapped in `aria-live="polite" aria-atomic="true"` so that when `currentPage` changes as a React state update, screen readers automatically announce the new page number without the user having to navigate to that element.

**Who it helps:** Screen-reader users who need to know what page they are on and navigate pagination by keyboard.

---

## 10. Clickable Row Items (`RowItemStyling.tsx`)

List rows with `onClick` now render as `<button>` instead of `<div>`. A `<div>` is not keyboard-focusable and is ignored by screen readers as interactive. A `<button>` is focusable, activatable with Enter/Space, and announced as "button" by screen readers.

**Code location:**
- `RowItemStyling.tsx` — this is the single shared component that every list row in the app renders through. Changing the element here from `<div>` to `<button>` (when an `onClick` prop is present) makes every row throughout the entire app keyboard-accessible without touching any of the individual usages. The conditional (`onClick` present → `<button>`, absent → `<div>`) preserves non-interactive rows as plain `<div>` elements so they are not incorrectly announced as buttons.

**Who it helps:** Keyboard users (can now Tab to rows and press Enter) and screen-reader users (rows are announced as interactive).

---

## 11. Image Cache Indicator (`ImageCacheIndicatorDot.tsx`)

The colored dot (green = cached, orange = CDN) now has `role="img"` and `aria-label` with a text description. Previously it conveyed information through color alone — invisible to colorblind users and completely absent from screen readers.

**Code location:**
- `ImageCacheIndicatorDot.tsx` — `role="img"` and `aria-label` added to the colored `<div>` dot. A `<div>` has no implicit ARIA role, so without `role="img"` the element is invisible to screen readers entirely. The label text ("Image cached on server" / "Image from external CDN") replaces color as the primary information carrier, satisfying the WCAG requirement that information is not conveyed by color alone.

**Who it helps:** Colorblind users and screen-reader users.

---

## 12. Theme Picker (`ThemePicker.tsx`)

Added a visually hidden `<label>` linked to the theme `<select>` dropdown.

**Code location:**
- `ThemePicker.tsx` — sr-only `<label htmlFor="theme-select">` added above the existing `<select id="theme-select">`. The `<select>` already had an `id`; the `<label>` was simply missing. This is the minimal correct fix — no other changes were needed.

**Who it helps:** Screen-reader users — without a label the select is announced as an anonymous dropdown.

---

## 13. Admin Users Table — Mobile (`AdminManageAllUsersPage.tsx`)

Wrapped the table in `overflow-x-auto` with `min-w-[500px]` on the table itself. On narrow phones the table scrolls horizontally instead of breaking the layout. On desktop it stays full-width. Added `aria-label` on the table, `scope="col"` on column headers, and screen-reader labels on every role select and Save button.

**Code location:**
- `AdminManageAllUsersPage.tsx` — `<div className="overflow-x-auto">` wraps the `<table>` so narrow viewports can scroll the table horizontally rather than breaking the layout. `aria-label="User list"` added to the `<table>` element because the table has no visible `<caption>`, which would otherwise leave screen readers with no way to know what the table contains. `scope="col"` added to each `<th>` header cell to explicitly associate headers with their columns — screen readers use this to announce "Username — Alice" rather than just "Alice" when a user navigates into a cell.

**Who it helps:** Mobile users on small screens, screen-reader users navigating the table.

---

## 14. ManageLinkModal (`ManageLinkModal.tsx`)

Several accessibility and mobile-friendliness fixes applied to the main link-management modal (used for tagging media items, managing list membership, etc.).

**Changes:**

- **Nested buttons fixed** — the row `<button>` previously wrapped the ⓘ detail `<button>` as a child. Nested interactive elements are invalid HTML (spec-forbidden) and cause unpredictable screen-reader and keyboard behavior. Each row is now a `<div>` containing two sibling buttons: the main toggle button (`flex-1`) and the ⓘ detail button.
- **Tab ARIA completed** — tab buttons now have `id="manage-link-tab-{i}"` and `aria-controls="manage-link-tab-panel"`. The scrollable candidate list has `role="tabpanel"`, `id="manage-link-tab-panel"`, and `aria-labelledby` pointing to the active tab. Screen readers now correctly announce the tab widget and associated panel.
- **Status icons hidden from screen readers** — the `✓` / `…` characters in the row status indicator now have `aria-hidden="true"`. The `aria-pressed` attribute on the toggle button already conveys linked/unlinked state; announcing the icon as well would cause double-announcement.
- **ⓘ icon hidden from screen readers** — the ⓘ character is wrapped in `<span aria-hidden="true">` so screen readers use the button's `aria-label` ("View details for …") instead of announcing the raw character.
- **Loading state announced** — the "Loading…" div now has `role="status"` and `aria-live="polite"` so screen readers announce when candidate loading begins.
- **Empty state visible** — when the filtered list is empty and not loading, a "No results found." message is shown. Previously the list was silently blank, confusing for all users and invisible to screen readers.
- **Tab touch targets enlarged** — tab buttons now have `min-h-[44px]` to meet the WCAG 2.5.5 minimum 44×44px touch target size. The ⓘ button also has `min-h-[44px] min-w-[44px]`.

**Code location:** `frontend/src/components/modals/ManageLinkModal.tsx`

**Who it helps:** Screen-reader users (correct tab panel announcement, no duplicate state, proper icon labels), keyboard users (ⓘ is now a proper Tab stop separate from the row toggle), and mobile users (larger touch targets on tab buttons and ⓘ button).

---

## 15. ManageLinkModal — Enter Key Fix (`useFocusTrap.ts`, `SearchBar.tsx`, `SearchBarWithFilters.tsx`, `ManageLinkModal.tsx`)

Pressing Enter in the `ManageLinkModal` search bar was closing the modal instead of sending the search.

**Root cause:** `useFocusTrap` always moved initial focus to the *first* focusable element in the modal, which was the Close (✕) button (it appears first in the DOM). If the user pressed Enter without clicking the search input first, Enter activated the focused Close button and dismissed the modal.

**Changes:**

- **Initial focus on search input** — `useFocusTrap` now checks for a `[data-autofocus]` element inside the modal before falling back to the first focusable element. `ManageLinkModal` sets `autoFocusOnMount={true}` on `SearchBarWithFilters`, which passes it to `SearchBar`, which adds `data-autofocus="true"` to its `<input>`. When the modal opens, focus goes directly to the search field — the correct ARIA pattern for a search dialog and what users expect.
- **`e.preventDefault()` on Enter in `SearchBar`** — the Enter `keydown` handler now calls `e.preventDefault()` before running the search. This prevents any implicit browser form-submission behavior from firing (e.g., if the component is ever placed inside a `<form>`).
- **`type="button"` on the Close button** — the ✕ button in `ManageLinkModal` now has an explicit `type="button"`. Without it, the button's implicit type is `"submit"`, which can cause unintended activation in certain browser/form combinations.

**Code location:**
- `frontend/src/hooks/useFocusTrap.ts` — initial focus prefers `[data-autofocus]` over first focusable
- `frontend/src/components/SearchBar.tsx` — `autoFocusOnMount` prop + `data-autofocus` attribute + `e.preventDefault()` on Enter
- `frontend/src/components/SearchBarWithFilters.tsx` — passes `autoFocusOnMount` through to `SearchBar`
- `frontend/src/components/modals/ManageLinkModal.tsx` — passes `autoFocusOnMount={true}` and adds `type="button"` to Close

**Who it helps:** All users — the modal no longer closes unexpectedly on Enter. Keyboard users especially benefit from having the search input focused immediately on open.

---

## 16. Settings Page (`MySettingsPage.tsx`)

Three accessibility and mobile-friendliness fixes applied to the Settings page.

**Changes:**

- **Descriptive `aria-label` on control buttons** — the Edit/Cancel and Change/Close buttons previously had `aria-expanded` but no `aria-label`, so screen readers announced only "Edit" or "Cancel" with no context. Each button now has a contextual label: `"Edit username"` / `"Cancel editing username"`, `"Edit password"` / `"Cancel editing password"`, and `"Change theme"` / `"Close theme picker"`. The visible text is unchanged; `aria-label` overrides what screen readers announce without affecting the visual label.
- **`aria-live` region on inline forms** — the expandable form area is wrapped in `aria-live="polite"` so screen readers announce the form content when it appears. This supplements `aria-expanded` for screen readers that track the expanded state less reliably.
- **Mobile: form button wrapping** — both the username and password forms used `flex gap-2` for their Submit/Cancel buttons. Changed to `flex flex-wrap gap-2` so "Change Password" + "Cancel" can stack to two lines on phones narrower than ~360px instead of overflowing or truncating.

**Code location:** `frontend/src/pages/MySettingsPage.tsx`

**Who it helps:** Screen-reader users (buttons now have context, form appearance is announced), and mobile users on narrow screens (buttons wrap cleanly).

---

## 17. ManageLinkModal — Reason Textarea Focus Steal Fix (`useFocusTrap.ts`)

Typing in the "Reason" textarea inside `ManageLinkModal` was causing the cursor to jump back to the search bar after every keystroke.

**Root cause:** Every keystroke updated `note` state → re-rendered the modal → `DialogOverlay`/`DrawerModal` passed a new inline `onEsc` function reference → `useFocusTrap`'s `useEffect` (which listed `onEsc` as a dependency) re-ran → the autofocus logic fired again and moved focus to the `[data-autofocus]` search input.

**Fix:** `onEsc` is now stored in a `useRef` (`onEscRef`) and synced via a lightweight `useEffect`. The main focus-trap effect removes `onEsc` from its dependency array and calls `onEscRef.current?.()` instead. This is the standard React "stable handler ref" pattern — the Escape key still works correctly because the ref always holds the latest callback, but re-renders that change the callback reference no longer trigger the autofocus side-effect.

**Code location:** `frontend/src/hooks/useFocusTrap.ts`

**Who it helps:** All users — the textarea is now fully typeable without focus being stolen. The fix is behaviorally transparent for keyboard/screen-reader users: Escape still closes the modal and Tab still cycles focus correctly.

---

## Keyboard Navigation Guide

This site is fully navigable without a mouse. The sections below describe what keys do in each area.

### Browser requirements

Full keyboard navigation (Tab reaching buttons, links, and all controls — not just text inputs) requires a one-time setup step depending on your browser and OS:

| Browser | OS | Setup required |
|---|---|---|
| **Chrome** | macOS / Windows | None — works out of the box |
| **Edge** | macOS / Windows | None — works out of the box |
| **Firefox** | Windows | None — works out of the box |
| **Firefox** | macOS | Enable **"Keyboard navigation"** in System Settings → Keyboard |
| **Safari** | macOS | Enable **both**: (1) Safari → Settings → Advanced → "Press Tab to highlight each item on a webpage" and (2) System Settings → Keyboard → "Keyboard navigation" |

**Recommended browser for testing keyboard accessibility:** Chrome or Edge, where no extra setup is needed.

> The macOS system setting (**System Settings → Keyboard → Keyboard navigation**) is shared across all browsers. Turning it on once fixes Firefox and Safari at the same time.

### Global keys (work anywhere on the page)

| Key | Action |
|---|---|
| Tab | Move focus forward to the next interactive element |
| Shift+Tab | Move focus backward to the previous interactive element |
| Enter | Activate the focused button or link |
| Space | Activate the focused button |

A 2px colored ring appears around whichever element currently has focus so you always know where you are.

### Skip link

On any page, press **Tab** once as soon as it loads. A "Skip to content" pill appears in the top-left corner. Press **Enter** to jump focus past the navbar directly to the page content. This lets you avoid tabbing through every navbar element on every page.

### Navbar user menu

1. Tab to the username / avatar button in the top-right corner.
2. Press **Enter** or **Space** to open the dropdown menu.
3. Once the menu is open, use **Arrow Down** / **Arrow Up** to move between menu items. (Arrow keys only have this effect inside an open menu — elsewhere they scroll the page as normal.)
4. Press **Home** to jump to the first item or **End** to jump to the last.
5. Press **Enter** or **Space** on any item to activate it.
6. Press **Escape** to close the menu and return focus to the button.

### Search bar

1. Tab to the search input field and type your query.
2. Press **Enter** to submit the search.
3. Alternatively, Tab forward to the search icon button and press **Enter** or **Space** to submit.
4. Tab to the clear (**✕**) button and press **Enter** or **Space** to clear the current query.

### Modals and drawers (any popup or dialog)

- **Tab** / **Shift+Tab** cycle focus through all controls inside the modal. Focus cannot leave the modal while it is open.
- **Escape** closes the modal and returns focus to the element that originally opened it.
- In **search modals** (e.g. ManageLinkModal), focus starts on the search input automatically — you can type and press **Enter** to search without clicking first.

### List rows (search results, media lists, tags, etc.)

- Tab to any row in a list.
- Press **Enter** or **Space** to open it (same as clicking).

### Pagination

- Tab to the **Previous** or **Next** page button.
- Press **Enter** or **Space** to go to that page.
- The current page number is announced automatically to screen readers when it changes.

---

## Summary Table

| Change | Keyboard | Screen Reader | Mobile | Colorblind | Motion-sensitive |
|---|---|---|---|---|---|
| Skip link | ✓ | ✓ | | | |
| Focus ring | ✓ | | | | |
| Reduced motion | | | | | ✓ |
| Focus trap | ✓ | ✓ | | | |
| Modal ARIA roles | | ✓ | | | |
| Form labels | ✓ | ✓ | | | |
| Navbar keyboard nav | ✓ | ✓ | | | |
| SearchBar | ✓ | ✓ | ✓ | | |
| Pagination | ✓ | ✓ | | | |
| Clickable rows | ✓ | ✓ | | | |
| Image cache dot | | ✓ | | ✓ | |
| Theme picker label | | ✓ | | | |
| Admin table mobile | | ✓ | ✓ | | |
| ManageLinkModal | ✓ | ✓ | ✓ | | |
| ManageLinkModal Enter fix | ✓ | ✓ | | | |
| Settings page | | ✓ | ✓ | | |
| ManageLinkModal Reason focus fix | ✓ | ✓ | | | |

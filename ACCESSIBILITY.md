# Accessibility & Mobile-Friendliness Changes

Target standard: **WCAG 2.1 AA**

Note: "a11y" stands for accessibility and marks places in code where accessibility-related content was added.
---

## 1. Skip Link (`index.css`, `App.tsx`)

A "Skip to content" link is the first focusable element on every page. It is visually hidden until a keyboard user presses Tab — then it appears as a pill in the top-left corner. Pressing Enter jumps focus past the navbar directly to the page content.

**Who it helps:** Keyboard-only users and screen-reader users who would otherwise have to Tab through every navbar item on every page before reaching any content.

---

## 2. Global Focus Ring (`index.css`)

Every interactive element (`button`, `a`, `input`, `select`, `textarea`, anything with `tabindex`) now shows a 2px ring in the current theme's primary color when focused via keyboard.

**Who it helps:** Keyboard users who need to see which element is currently active. Without a visible ring, keyboard navigation is effectively unusable.

---

## 3. Reduced-Motion Support (`index.css`, `AnimatedPage.tsx`)

- **CSS layer:** All transitions and animations are cut to 0.01ms when the OS "Reduce Motion" setting is on.
- **Framer Motion layer:** `AnimatedPage` uses `useReducedMotion()` — when reduced motion is preferred, page transitions fade in/out (opacity only) instead of sliding.

**Who it helps:** Users with vestibular disorders (inner-ear conditions) who experience nausea, dizziness, or disorientation from on-screen movement.

---

## 4. Focus Trap in Modals (`hooks/useFocusTrap.ts`, `DrawerModal.tsx`, `DialogOverlay.tsx`)

A new `useFocusTrap` hook:
- On open: saves the previously focused element, then moves focus to the first focusable element inside the modal.
- Traps Tab / Shift+Tab so focus cannot escape the modal.
- Closes the modal on Escape.
- On close: returns focus to the element that originally opened the modal.

**Who it helps:** Keyboard and screen-reader users. Without a focus trap, pressing Tab while a modal is open sends focus behind the modal to the page underneath — making it impossible to interact with the modal via keyboard.

---

## 5. Modal ARIA Roles (`DrawerModal.tsx`, `DialogOverlay.tsx`, `ResponsiveModalFrame.tsx`)

Every modal now has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal's visible heading.

- `role="dialog"` — tells screen readers "this is a dialog window, not regular page content."
- `aria-modal="true"` — tells screen readers to ignore everything behind the dialog.
- `aria-labelledby` — tells screen readers the name of the dialog (the heading text) so they announce it when the dialog opens.

**Who it helps:** Screen-reader users — without these, a screen reader may read the entire page behind the modal or give the dialog no name.

---

## 6. Form Labels (`LoginOrRegisterPage.tsx`, `MySettingsPage.tsx`, `NameAndDescriptionModal.tsx`, `ManageLinkModal.tsx`)

Every form input now has an associated `<label>` (visually hidden with `sr-only` where a visible label would clutter the UI). Inputs also have:
- `aria-required="true"` on required fields
- `aria-describedby` linking to any error message below the field
- `role="alert"` on error messages so they are announced automatically when they appear

**Who it helps:** Screen-reader users — without a label, a screen reader announces "text field" with no context. With a label it announces "Username, required, text field."

---

## 7. Navbar Keyboard Navigation (`Navbar.tsx`, `DropdownMenuButton.tsx`, `MinimizableIconTextButton.tsx`)

- All icon-only buttons (Home, Search, expand/collapse, user menu) now have `aria-label` so screen readers announce their purpose.
- The user menu button gets `aria-expanded` (announces open/closed state) and `aria-controls` (links it to the dropdown).
- The dropdown gets `role="menu"` and each item gets `role="menuitem"`.
- Arrow keys (Up/Down), Home, End, and Escape all work inside the dropdown for full keyboard navigation.

**Who it helps:** Keyboard users and screen-reader users who rely on standard menu keyboard patterns.

---

## 8. SearchBar Accessibility (`SearchBar.tsx`)

- A visually hidden `<label>` links to the search input.
- The input has `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete` — standard ARIA pattern for a search box with live suggestions.
- The search icon was converted from a `<span>` to a proper `<button aria-label="Submit search">` so keyboard users can activate it.
- The suggestion dropdown has `role="listbox"` and each result has `role="option"`.
- API source filter pills have `aria-pressed` to announce which filter is active.
- Dropdown width changed to `min(260px, 90vw)` so it never overflows a 320px phone screen.

**Who it helps:** Screen-reader users (announced as a combobox widget), keyboard users (search submit is now reachable), and mobile users (no horizontal overflow).

---

## 9. Pagination (`PaginationControls.tsx`)

- Wrapper changed from `<div>` to `<nav aria-label="Pagination">` — a landmark region keyboard users can jump to directly.
- Buttons have descriptive `aria-label` (e.g. "Go to page 3") instead of just "←" / "→".
- Page counter has `aria-live="polite"` + `aria-atomic="true"` — announced automatically when the page changes.

**Who it helps:** Screen-reader users who need to know what page they are on and navigate pagination by keyboard.

---

## 10. Clickable Row Items (`RowItemStyling.tsx`)

List rows with `onClick` now render as `<button>` instead of `<div>`. A `<div>` is not keyboard-focusable and is ignored by screen readers as interactive. A `<button>` is focusable, activatable with Enter/Space, and announced as "button" by screen readers.

**Who it helps:** Keyboard users (can now Tab to rows and press Enter) and screen-reader users (rows are announced as interactive).

---

## 11. Image Cache Indicator (`ImageCacheIndicatorDot.tsx`)

The colored dot (green = cached, orange = CDN) now has `role="img"` and `aria-label` with a text description. Previously it conveyed information through color alone — invisible to colorblind users and completely absent from screen readers.

**Who it helps:** Colorblind users and screen-reader users.

---

## 12. Theme Picker (`ThemePicker.tsx`)

Added a visually hidden `<label>` linked to the theme `<select>` dropdown.

**Who it helps:** Screen-reader users — without a label the select is announced as an anonymous dropdown.

---

## 13. Admin Users Table — Mobile (`AdminManageAllUsersPage.tsx`)

Wrapped the table in `overflow-x-auto` with `min-w-[500px]` on the table itself. On narrow phones the table scrolls horizontally instead of breaking the layout. On desktop it stays full-width. Added `aria-label` on the table, `scope="col"` on column headers, and screen-reader labels on every role select and Save button.

**Who it helps:** Mobile users on small screens, screen-reader users navigating the table.

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

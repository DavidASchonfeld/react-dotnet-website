import { routes } from './routes';
import type { NavigateFunction } from 'react-router-dom';

export type MenuAction = { icon: string; label: string; onClick: () => void; };

const canNativeShare = typeof navigator.share === 'function';

// ── Primitive factories ────────────────────────────────────────────────
// A primitive factory is a function that builds a single MenuAction object.
// Each returns a single MenuAction. Compose them freely at call sites.

export function makeShareAction(name: string, path: string): MenuAction {
    return {
        icon: '🔗',
        label: canNativeShare ? 'Share' : 'Copy Link',
        onClick: () => {
            const url = window.location.origin + path;
            if (canNativeShare) {
                navigator.share({ title: name, url }).catch(() => {});
            } else {
                navigator.clipboard.writeText(url).catch(() => {});
            }
        },
    };
}

export function makeManageListsTagsAction(onOpen: () => void): MenuAction {
    return { icon: '📋', label: 'Manage Lists / Tags for This Item', onClick: onOpen };
}

export function makeGoToDetailsAction(navigate: NavigateFunction, path: string): MenuAction {
    return { icon: '📄', label: 'Go to Details', onClick: () => navigate(path) };
}

// ── Preset builders ────────────────────────────────────────────────────
// A preset builder returns the full standard MenuAction[] for a given item type.
// Convenience wrappers for the most common per-type action sets.
// Skip these and call the primitives directly when you need customization.

export function mediaApiRefActions(item: {
    id: number;
    name: string;
    navigate: NavigateFunction;
    onManageListsTagsOpen: () => void;
    includeGoToDetails?: boolean;
}): MenuAction[] {
    const path = routes.mediaApiRef(item.id);
    return [
        makeShareAction(item.name, path),
        makeManageListsTagsAction(item.onManageListsTagsOpen),

        // if includeGoToDetail == false, do NOT include the link to the object's details page
        ...(item.includeGoToDetails !== false ? [makeGoToDetailsAction(item.navigate, path)] : []),
    ];
}

export function mediaListActions(item: {
    id: number;
    name: string;
    navigate: NavigateFunction;
}): MenuAction[] {
    const path = routes.mediaList(item.id);
    return [
        makeShareAction(item.name, path),
        makeGoToDetailsAction(item.navigate, path),
    ];
}

export function tagActions(item: {
    id: number;
    name: string;
    navigate: NavigateFunction;
}): MenuAction[] {
    const path = routes.tag(item.id);
    return [
        makeShareAction(item.name, path),
        makeGoToDetailsAction(item.navigate, path),
    ];
}

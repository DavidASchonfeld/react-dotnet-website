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

export function makeGoToDetailsAction(navigate: NavigateFunction, path: string): MenuAction {
    return { icon: '📄', label: 'Go to Details', onClick: () => navigate(path) };
}

export function makeManageListsAction(onOpen: () => void): MenuAction {
    return { icon: '📋', label: 'Manage Lists for This Item', onClick: onOpen };
}

export function makeManageTagsAction(onOpen: () => void): MenuAction {
    return { icon: '🏷️', label: 'Manage Tags for This Item', onClick: onOpen };
}

export function makeManageListContentsAction(onOpen: () => void): MenuAction {
    return { icon: '📋', label: 'Add / Remove Items', onClick: onOpen };
}

export function makeEditBasicInfo(onOpen: () => void): MenuAction {
    return { icon: '✏️', label: 'Name & Details', onClick: onOpen };
}

export function makeDeleteAction(onDelete: () => void): MenuAction {
    return { icon: '🗑️', label: 'Delete', onClick: onDelete };
}

export function makeManageTagItemsAction(onOpen: () => void): MenuAction {
    return { icon: '🏷️', label: 'Add / Remove Items', onClick: onOpen };
}

export function makeRemoveFromTagAction(onRemove: () => void): MenuAction {
    return { icon: '🏷️‍💥', label: 'Remove from Tag', onClick: onRemove };
}
// ── Preset builders ────────────────────────────────────────────────────
// A preset builder returns the full standard MenuAction[] for a given item type.
// Convenience wrappers for the most common per-type action sets.
// Skip these and call the primitives directly when you need customization.

export function mediaApiRefActions(item: {
    apiName: string;
    externalId: string;
    name: string;
    navigate: NavigateFunction;
    onManageListsOpen: () => void;
    onManageTagsOpen: () => void;
    includeGoToDetails?: boolean;
}): MenuAction[] {
    const path = routes.mediaApiRef(item.apiName, item.externalId);
    return [
        makeShareAction(item.name, path),
        makeManageListsAction(item.onManageListsOpen),
        makeManageTagsAction(item.onManageTagsOpen),

        // if includeGoToDetails == false, do NOT include the link to the object's details page
        ...(item.includeGoToDetails !== false ? [makeGoToDetailsAction(item.navigate, path)] : []),
    ];
}

export function mediaListActions(item: {
    id: number;
    name: string;
    navigate: NavigateFunction;
    onManageListContentsOpen?: () => void;
    includeGoToDetails?: boolean;
    onEditBasicInfoOpen?: () => void;
    onDeleteOpen?: () => void;
}): MenuAction[] {
    const path = routes.mediaList(item.id);
    return [
        makeShareAction(item.name, path),
        ...(item.onManageListContentsOpen ? [makeManageListContentsAction(item.onManageListContentsOpen)] : []),

        // Make "Edit Basic Info" action only available if the caller passes in an action.
        //   This is also helpful because we do not want for "Edit Basic Info" menus to open
        //   when people click Public lists that they do not have edit status for
        ...(item.onEditBasicInfoOpen ? [makeEditBasicInfo(item.onEditBasicInfoOpen)] : []),

        // Delete action only available if the caller passes in an action (e.g. not for default lists)
        ...(item.onDeleteOpen ? [makeDeleteAction(item.onDeleteOpen)] : []),

        // if includeGoToDetails == false, do NOT include the link to the object's details page
        ...(item.includeGoToDetails !== false ? [makeGoToDetailsAction(item.navigate, path)] : []),
    ];
}

export function tagActions(item: {
    id: number;
    name: string;
    navigate: NavigateFunction;
    onTagItemsOpen?: () => void;
    onEditOpen?: () => void;
    onDeleteOpen?: () => void;
    includeGoToDetails?: boolean;
}): MenuAction[] {
    const path = routes.tag(item.id);
    return [
        makeShareAction(item.name, path),
        ...(item.onTagItemsOpen ? [makeManageTagItemsAction(item.onTagItemsOpen)] : []),
        ...(item.onEditOpen ? [makeEditBasicInfo(item.onEditOpen)] : []),
        ...(item.onDeleteOpen ? [makeDeleteAction(item.onDeleteOpen)] : []),
        ...(item.includeGoToDetails !== false ? [makeGoToDetailsAction(item.navigate, path)] : []),
    ];
}

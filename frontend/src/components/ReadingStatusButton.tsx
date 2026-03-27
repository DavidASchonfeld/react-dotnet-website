import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import {
    useGetMyReadingStatusListsQuery,
    useAddMediaApiRefToListMutation,
    useRemoveMediaApiRefFromListMutation,
} from '../services/apiSlice';
import { MediaListCategory } from '../types/enums'; // still needed for activeStatusList check
import type { MediaListSummary } from '../types/mediaList';
import DrawerModal from './modals/DrawerModal';

interface ReadingStatusButtonProps {
    effectiveMediaApiRefId: number;              // 0 if item not yet persisted to DB
    currentLists: MediaListSummary[] | undefined; // lists this item appears in (from getMediaApiRefLists)
    onEnsureInDb: () => Promise<number>;          // resolves/creates the DB record, returns the DB ID
}

export default function ReadingStatusButton({
    effectiveMediaApiRefId,
    currentLists,
    onEnsureInDb,
}: ReadingStatusButtonProps) {

    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [showDrawer, setShowDrawer] = useState(false);
    const [isBusy, setIsBusy] = useState(false); // prevents double-clicks during async ops

    // Dedicated endpoint returns only ReadingStatus lists — avoids the DefaultPageSize cap on my-lists
    const { data: userReadingStatusLists = [] } = useGetMyReadingStatusListsQuery(
        undefined,
        { skip: !isAuthenticated }
    );

    const [addToList] = useAddMediaApiRefToListMutation();
    const [removeFromList] = useRemoveMediaApiRefFromListMutation();

    // Which ReadingStatus list this item is currently in (mutually exclusive per user)
    const activeStatusList = currentLists?.find(
        l => l.category === MediaListCategory.ReadingStatus
    );

    // The default one-click target: "Want to Read" by name, else first in the list
    const defaultList =
        userReadingStatusLists.find(l => l.name.toLowerCase() === 'want to read') ??
        userReadingStatusLists[0];

    // Wrap async mutation with busy guard to prevent double-submits
    const withBusy = async (fn: () => Promise<void>) => {
        if (isBusy) return;
        setIsBusy(true);
        try { await fn(); } finally { setIsBusy(false); }
    };

    // One-click default: add to "Want to Read" (or open drawer if no RS lists exist yet)
    const handleDefaultAdd = () => withBusy(async () => {
        if (!defaultList) { setShowDrawer(true); return; }
        const resolvedId = await onEnsureInDb();
        await addToList({ listId: defaultList.id, mediaApiRefId: resolvedId }).unwrap();
        // Backend auto-removes item from any other ReadingStatus list (exclusive group logic)
    });

    // Select a specific list from the drawer
    const handleSelectList = (listId: number, closeDrawer: () => void) =>
        withBusy(async () => {
            // Already in this list — nothing to do
            if (activeStatusList?.id === listId) { closeDrawer(); return; }
            const resolvedId = await onEnsureInDb();
            await addToList({ listId, mediaApiRefId: resolvedId }).unwrap();
            closeDrawer();
        });

    // Remove from whichever ReadingStatus list the item is currently in
    const handleRemove = (closeDrawer: () => void) =>
        withBusy(async () => {
            if (!activeStatusList) return;
            await removeFromList({
                listId: activeStatusList.id,
                mediaApiRefId: effectiveMediaApiRefId,
            }).unwrap();
            closeDrawer();
        });

    if (!isAuthenticated) return null;

    return (
        <>
            {/* Wrapper keeps both modes the same width so the layout never shifts */}
            <div className="flex mt-2 w-full max-w-xs">
                {activeStatusList ? (
                    // Item IS in a ReadingStatus list — outline button shows active list name
                    <button
                        className="btn btn-secondary border border-border flex items-center gap-2 w-full"
                        onClick={() => setShowDrawer(true)}
                        disabled={isBusy}
                    >
                        <span>✏️</span>
                        <span>{activeStatusList.name}</span>
                    </button>
                ) : (
                    // Item is NOT in any ReadingStatus list — primary-colored split button
                    // Left (main action) is 6x wider than the right (chevron) via flex-grow ratios
                    <>
                        {/* Left half (flex-[6]): one-click add to default "Want to Read" list */}
                        <button
                            className="btn btn-primary flex items-center gap-2 rounded-r-none flex-[6]"
                            onClick={handleDefaultAdd}
                            disabled={isBusy}
                        >
                            <span>✏️</span>
                            <span>Want to Read</span>
                        </button>
                        {/* Divider — slightly darker shade of primary so it's visible within the filled button */}
                        <div className="w-px bg-primary-hover self-stretch" />
                        {/* Right half (flex-[1]): chevron — opens drawer to pick any ReadingStatus list */}
                        <button
                            className="btn btn-primary rounded-l-none flex-[1] px-3"
                            onClick={() => setShowDrawer(true)}
                            disabled={isBusy}
                            aria-label="Choose reading status"
                        >
                            ▾
                        </button>
                    </>
                )}
            </div>

            {/* Drawer: pick a ReadingStatus list or remove */}
            <DrawerModal open={showDrawer} onClose={() => setShowDrawer(false)}>
                {(close) => (
                    <div className="px-4 pb-2">
                        <h3 className="font-semibold text-base mb-3 text-center">Reading Status</h3>

                        {userReadingStatusLists.length === 0 && (
                            <p className="text-sm text-text-muted text-center py-4">
                                No Reading Status lists found. Create one from My Lists.
                            </p>
                        )}

                        {/* One row per ReadingStatus list */}
                        {userReadingStatusLists.map(list => (
                            <button
                                key={list.id}
                                className="w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors"
                                onClick={() => handleSelectList(list.id, close)}
                                disabled={isBusy}
                            >
                                {/* Checkmark when this is the currently active list */}
                                <span className="w-5 text-center text-sm">
                                    {activeStatusList?.id === list.id ? '✓' : ''}
                                </span>
                                <span>{list.name}</span>
                            </button>
                        ))}

                        {/* Remove option — only shown when item is in a ReadingStatus list */}
                        {activeStatusList && (
                            <>
                                <hr className="my-2 border-border" />
                                <button
                                    className="w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 text-danger transition-colors"
                                    onClick={() => handleRemove(close)}
                                    disabled={isBusy}
                                >
                                    <span className="w-5 text-center text-sm" />
                                    <span>Clear reading status</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </DrawerModal>
        </>
    );
}

import { useState } from 'react';
import type { ExternalApiSourceSummary } from '../../types/externalApiSource';
import type { FilterState, SearchType } from '../SearchBarWithFilters';
import ListCollageThumb from '../ListCollageThumb';
import RowItemContent from "../row_item_related/RowItemContent";
import type { RowItemDisplayProps } from '../../types/rowItemTypes';
import ConfirmModal from "./ConfirmModal";
import PaginationControls from "../PaginationControls";
import DrawerModal from './modal_frame/DrawerModal';
import DialogOverlay from './modal_frame/DialogOverlay';
import SearchBarWithFilters from '../SearchBarWithFilters';
import DetailSidePanel from './detail_panels/DetailSidePanel';
import type { ActiveDetail, DetailItemType } from './detail_panels/DetailSidePanel';
import { useIsMobile } from '../../hooks/useIsMobile';

interface LinkRowItem extends RowItemDisplayProps {
    id: string;
    countLabel?: string; // Optional right-side count of the links
    hasModifyLinkAccess?: boolean // Used for the click guard: blocks toggling rows the user cannot edit.
    //     For example, you can add a MediaItem to your own MediaList
    //     but not to a list that isn't owned by you (Note: In the future, I will want to implement public/shared MediaLists)
    detailType?: DetailItemType;   // When set, the ⓘ icon appears and opens the detail panel
    apiSourceName?: string;        // mediaApiRef only — needed for the detail panel route link
    previewThumbnailUrls?: string[];  // mediaList only — renders a collage instead of a single photo
}

// A tab in tabbed mode. The parent owns which candidates go in each tab — the modal just renders them.
interface ModalTab {
    label: string;
    candidates: LinkRowItem[];
}

interface ManageLinkModalProps {
    modalTitle: string;

    // SearchBarWithFilters integration — replaces the old plain input
    allowedSearchTypes?: SearchType[];  // restrict type pills; undefined = show all 3
    activeApiSources?: ExternalApiSourceSummary[];
    defaultApiSourceId?: number | null;
    isModerator?: boolean;
    isAdmin?: boolean;
    roleLevel?: string | null;
    // Called on search submit so the parent can drive server-side search
    onSearch?: (query: string, filters: FilterState, bypassCache: boolean) => void;

    // Two display modes — provide exactly one:
    // -- Tabbed mode: pass `tabs` — the parent controls which candidates appear in each tab.
    //    Example (MediaItemDetailPage): Tab "My Lists" + Tab "All Visible Lists"
    // -- Flat mode: pass `candidates` — a single list with no tabs.
    //    Example (MediaListDetailPage): all MediaItems, no tabs
    tabs?: ModalTab[];
    candidates?: LinkRowItem[];
    candidatesLoading: boolean;  // Show loading symbol when loading

    initialLinkedIds: string[]; //Items already linked - pre-checked on opening this modal

    // Both are optional.
    // If both onAdd AND onRemove are omitted, modal runs in DEFERRED mode:
    // aka means that the toggles are tracked locally but no API calls are made
    // onClose then returns the final select array for the parent to use (ex: at form submit)
    // If only one is provided, that direction is SYNC and the other falls back to DEFERRED (local-only, no API call).
    onAdd?: (id: string, note?: string) => Promise<void>;
    onRemove?: (id: string) => Promise<void>;

    // When provided, renders a note/reason textarea above the candidate list.
    // The typed note is passed as the second argument to onAdd.
    noteInput?: { label?: string; placeholder?: string };

    // Confirm Modal's string details,
    // Using Confirm Modal here to confirm before removing an item link
    removeConfirmTitle?: string;
    getRemoveConfirmMessage?: (item: LinkRowItem) => string;

    pagination?: { page: number; totalPages?: number; hasNextPage: boolean; hasPreviousPage: boolean };
    onPageChange?: (page: number) => void;

    // When provided, shows a RowItemContent row at the top of the modal representing
    // the item that was clicked to open this modal (the "subject" of the linking action).
    focusedItem?: Pick<RowItemDisplayProps, 'firstString' | 'secondString' | 'photographOnLeft'>;

    // Map of row item id → note from the join table for the link between that row item and the focused item.
    // When provided, the note is shown in the detail side panel for already-linked rows.
    linkNotes?: Record<string, string | null | undefined>;

    onClose: (updatedLinkedIds: string[]) => void;
}

// 2 Modes:
// -- SYNC mode: live add/remove: Every time an onAdd or onRemove is called (aka an item is selected/deselected), the API is called
// -- DEFERRED mode: omit onAdd + onRemove functions so there are no API calls. Parent item (aka who is calls this modal) reads final set from onClose()


export default function ManageLinkModal({
    modalTitle,
    allowedSearchTypes,
    activeApiSources,
    defaultApiSourceId,
    isModerator,
    isAdmin,
    roleLevel,
    onSearch,
    tabs,
    candidates,
    candidatesLoading,

    initialLinkedIds,

    onAdd,
    onRemove,

    removeConfirmTitle,
    getRemoveConfirmMessage,

    pagination,
    onPageChange,

    noteInput,
    focusedItem,
    linkNotes,

    onClose
}: ManageLinkModalProps){

    // this is the local list that keeps track of which are selected in the modal list
    const [linkedIds, setLinkedIds] = useState<string[]>(initialLinkedIds);

    const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());  // in-flight adds (the request was already sent, now I am waiting to get confirmation from the backend that it worked)
    const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);  // waiting for confirm for removing a link
    // last submitted query — used for client-side candidate filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTabIndex, setActiveTabIndex] = useState(0);  // only used in tabbed mode

    // Detail side panel state — null means the panel is closed
    const [activeDetail, setActiveDetail] = useState<ActiveDetail | null>(null);

    const [note, setNote] = useState('');

    // last submitted filters — passed back as urlFilters to SearchBarWithFilters (no URL in a modal)
    const defaultType = allowedSearchTypes?.[0] ?? 'media'
    const [committedFilters, setCommittedFilters] = useState<FilterState>({
        searchType: defaultType,
        apiSourceId: defaultApiSourceId ?? null,
        // lists default to 'mine' (you manage your own lists); tags default to 'all' (tags are shared)
        subtype: defaultType === 'media' ? undefined : defaultType === 'lists' ? 'mine' : 'all',
    })

    // Mobile: DrawerModal (slide-up, thumb-reachable). Desktop: DialogOverlay (centered panel).
    const isMobile = useIsMobile();

    function handleSearch(query: string, filters: FilterState, bypassCache: boolean) {
        setSearchQuery(query)
        setCommittedFilters(filters)
        onSearch?.(query, filters, bypassCache)
    }

    // Resolve the active candidate list:
    // -- Tabbed mode: use the active tab's candidates
    // -- Flat mode: use the single candidates array
    // If there is only 1 tab: activateCandidates is a list.
    // If there are 2+ tabs, activateCandidates is a list of lists
    const activeCandidates = tabs ? (tabs[activeTabIndex]?.candidates ?? []) : (candidates ?? []);

    // Apply client-side text filter on top of whatever candidates the parent passed in.
    // For Tab 1 (pre-loaded): this filters locally.
    // For Tab 2 (server-searched): the parent already narrowed results server-side; this adds a local refinement.
    const displayed = activeCandidates
        .filter(c => c.firstString.toLowerCase().includes(searchQuery.toLowerCase()));

    // All candidates across all tabs (used to look up items by id for the ConfirmModal)
    const allCandidates = tabs ? tabs.flatMap(t => t.candidates) : (candidates ?? []);

    function rowStatusIcon(linked: boolean, pendingToAdd: boolean) {
        return (
            // a11y: aria-hidden so screen readers don't double-announce the state (aria-pressed on the button already conveys it)
            <span className="w-5 text-center shrink-0 text-primary" aria-hidden="true">
                {pendingToAdd ? '…' : linked ? '✓' : ''}
            </span>
        );
    }

    async function handleToggle(id: string) {
        const isLinked = linkedIds.includes(id);
        if (isLinked) {
            if (onRemove) {
                // SYNC mode: show confirm before removing
                setPendingRemoveId(id);
            } else {
                // DEFERRED mode: just deselect locally
                setLinkedIds(prev => prev.filter(x => x !== id));
            }
        } else {
            if (onAdd) {
                // SYNC mode: call API immediately
                setPendingAddIds(prev => new Set(prev).add(id));
                try {
                    await onAdd(id, note || undefined);
                    setLinkedIds(prev => [...prev, id]);
                    setNote('');  // auto-clear note after each successful submission
                    setActiveDetail(prev =>
                        prev?.id === id ? { ...prev, linkNote: note || null } : prev
                    );
                } catch {
                    // error toast handled by baseQueryWithErrorHandling in apiSlice
                } finally {
                    setPendingAddIds(prev => { const n = new Set(prev); n.delete(id); return n; });
                }
            } else {
                // DEFERRED mode: just select locally
                setLinkedIds(prev => [...prev, id]);
            }
        }
    }

    // Opens the detail side panel for a row — stopPropagation prevents the row toggle from firing
    function handleShowDetail(e: React.MouseEvent, item: LinkRowItem) {
        e.stopPropagation();
        if (!item.detailType) return; // guard: no panel available for items without a detailType
        setActiveDetail({
            type: item.detailType,
            id: item.id,
            apiSourceName: item.apiSourceName,
            name: item.firstString,
            secondString: item.secondString,
            thumbnail: item.photographOnLeft,
            linkNote: linkNotes?.[item.id],
        });
    }

    // Shared modal body — receives the correct close function for each frame type.
    // Mobile: close = DrawerModal's render-prop close (triggers slide-down animation).
    // Desktop: close = () => onClose(linkedIds) (direct, no animation needed).
    const renderContent = (closeModal: () => void) => (
        <div
            className={isMobile
                // Mobile: near-full height inside the DrawerModal shell (no bg/rounded — drawer provides those)
                ? "flex flex-col h-[90vh] overflow-hidden"
                // Desktop: full-viewport-minus-margin panel with its own background and rounded corners
                : "w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] flex flex-col bg-surface-raised text-text rounded-xl shadow-xl overflow-hidden"
            }
            onClick={e => e.stopPropagation()}
        >

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                {/* a11y: id matches titleId so the dialog's aria-labelledby points here */}
                <h2 id="manage-link-modal-title" className="font-semibold text-lg">{modalTitle}</h2>
                {/* closeModal uses the frame-specific close so the slide-down animation runs on mobile */}
                {/* a11y: aria-label names the close button for screen readers (✕ is not announced clearly) */}
                <button type="button" className="btn btn-secondary w-fit" onClick={closeModal} aria-label="Close modal">✕</button>
            </div>

            {/* Focused item — the subject of the linking action (e.g. the media item being tagged) */}
            {focusedItem && (
                <div className="px-4 py-2 border-b border-border shrink-0 bg-surface">
                    <RowItemContent
                        firstString={focusedItem.firstString}
                        secondString={focusedItem.secondString}
                        photographOnLeft={focusedItem.photographOnLeft}
                    />
                </div>
            )}

            {/* Search bar with type/API filters */}
            <div className="px-4 py-2 border-b border-border shrink-0">
                <SearchBarWithFilters
                    query={searchQuery}
                    defaultApiSourceId={defaultApiSourceId ?? null}
                    urlFilters={committedFilters}
                    activeApiSources={activeApiSources}
                    allowedSearchTypes={allowedSearchTypes}
                    isModerator={isModerator ?? false}
                    isAdmin={isAdmin ?? false}
                    roleLevel={roleLevel ?? null}
                    onSearch={handleSearch}
                    autoFocusOnMount={true}
                />
            </div>

            {/* Tab bar — only shown in tabbed mode (when `tabs` is provided) */}
            {/* a11y: role="tablist" marks this as a tab group so screen readers announce it correctly */}
            {tabs && (
                <div role="tablist" aria-label="Content tabs" className="flex border-b border-border shrink-0">
                    {tabs.map((tab, i) => (
                        <button
                            key={tab.label}
                            // a11y: id enables aria-controls wiring; role="tab" + aria-selected tell screen readers which tab is active
                            id={`manage-link-tab-${i}`}
                            role="tab"
                            aria-selected={activeTabIndex === i}
                            // a11y: aria-controls links each tab to the panel it controls
                            aria-controls="manage-link-tab-panel"
                            // a11y: min-h-[44px] meets WCAG 44px minimum touch target on mobile
                            className={`flex-1 py-2 min-h-[44px] text-sm ${activeTabIndex === i ? 'font-semibold border-b-2 border-primary text-primary' : 'text-text-muted'}`}
                            onClick={() => setActiveTabIndex(i)}
                        >{tab.label}</button>
                    ))}
                </div>
            )}

            {/* Note / reason input — shown when noteInput prop is provided */}
            {noteInput && (
                <div className="px-4 py-3 border-b border-border shrink-0">
                    {/* a11y: htmlFor links this label to the textarea so screen readers announce the field name */}
                    <label htmlFor="manage-link-note" className="text-xs text-text-muted mb-1 block">
                        {noteInput.label ?? 'Note (optional)'}
                    </label>
                    <textarea
                        id="manage-link-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={noteInput.placeholder ?? 'Add a reason for this tag...'}
                        rows={2}
                        className="w-full text-sm bg-surface border border-border rounded px-2 py-1.5 text-text placeholder-text-muted resize-none focus:outline-none focus:border-primary"
                    />
                </div>
            )}

            {/* Body: candidate rows + optional detail side panel, side by side */}
            <div className="flex flex-1 overflow-hidden">

                {/* Candidate rows — hidden on mobile when the detail panel is open (too narrow for 50/50 split) */}
                {(!isMobile || !activeDetail) && (
                    <div className={`flex flex-col overflow-hidden transition-all ${activeDetail ? 'w-1/2' : 'w-full'}`}>
                        {/* a11y: role="tabpanel" + aria-labelledby link this region to its controlling tab (tabbed mode only) */}
                        <div
                            className="flex-1 overflow-y-auto"
                            role={tabs ? "tabpanel" : undefined}
                            id={tabs ? "manage-link-tab-panel" : undefined}
                            aria-labelledby={tabs ? `manage-link-tab-${activeTabIndex}` : undefined}
                        >
                            {candidatesLoading ? (
                                // a11y: role="status" + aria-live announce the loading state to screen readers
                                <div className="p-4 opacity-50" role="status" aria-live="polite">Loading...</div>
                            ) : displayed.length === 0 ? (
                                // a11y: visible empty state so the silent blank list is never ambiguous
                                <p className="p-4 text-text-muted text-sm">No results found.</p>
                            ) : (
                                displayed.map(item => {
                                    const linked = linkedIds.includes(item.id);
                                    const pendingToAdd = pendingAddIds.has(item.id);
                                    return (
                                        // a11y: div wrapper + sibling buttons avoids invalid nested-button HTML
                                        <div
                                            key={item.id}
                                            className="flex items-center border-b border-border last:border-b-0"
                                        >
                                            {/* Main toggle button — takes up all remaining row space */}
                                            <button
                                                type="button"
                                                className={
                                                    `flex-1 text-left flex items-center gap-3 cursor-pointer px-2 py-2 hover:bg-border/30 ${linked ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`
                                                }
                                                // Guard: block clicks on rows where hasModifyLinkAccess is explicitly false
                                                // (Example: public lists the user can see but cannot edit)
                                                onClick={() => !pendingToAdd && item.hasModifyLinkAccess !== false && handleToggle(item.id)}
                                                // a11y: aria-pressed announces whether this item is currently linked/selected
                                                aria-pressed={linked}
                                                // a11y: aria-label describes the row action for screen readers
                                                aria-label={`${linked ? 'Remove link to' : 'Add link to'} ${item.firstString}`}
                                                // a11y: disabled prevents interaction for rows the user cannot edit
                                                disabled={item.hasModifyLinkAccess === false}
                                            >
                                                {rowStatusIcon(linked, pendingToAdd)}
                                                <div className="flex-1 min-w-0">
                                                    <RowItemContent
                                                        firstString={item.firstString}
                                                        secondString={item.secondString}
                                                        labelPill={item.labelPill}
                                                        photographOnLeft={item.previewThumbnailUrls ? undefined : item.photographOnLeft}
                                                        customLeftElement={item.previewThumbnailUrls ? <ListCollageThumb urls={item.previewThumbnailUrls} /> : undefined}
                                                    />
                                                </div>
                                                {item.countLabel && (
                                                    <span className="ml-auto text-sm opacity-50 shrink-0">
                                                        {item.countLabel}
                                                    </span>
                                                )}
                                            </button>
                                            {/* ⓘ detail button — sibling (not child) of the toggle button to avoid invalid nested-button HTML */}
                                            <button
                                                type="button"
                                                // a11y: min-h/min-w ensure 44px touch target on mobile per WCAG guidelines
                                                className="shrink-0 text-text-muted hover:text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                                onClick={e => handleShowDetail(e, item)}
                                                aria-label={`View details for ${item.firstString}`}
                                            >
                                                {/* a11y: aria-hidden so screen readers use the button's aria-label instead of announcing the character */}
                                                <span aria-hidden="true">ⓘ</span>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination footer — outside the scroll area so it stays pinned at the bottom */}
                        {pagination && (
                            <div className="px-4 py-2 border-t border-border shrink-0">
                                <PaginationControls
                                    page={pagination.page}
                                    totalPages={pagination.totalPages}
                                    hasNextPage={pagination.hasNextPage}
                                    hasPreviousPage={pagination.hasPreviousPage}
                                    onPageChange={onPageChange ?? (() => {})}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Detail side panel — full-width on mobile (replaces the list), half-width on desktop */}
                {activeDetail && (
                    <DetailSidePanel
                        detail={activeDetail}
                        onClose={() => setActiveDetail(null)}
                        fullWidth={isMobile}
                    />
                )}

            </div>
        </div>
    );

    return (
        <>
            {/* Mobile: DrawerModal slides up from bottom (thumb-reachable).
                Desktop: DialogOverlay centers the panel on screen.
                The close function passed to renderContent differs per frame:
                  mobile  → DrawerModal's render-prop close (triggers slide-down animation before unmount)
                  desktop → direct onClose call (no exit animation needed) */}
            {/* a11y: titleId="manage-link-modal-title" links the dialog's aria-labelledby to the visible heading */}
            {isMobile ? (
                <DrawerModal open={true} onClose={() => onClose(linkedIds)} titleId="manage-link-modal-title">
                    {(close) => renderContent(close)}
                </DrawerModal>
            ) : (
                <DialogOverlay onBackdropClick={() => onClose(linkedIds)} titleId="manage-link-modal-title" onEsc={() => onClose(linkedIds)}>
                    {renderContent(() => onClose(linkedIds))}
                </DialogOverlay>
            )}

            {/* The Confirm Modal for Potentially Removing a Link */}
            {pendingRemoveId !== null && (() => {
                const item = allCandidates.find(c => c.id === pendingRemoveId)!;  //Get the item to be removed from list of items
                return (
                    <ConfirmModal
                        title={removeConfirmTitle ?? 'Remove?'}
                        message={getRemoveConfirmMessage?.(item) ?? 'Are you sure?'}
                        confirmLabel="Remove"
                        onConfirm={async () => {

                            // Capture position BEFORE optimistic remove so rollback can restore it
                            const idx = linkedIds.indexOf(pendingRemoveId!);

                            // Optimistically remove
                            setLinkedIds(prev => prev.filter(x => x !== pendingRemoveId!));
                            setPendingRemoveId(null);
                            try {
                                // Call the input into this modal's function
                                // for calling the API to remove the link
                                await onRemove?.(item.id);
                                setActiveDetail(prev =>
                                    prev?.id === item.id ? { ...prev, linkNote: null } : prev
                                );
                            } catch {

                                // If the remove failed, restore the item at its original position.
                                // idx=-1 guard: append to end as a safe fallback.
                                setLinkedIds(prev => {
                                    const copy = [...prev];
                                    copy.splice(idx >= 0 ? idx : prev.length, 0, item.id);
                                    return copy;
                                });
                                // error toast handled by baseQueryWithErrorHandling in apiSlice
                            }
                        }}
                        onCancel={() => setPendingRemoveId(null)}
                    />
                );
            })()}
        </>
    )

}


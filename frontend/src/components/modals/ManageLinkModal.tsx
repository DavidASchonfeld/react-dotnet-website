import { useState } from 'react';
import RowItemContent from "../row_item_related/RowItemContent";
import type { RowItemDisplayProps } from '../../types/rowItemTypes';
import ConfirmModal from "./ConfirmModal";
import PaginationControls from "../PaginationControls";
import DialogOverlay from './DialogOverlay';
import SearchBarWithFilters from '../SearchBarWithFilters';
import type { FilterState, SearchType } from '../SearchBarWithFilters';
import type { ExternalApiSourceSummary } from '../../types/externalApiSource';
import DetailSidePanel from './detail_panels/DetailSidePanel';
import type { ActiveDetail, DetailItemType } from './detail_panels/DetailSidePanel';

interface LinkRowItem extends RowItemDisplayProps {
    id: string;
    countLabel?: string; // Optional right-side count of the links
    hasModifyLinkAccess?: boolean // Used for the click guard: blocks toggling rows the user cannot edit.
    //     For example, you can add a MediaItem to your own MediaList
    //     but not to a list that isn't owned by you (Note: In the future, I will want to implement public/shared MediaLists)
    detailType?: DetailItemType;   // When set, the ⓘ icon appears and opens the detail panel
    apiSourceName?: string;        // mediaApiRef only — needed for the detail panel route link
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
        subtype: defaultType === 'media' ? undefined : 'all',
    })

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
            <span className="w-5 text-center shrink-0 text-primary">
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
        setActiveDetail({
            type: item.detailType!,
            id: item.id,
            apiSourceName: item.apiSourceName,
            name: item.firstString,
            secondString: item.secondString,
            thumbnail: item.photographOnLeft,
            linkNote: linkNotes?.[item.id],
        });
    }

    return (
        <>
            {/* Backdrop — click outside to close */}
            <DialogOverlay onBackdropClick={() => onClose(linkedIds)}>
            {/* Modal panel */}
            <div className="w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] flex flex-col bg-surface-raised text-text rounded-xl shadow-xl overflow-hidden"
                 onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <h2 className="font-semibold text-lg">{modalTitle}</h2>
                    <button className="btn btn-secondary w-fit" onClick={() => onClose(linkedIds)}>✕</button>
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
                    />
                </div>

                {/* Tab bar — only shown in tabbed mode (when `tabs` is provided) */}
                {tabs && (
                    <div className="flex border-b border-border shrink-0">
                        {tabs.map((tab, i) => (
                            <button
                                key={tab.label}
                                className={`flex-1 py-2 text-sm ${activeTabIndex === i ? 'font-semibold border-b-2 border-primary text-primary' : 'text-text-muted'}`}
                                onClick={() => setActiveTabIndex(i)}
                            >{tab.label}</button>
                        ))}
                    </div>
                )}

                {/* Note / reason input — shown when noteInput prop is provided */}
                {noteInput && (
                    <div className="px-4 py-3 border-b border-border shrink-0">
                        <label className="text-xs text-text-muted mb-1 block">
                            {noteInput.label ?? 'Note (optional)'}
                        </label>
                        <textarea
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

                    {/* Candidate rows — shrinks to half width when the detail panel is open */}
                    <div className={`flex flex-col overflow-hidden transition-all ${activeDetail ? 'w-1/2' : 'w-full'}`}>
                        <div className="flex-1 overflow-y-auto">
                            {candidatesLoading ? (
                                <div className="p-4 opacity-50">Loading...</div>
                            ) : (
                                displayed.map(item => {
                                    const linked = linkedIds.includes(item.id);
                                    const pendingToAdd = pendingAddIds.has(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            className={
                                                `flex items-center gap-3 cursor-pointer px-2 py-2 border-b border-border last:border-b-0 hover:bg-border/30 ${linked ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`
                                            }
                                            // Guard: block clicks on rows where hasModifyLinkAccess is explicitly false
                                            // (Example: public lists the user can see but cannot edit)
                                            onClick={() => !pendingToAdd && item.hasModifyLinkAccess !== false && handleToggle(item.id)}
                                        >
                                            {rowStatusIcon(linked, pendingToAdd)}
                                            <div className="flex-1 min-w-0">
                                                <RowItemContent
                                                    firstString={item.firstString}
                                                    secondString={item.secondString}
                                                    labelPill={item.labelPill}
                                                    photographOnLeft={item.photographOnLeft}
                                                />
                                            </div>
                                            {rowStatusIcon(linked, pendingToAdd)}
                                            {item.countLabel && (
                                                <span className="ml-auto text-sm opacity-50 shrink-0">
                                                    {item.countLabel}
                                                </span>
                                            )}
                                            {/* ⓘ icon — opens the detail panel without toggling the row */}
                                            {item.detailType && (
                                                <button
                                                    className="shrink-0 text-text-muted hover:text-primary p-2"
                                                    onClick={e => handleShowDetail(e, item)}
                                                    aria-label={`View details for ${item.firstString}`}
                                                >
                                                    ⓘ
                                                </button>
                                            )}
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

                    {/* Detail side panel — shown when a row's ⓘ icon is clicked */}
                    {activeDetail && (
                        <DetailSidePanel
                            detail={activeDetail}
                            onClose={() => setActiveDetail(null)}
                        />
                    )}

                </div>
            </div>
            </DialogOverlay>

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

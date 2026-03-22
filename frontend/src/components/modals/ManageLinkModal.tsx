import { useState } from 'react';
import type { ReactNode } from 'react';
import { safeToast } from "../../utils/safeToast";
import RowItemContent from "../RowItemContent";
import RowItemStyling from "../RowItemStyling";
import ConfirmModal from "./ConfirmModal";
import AnimatedPage from '../AnimatedPage';

interface LinkRowItem {
    id: string;
    primaryLabel: string;  // Main name (Ex: MediaItem Name I am focusing on)
    secondaryLabel?: string; // Optional subtitle
    countLabel?: string; // Optional right-side count of the links
    labelComponent?: ReactNode;  // Ex: <MediaTypeLabel
    hasModifyLinkAccess?: boolean // Used for the click guard: blocks toggling rows the user cannot edit.
    //     For example, you can add a MediaItem to your own MediaList
    //     but not to a list that isn't owned by you (Note: In the future, I will want to implement public/shared MediaLists)
}

// A tab in tabbed mode. The parent owns which candidates go in each tab — the modal just renders them.
interface ModalTab {
    label: string;
    candidates: LinkRowItem[];
}

interface ManageLinkModalProps {
    modalTitle: string;
    searchPlaceholder?: string;
    // Called on every keystroke so the parent can drive server-side search
    onSearchChange?: (query: string) => void;

    // Two display modes — provide exactly one:
    // -- Tabbed mode: pass `tabs` — the parent controls which candidates appear in each tab.
    //    Example (MediaItemDetailPage): Tab "My Lists" + Tab "All Visible Lists"
    // -- Flat mode: pass `candidates` — a single list with no tabs.
    //    Example (MediaListDetailPage): all MediaItems, no tabs
    tabs?: ModalTab[];
    candidates?: LinkRowItem[];
    candidatesLoading: boolean;  // Show loading symbol when loading

    initialLinkedIds: Set<string>; //Items already linked - pre-checked on opening this modal

    // Both are optional.
    // If both onAdd AND onRemove are omitted, modal runs in DEFERRED mode:
    // aka means that the toggles are tracked locally but no API calls are made
    // onClose then returns the final select Set for the parent to use (ex: at form submit)
    // If only one is provided, that direction is SYNC and the other falls back to DEFERRED (local-only, no API call).
    onAdd?: (id: string) => Promise<void>;
    onRemove?: (id: string) => Promise<void>;

    // Confirm Modal's string details,
    // Using Confirm Modal here to confirm before removing an item link
    removeConfirmTitle?: string;
    getRemoveConfirmMessage?: (item: LinkRowItem) => string;

    onClose: (updatedLinkedIds: Set<string>) => void;
}

// 2 Modes:
// -- SYNC mode: live add/remove: Every time an onAdd or onRemove is called (aka an item is selected/deselected), the API is called
// -- DEFERRED mode: omit onAdd + onRemove functions so there are no API calls. Parent item (aka who is calls this modal) reads final set from onClose()


export default function ManageLinkModal({
    modalTitle,
    searchPlaceholder,
    onSearchChange,
    tabs,
    candidates,
    candidatesLoading,

    initialLinkedIds,

    onAdd,
    onRemove,

    removeConfirmTitle,
    getRemoveConfirmMessage,

    onClose
}: ManageLinkModalProps){

    // this is the local list that keeps track of which are selected in the modal list
    const [linkedIds, setLinkedIds] = useState<Set<string>>(initialLinkedIds);

    const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());  // in-flight adds (the request was already sent, now I am waiting to get confirmation from the backend that it worked)
    const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);  // waiting for confirm for removing a link
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTabIndex, setActiveTabIndex] = useState(0);  // only used in tabbed mode

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
        .filter(c => c.primaryLabel.toLowerCase().includes(searchQuery.toLowerCase()));

    // All candidates across all tabs (used to look up items by id for the ConfirmModal)
    const allCandidates = tabs ? tabs.flatMap(t => t.candidates) : (candidates ?? []);

    async function handleToggle(id: string) {
        const isLinked = linkedIds.has(id);
        if (isLinked) {
            if (onRemove) {
                // SYNC mode: show confirm before removing
                setPendingRemoveId(id);
            } else {
                // DEFERRED mode: just deselect locally
                setLinkedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
            }
        } else {
            if (onAdd) {
                // SYNC mode: call API immediately
                setPendingAddIds(prev => new Set(prev).add(id));
                try {
                    await onAdd(id);
                    setLinkedIds(prev => new Set(prev).add(id));
                } catch {
                    safeToast.error('Failed to add');
                } finally {
                    setPendingAddIds(prev => { const n = new Set(prev); n.delete(id); return n; });
                }
            } else {
                // DEFERRED mode: just select locally
                setLinkedIds(prev => new Set(prev).add(id));
            }
        }
    }

    return (
        <>
            {/* Backdrop — click outside to close */}
            <div className="modal-overlay" onClick={() => onClose(linkedIds)}>
            <AnimatedPage>
            {/* Modal panel */}
            <div className="w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] flex flex-col bg-surface-raised text-text rounded-xl shadow-xl overflow-hidden"
                 onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="font-semibold text-lg">{modalTitle}</h2>
                    <button className="btn btn-secondary w-fit" onClick={() => onClose(linkedIds)}>✕</button>
                </div>

                {/* Search bar */}
                <div className="px-4 py-2 border-b border-border">
                    <input
                        placeholder={searchPlaceholder ?? 'Search...'}
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); onSearchChange?.(e.target.value); }}
                        className="form-input w-full"
                    />
                </div>

                {/* Tab bar — only shown in tabbed mode (when `tabs` is provided) */}
                {tabs && (
                    <div className="flex border-b border-border">
                        {tabs.map((tab, i) => (
                            <button
                                key={tab.label}
                                className={`flex-1 py-2 text-sm ${activeTabIndex === i ? 'font-semibold border-b-2 border-primary text-primary' : 'text-text-muted'}`}
                                onClick={() => setActiveTabIndex(i)}
                            >{tab.label}</button>
                        ))}
                    </div>
                )}

                {/* Candidate rows */}
                <div className="flex-1 overflow-y-auto">
                    {candidatesLoading ? (
                        <div className="p-4 opacity-50">Loading...</div>
                    ) : (
                        displayed.map(item => {
                            const linked = linkedIds.has(item.id);
                            const pendingToAdd = pendingAddIds.has(item.id);
                            return (
                                <div
                                    key={item.id}
                                    className={
                                        `flex items-center gap-3 cursor-pointer rounded px-2 ${linked ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`
                                    }
                                    // Guard: block clicks on rows where hasModifyLinkAccess is explicitly false
                                    // (Example: public lists the user can see but cannot edit)
                                    onClick={() => !pendingToAdd && item.hasModifyLinkAccess !== false && handleToggle(item.id)}
                                >
                                    {/* Check Mark / Loading Indicator */}
                                    <span className="w-5 text-center shrink-0 text-primary">
                                        {pendingToAdd ? '…' : linked ? '✓' : ''}
                                    </span>
                                    <RowItemStyling>
                                        <RowItemContent
                                            firstString={item.primaryLabel}
                                            secondString={item.secondaryLabel}
                                            labelPill={item.labelComponent}
                                        />
                                    </RowItemStyling>
                                    {item.countLabel && (
                                        <span className="ml-auto text-sm opacity-50 shrink-0">
                                            {item.countLabel}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            </AnimatedPage>
            </div>

            {/* The Confirm Modal for Potentially Removing a Link */}
            {pendingRemoveId !== null && (() => {
                const item = allCandidates.find(c => c.id === pendingRemoveId)!;  //Get the item to be removed from list of items
                return (
                    <ConfirmModal
                        title={removeConfirmTitle ?? 'Remove?'}
                        message={getRemoveConfirmMessage?.(item) ?? 'Are you sure?'}
                        confirmLabel="Remove"
                        onConfirm={async () => {

                            // Optimistically remove
                            setLinkedIds(prev => {const n = new Set(prev); n.delete(pendingRemoveId!); return n;})
                            setPendingRemoveId(null);
                            try {
                                // Call the input into this modal's function
                                // for calling the API to remove the link
                                await onRemove?.(item.id);
                            } catch {

                                // If the remove failed, read the item back into the list.
                                //TODO: This does NOT work IF certain lists require positions
                                setLinkedIds(prev => new Set(prev).add(item.id));
                                safeToast.error('Failed to remove');
                            }
                        }}
                        onCancel={() => setPendingRemoveId(null)}
                    />
                );
            })()}
        </>
    )

}

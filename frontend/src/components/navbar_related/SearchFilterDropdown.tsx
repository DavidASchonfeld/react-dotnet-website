import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetActiveApiSourcesQuery } from '../../services/apiSlice'
import { API_SOURCE_META } from '../../constants'

interface SearchFilterDropdownProps {
    selectedApiSourceId?: number | null
    onApiSourceChange?: (id: number) => void
    // Controls dropdown panel direction: top nav opens downward, left nav opens rightward
    isTop: boolean
}

// Declared at module level (outside SearchFilterDropdown) so React sees a stable component
// reference across renders — avoids the "Cannot create components during render" error
const OptionButton = ({
    label,
    icon,
    ariaLabel,
    active,
    onClick,
}: {
    label: string
    icon?: string          // primary emoji for the API source (e.g. 🎬 for OMDB)
    ariaLabel?: string     // descriptive label for screen readers (e.g. "OMDB — Movies & TV Shows")
    active: boolean
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        // a11y: aria-label gives screen readers a richer description than the visible text alone
        aria-label={ariaLabel ?? label}
        // a11y: aria-pressed announces selected/deselected state to screen readers
        aria-pressed={active}
        className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-surface rounded-md
            ${active ? 'text-primary font-medium' : 'text-text/70'}`}
    >
        {/* Filled/empty circle to visually indicate selected state */}
        <span className={`text-xs ${active ? 'text-primary' : 'text-text/30'}`} aria-hidden="true">
            {active ? '●' : '○'}
        </span>
        {/* a11y: aria-hidden hides decorative emoji from screen readers (ariaLabel covers it) */}
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
    </button>
)

export default function SearchFilterDropdown({
    selectedApiSourceId,
    onApiSourceChange,
    isTop,
}: SearchFilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { data: activeSources } = useGetActiveApiSourcesQuery()

    return (
        <div className="relative">

            {/* [▼ Filter] toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-1 text-sm rounded-lg hover:bg-white/10 transition-colors text-text/80 border border-border/60"
                title="Search filters"
                // a11y: aria-label + aria-expanded give screen readers button purpose and open/closed state
                aria-label="Search filters"
                aria-expanded={isOpen}
            >
                <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
                <span className="hidden sm:inline text-xs">Filter</span>
            </button>

            {isOpen && (
                <>
                    {/* Invisible overlay — clicking outside closes the dropdown (same pattern as Navbar user menu) */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown panel — opens below in top mode, opens rightward in left sidebar mode */}
                    <div
                        className={`navbar-dropdown absolute z-50 min-w-[180px] bg-surface-raised rounded-xl shadow-2xl border border-border overflow-hidden
                            ${isTop ? 'top-full left-0 mt-2' : 'top-0 left-full ml-2'}`}
                        onClick={e => e.stopPropagation()} // keep open when clicking inside
                    >

                        {/* Source section */}
                        <div className="px-3 pt-3 pb-1">
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                                Source
                            </p>
                            {activeSources && activeSources.length > 0 && activeSources.map(source => {
                                // Look up emoji + description for this API (e.g. 🎬 / "Movies & TV Shows" for OMDB)
                                const meta = API_SOURCE_META[source.apiName]
                                return (
                                    <OptionButton
                                        key={source.id}
                                        label={source.apiName}
                                        icon={meta?.icon}
                                        ariaLabel={meta ? `${source.apiName} — ${meta.description}` : source.apiName}
                                        active={selectedApiSourceId === source.id}
                                        onClick={() => onApiSourceChange?.(source.id)}
                                    />
                                )
                            })}
                        </div>

                        {/* Advanced Search link — divides basic filters from complex/role-gated options */}
                        <div className="border-t border-border mt-1">
                            <Link
                                to="/search?showFilters=true"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-text/70 hover:bg-surface hover:text-text transition-colors"
                            >
                                Advanced Search
                                <span className="text-text/40 text-xs">→</span>
                            </Link>
                        </div>

                    </div>
                </>
            )}
        </div>
    )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetActiveApiSourcesQuery } from '../services/apiSlice'

// Search types the user can switch between
type SearchType = 'media' | 'tags' | 'lists'
type SearchScope = 'all' | 'mine'

interface SearchFilterDropdownProps {
    searchType: SearchType
    scope: SearchScope
    onSearchTypeChange: (type: SearchType) => void
    onScopeChange: (scope: SearchScope) => void
    selectedApiSourceId?: number | null
    onApiSourceChange?: (id: number) => void
    // Controls dropdown panel direction: top nav opens downward, left nav opens rightward
    isTop: boolean
}

// Declared at module level (outside SearchFilterDropdown) so React sees a stable component
// reference across renders — avoids the "Cannot create components during render" error
const OptionButton = ({
    label,
    active,
    onClick,
}: {
    label: string
    active: boolean
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-surface rounded-md
            ${active ? 'text-primary font-medium' : 'text-text/70'}`}
    >
        {/* Filled/empty circle to visually indicate selected state */}
        <span className={`text-xs ${active ? 'text-primary' : 'text-text/30'}`}>
            {active ? '●' : '○'}
        </span>
        {label}
    </button>
)

export default function SearchFilterDropdown({
    searchType,
    scope,
    onSearchTypeChange,
    onScopeChange,
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
                        className={`absolute z-50 min-w-[180px] bg-surface-raised rounded-xl shadow-2xl border border-border overflow-hidden
                            ${isTop ? 'top-full left-0 mt-2' : 'top-0 left-full ml-2'}`}
                        onClick={e => e.stopPropagation()} // keep open when clicking inside
                    >

                        {/* Search type section */}
                        <div className="px-3 pt-3 pb-1">
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                                Type
                            </p>
                            <OptionButton
                                label="Media"
                                active={searchType === 'media'}
                                onClick={() => onSearchTypeChange('media')}
                            />
                            {/* API source sub-options — shown when Media is selected */}
                            {searchType === 'media' && activeSources && activeSources.length > 0 && (
                                <div className="pl-4 flex flex-col">
                                    {activeSources.map(source => (
                                        <OptionButton
                                            key={source.id}
                                            label={source.apiName}
                                            active={selectedApiSourceId === source.id}
                                            onClick={() => onApiSourceChange?.(source.id)}
                                        />
                                    ))}
                                </div>
                            )}
                            <OptionButton
                                label="Tags"
                                active={searchType === 'tags'}
                                onClick={() => onSearchTypeChange('tags')}
                            />
                            <OptionButton
                                label="Lists"
                                active={searchType === 'lists'}
                                onClick={() => onSearchTypeChange('lists')}
                            />
                        </div>

                        {/* Scope section — hidden for Media because external APIs have no "mine" concept */}
                        {searchType !== 'media' && (
                            <div className="px-3 py-1">
                                <div className="h-px bg-border my-1" />
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                                    Scope
                                </p>
                                <OptionButton
                                    label="All"
                                    active={scope === 'all'}
                                    onClick={() => onScopeChange('all')}
                                />
                                <OptionButton
                                    label="Mine"
                                    active={scope === 'mine'}
                                    onClick={() => onScopeChange('mine')}
                                />
                            </div>
                        )}

                        {/* Advanced Search link — divides basic filters from complex/role-gated options */}
                        <div className="border-t border-border mt-1">
                            <Link
                                to="/search/advanced"
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

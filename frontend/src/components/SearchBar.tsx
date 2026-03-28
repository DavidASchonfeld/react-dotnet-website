import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useLazySearchExternalApiQuery,
    useGetActiveApiSourcesQuery,
} from '../services/apiSlice'
import type { ExternalApiSearchResult } from '../types/externalApiSearch'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '../constants'
import RowItemContent from './row_item_related/RowItemContent'
import { routes } from '../utils/routes'
import { canSearch } from '../utils/searchUtils'
import type { SearchType } from '../utils/searchUtils'

interface SearchBarProps {
    // 'typeahead': live dropdown as you type (used in Navbar)
    // 'on-submit': triggers only on Enter key or Search button click (used in SearchResultsPage)
    mode: 'typeahead' | 'on-submit'
    isTop: boolean               // from Navbar — controls horizontal vs vertical layout
    effectiveMinimized: boolean  // collapse the bar when navbar is minimized
    defaultQuery?: string        // pre-fill from URL params (on-submit mode)
    defaultApiSourceId?: number  // pre-fill from URL params (on-submit mode)
    searchType?: SearchType      // undefined defaults to 'media' for backward compat
    // apiSourceId is optional — Navbar passes only query (filter dropdown handles type/scope separately)
    onSubmit?: (query: string, apiSourceId?: number) => void
    // When false, hides the API source pill selector (Navbar uses its own SearchFilterDropdown instead)
    showApiSourcePills?: boolean
    // When false, hides the Search button (Navbar submits via Enter key instead)
    showSearchButton?: boolean
}

export default function SearchBar({
    mode,
    isTop,
    effectiveMinimized,
    defaultQuery = '',
    defaultApiSourceId,
    searchType,
    onSubmit,
    showApiSourcePills = true, // default true preserves backward compat for SearchResultsPage
    showSearchButton = true,
}: SearchBarProps) {
    const navigate = useNavigate()

    const [inputQuery, setInputQuery] = useState(defaultQuery)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [dropdownResults, setDropdownResults] = useState<ExternalApiSearchResult[]>([])
    const [searchLabelExpanded, setSearchLabelExpanded] = useState(false)

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { data: activeSources } = useGetActiveApiSourcesQuery()

    // Default to first available API source once loaded
    const [selectedApiSourceId, setSelectedApiSourceId] = useState<number | null>(
        defaultApiSourceId ?? null
    )

    // Derive effective API source ID: use selected value or fall back to defaultApiSourceId, then first available
    const effectiveSelectedApiSourceId = selectedApiSourceId ?? (defaultApiSourceId !== undefined ? defaultApiSourceId : activeSources?.[0]?.id) ?? null

    // Sync defaultQuery / defaultApiSourceId changes (when URL params update on SearchResultsPage)
    useEffect(() => {
        setInputQuery(defaultQuery)
    }, [defaultQuery])

    useEffect(() => {
        if (defaultApiSourceId !== undefined) {
            setSelectedApiSourceId(defaultApiSourceId)
        }
    }, [defaultApiSourceId])

    const [triggerSearch, { isFetching: isSearching }] = useLazySearchExternalApiQuery()
    // ---- Typeahead debounced search ----
    const handleInputChange = useCallback((value: string) => {
        setInputQuery(value)

        if (mode !== 'typeahead') return

        if (debounceTimer.current) clearTimeout(debounceTimer.current)

        if (value.length < SEARCH_MIN_CHARS || effectiveSelectedApiSourceId === null) {
            setDropdownResults([])
            setIsDropdownOpen(false)
            return
        }

        const selectedSource = activeSources?.find(s => s.id === effectiveSelectedApiSourceId)
        if (!selectedSource) return

        debounceTimer.current = setTimeout(async () => {
            const result = await triggerSearch({
                query: value,
                mediaTypeId: selectedSource.mediaTypeId,
                limit: 5,
            })
            if (result.data?.data) {
                setDropdownResults(result.data.data)
                setIsDropdownOpen(result.data.data.length > 0)
            }
        }, SEARCH_DEBOUNCE_MS)
    }, [mode, effectiveSelectedApiSourceId, activeSources, triggerSearch])

    // ---- On-Submit handler (Enter key or Search button) ----
    const handleSubmit = useCallback(() => {
        if (!canSearch(inputQuery, searchType ?? 'media', effectiveSelectedApiSourceId)) return
        onSubmit?.(inputQuery, effectiveSelectedApiSourceId ?? undefined)
    }, [inputQuery, searchType, effectiveSelectedApiSourceId, onSubmit])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSubmit()
    }, [handleSubmit])

    // ---- Typeahead result click: navigate directly to detail page ----
    const handleResultClick = useCallback((result: ExternalApiSearchResult) => {
        if (effectiveSelectedApiSourceId === null) return

        const activeSource = activeSources?.find(s => s.id === effectiveSelectedApiSourceId)
        if (!activeSource) return

        setIsDropdownOpen(false)
        setInputQuery(result.name)
        navigate(routes.mediaApiRef(activeSource.apiName, result.externalId))
    }, [effectiveSelectedApiSourceId, activeSources, navigate])

    const handleClear = useCallback(() => {
        setInputQuery('')
        setDropdownResults([])
        setIsDropdownOpen(false)
    }, [])

    const handleSourceSelect = useCallback((sourceId: number) => {
        setSelectedApiSourceId(sourceId)
        setDropdownResults([])
        setIsDropdownOpen(false)
    }, [])

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    }, [])

    // ---- Hide entirely when minimized ----
    if (effectiveMinimized) return null

    const selectedSource = activeSources?.find(s => s.id === selectedApiSourceId)

    return (
        <div className={`relative flex items-center ${isTop ? 'flex-row gap-1' : 'flex-col gap-1 w-full'}`}>

            {/* Input row */}
            <div className={`relative flex items-center gap-1 ${isTop ? 'w-32 focus-within:w-52 transition-all duration-300' : 'w-full'}`}>
                {/* a11y: sr-only label so screen readers announce "Search" when the input receives focus */}
                <label htmlFor="site-search" className="sr-only">Search</label>
                <input
                    id="site-search"
                    type="text"
                    value={inputQuery}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedSource ? `${selectedSource.apiName}…` : searchType === 'lists' ? 'Lists…' : searchType === 'tags' ? 'Tags…' : 'Search…'}
                    /* rounded-full: pill shape for the search input; bg-primary/5 adds a barely-visible tint */
                    className={`form-input pl-3 pr-8 py-1 text-sm w-full rounded-full ${isTop ? 'bg-primary/5' : ''}`}
                    // a11y: aria-expanded tells screen readers whether the typeahead dropdown is currently open
                    aria-expanded={mode === 'typeahead' ? isDropdownOpen : undefined}
                    // a11y: aria-controls links the input to its dropdown listbox for screen readers
                    aria-controls={mode === 'typeahead' ? 'search-suggestions' : undefined}
                    // a11y: combobox role tells screen readers this input drives a dropdown selection widget
                    role={mode === 'typeahead' ? 'combobox' : undefined}
                    aria-autocomplete={mode === 'typeahead' ? 'list' : undefined}
                />
                {/* Absolute icon area: clear button + search icon side by side, positioned at the right of the input */}
                <div className="absolute right-2 flex items-center gap-0 text-text/50">
                    {/* a11y: clear button — separate from search-submit so there is no nested button (invalid HTML) */}
                    {inputQuery.length > 0 && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleClear() }}
                            className="text-xs leading-none px-1 py-1 hover:text-text"
                            title="Clear"
                            // a11y: aria-label names the clear button for screen readers
                            aria-label="Clear search"
                            tabIndex={-1}
                        >
                            ✕
                        </button>
                    )}
                    {/* a11y: search-submit button — converted from <span> so keyboard users can activate it with Enter/Space */}
                    <button
                        type="button"
                        className="flex items-center hover:text-text/70 transition-colors duration-200 px-1"
                        onClick={handleSubmit}
                        onMouseLeave={() => setSearchLabelExpanded(false)}
                        // a11y: aria-label names this icon button so screen readers announce "Submit search"
                        aria-label="Submit search"
                    >
                        <span
                            className="text-sm select-none"
                            // a11y: aria-hidden hides the emoji icon from screen readers (button aria-label covers it)
                            aria-hidden="true"
                            onMouseEnter={() => setSearchLabelExpanded(true)}>
                                🔍
                        </span>
                        <span
                            className={`${searchLabelExpanded ? 'max-w-[3rem]' : 'max-w-0'} overflow-hidden transition-all duration-300 text-xs whitespace-nowrap select-none pl-1`}
                            // a11y: aria-hidden hides the expanding "Search" label from screen readers (redundant with aria-label)
                            aria-hidden="true">
                            Search
                        </span>
                    </button>
                </div>
            </div>

            {/* API source pills — hidden when showApiSourcePills=false (Navbar uses SearchFilterDropdown instead) */}
            {showApiSourcePills && activeSources && activeSources.length > 0 && (
                <div className={`flex flex-wrap gap-1 ${isTop ? '' : 'w-full'}`}>
                    {activeSources.map(source => (
                        <button
                            key={source.id}
                            onClick={() => handleSourceSelect(source.id)}
                            // a11y: aria-pressed tells screen readers which API source filter is currently active
                            aria-pressed={selectedApiSourceId === source.id}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                selectedApiSourceId === source.id
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                            }`}
                        >
                            {source.apiName}
                        </button>
                    ))}
                </div>
            )}

            {/* On-submit Search button (only in on-submit mode and when showSearchButton is true) */}
            {mode === 'on-submit' && showSearchButton && (
                <button
                    onClick={handleSubmit}
                    disabled={!canSearch(inputQuery, searchType ?? 'media', effectiveSelectedApiSourceId)}
                    className="btn text-sm py-1 px-3 shrink-0 disabled:opacity-40"
                >
                    Search
                </button>
            )}

            {/* Typeahead Dropdown */}
            {mode === 'typeahead' && isDropdownOpen && (
                <>
                    {/* Invisible overlay — clicking outside closes the dropdown */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                    />

                    {/* Dropdown panel */}
                    {/* a11y: role="listbox" marks this as a selectable suggestion list for screen readers */}
                    {/* mobile: min-w-[min(260px,90vw)] prevents the dropdown from overflowing narrow phone screens */}
                    <div
                        id="search-suggestions"
                        role="listbox"
                        aria-label="Search suggestions"
                        className={`absolute z-50 min-w-[min(260px,90vw)] bg-surface-raised rounded-xl shadow-2xl border border-border overflow-hidden
                        ${isTop ? 'top-full left-0 mt-1' : 'top-0 left-full ml-2'}`}
                    >
                        {isSearching && (
                            <div className="px-4 py-3 text-sm text-text/60">Searching…</div>
                        )}
                        {!isSearching && dropdownResults.length === 0 && (
                            <div className="px-4 py-3 text-sm text-text/60">No results</div>
                        )}
                        {!isSearching && dropdownResults.map(result => (
                            <button
                                key={result.externalId}
                                // a11y: role="option" marks each item as a selectable suggestion within the listbox
                                role="option"
                                aria-selected={false}
                                className="w-full px-3 py-2 hover:bg-surface transition-colors text-left"
                                onClick={() => handleResultClick(result)}
                            >
                                <RowItemContent
                                    firstString={result.name}
                                    secondString={result.creatorName ?? undefined}
                                    photographOnLeft={result.thumbnailUrl ?? undefined}
                                />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

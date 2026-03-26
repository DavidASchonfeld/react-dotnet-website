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

interface SearchBarProps {
    // 'typeahead': live dropdown as you type (used in Navbar)
    // 'on-submit': triggers only on Enter key or Search button click (used in SearchResultsPage)
    mode: 'typeahead' | 'on-submit'
    isTop: boolean               // from Navbar — controls horizontal vs vertical layout
    effectiveMinimized: boolean  // collapse the bar when navbar is minimized
    defaultQuery?: string        // pre-fill from URL params (on-submit mode)
    defaultApiSourceId?: number  // pre-fill from URL params (on-submit mode)
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
        if (inputQuery.length < SEARCH_MIN_CHARS || effectiveSelectedApiSourceId === null) return
        onSubmit?.(inputQuery, effectiveSelectedApiSourceId)
    }, [inputQuery, effectiveSelectedApiSourceId, onSubmit])

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
                <input
                    type="text"
                    value={inputQuery}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedSource ? `${selectedSource.apiName}…` : 'Search…'}
                    className="form-input pl-3 pr-8 py-1 text-sm w-full rounded-lg"
                />
                <span className="absolute right-2 flex items-center text-text/50 hover:text-text/70 transition-colors duration-200 cursor-pointer"
                    onClick={handleSubmit}
                    onMouseLeave={() => setSearchLabelExpanded(false)}>
                    {inputQuery.length > 0 && (
                        <button
                            onClick={e => { e.stopPropagation(); handleClear() }}
                            className="text-xs leading-none px-2 py-1 hover:text-text"
                            title="Clear"
                            tabIndex={-1}
                        >
                            ✕
                        </button>
                    )}
                    <span
                        className="text-sm select-none"
                        onMouseEnter={() => setSearchLabelExpanded(true)}>
                            🔍
                    </span>
                    <span
                        className={`${searchLabelExpanded ? 'max-w-[3rem]' : 'max-w-0'} overflow-hidden transition-all duration-300 text-xs whitespace-nowrap select-none pl-1`}>
                        Search
                    </span>
                </span>
            </div>

            {/* API source pills — hidden when showApiSourcePills=false (Navbar uses SearchFilterDropdown instead) */}
            {showApiSourcePills && activeSources && activeSources.length > 0 && (
                <div className={`flex flex-wrap gap-1 ${isTop ? '' : 'w-full'}`}>
                    {activeSources.map(source => (
                        <button
                            key={source.id}
                            onClick={() => handleSourceSelect(source.id)}
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
                    disabled={inputQuery.length < SEARCH_MIN_CHARS || effectiveSelectedApiSourceId === null}
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
                    <div className={`absolute z-50 min-w-[260px] bg-surface-raised rounded-xl shadow-2xl border border-border overflow-hidden
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

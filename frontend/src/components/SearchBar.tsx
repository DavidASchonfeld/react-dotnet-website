import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useLazySearchExternalApiQuery,
    useFindOrCreateMediaApiRefMutation,
    useGetActiveApiSourcesQuery,
} from '../services/apiSlice'
import type { ExternalApiSearchResult } from '../types/externalApiSearch'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '../constants'
import RowItemContent from './RowItemContent'

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

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { data: activeSources } = useGetActiveApiSourcesQuery()

    // Default to first available API source once loaded
    const [selectedApiSourceId, setSelectedApiSourceId] = useState<number | null>(
        defaultApiSourceId ?? null
    )

    // Once API sources load, set a default if none is selected yet
    useEffect(() => {
        if (selectedApiSourceId === null && activeSources && activeSources.length > 0) {
            setSelectedApiSourceId(defaultApiSourceId ?? activeSources[0].id)
        }
    }, [activeSources, selectedApiSourceId, defaultApiSourceId])

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
    const [findOrCreate] = useFindOrCreateMediaApiRefMutation()

    // ---- Typeahead debounced search ----
    const handleInputChange = (value: string) => {
        setInputQuery(value)

        if (mode !== 'typeahead') return

        if (debounceTimer.current) clearTimeout(debounceTimer.current)

        if (value.length < SEARCH_MIN_CHARS || selectedApiSourceId === null) {
            setDropdownResults([])
            setIsDropdownOpen(false)
            return
        }

        const selectedSource = activeSources?.find(s => s.id === selectedApiSourceId)
        if (!selectedSource) return

        debounceTimer.current = setTimeout(async () => {
            const result = await triggerSearch({
                query: value,
                mediaTypeId: selectedSource.mediaTypeId,
                limit: 5,
            })
            if (result.data) {
                setDropdownResults(result.data)
                setIsDropdownOpen(result.data.length > 0)
            }
        }, SEARCH_DEBOUNCE_MS)
    }

    // ---- On-Submit handler (Enter key or Search button) ----
    const handleSubmit = () => {
        if (inputQuery.length < SEARCH_MIN_CHARS || selectedApiSourceId === null) return
        onSubmit?.(inputQuery, selectedApiSourceId)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSubmit()
    }

    // ---- Typeahead result click: findOrCreate then navigate to detail page ----
    const handleResultClick = async (result: ExternalApiSearchResult) => {
        if (selectedApiSourceId === null) return

        const activeSource = activeSources?.find(s => s.id === selectedApiSourceId)
        if (!activeSource) return

        setIsDropdownOpen(false)
        setInputQuery(result.name)

        try {
            const created = await findOrCreate({
                externalApiSourceId: activeSource.id,
                externalId: result.externalId,
                name: result.name,
                mediaTypeId: activeSource.mediaTypeId,
                creatorName: result.creatorName,
                publishedDate: result.publishedDate,
            }).unwrap()
            navigate(`/mediaapiref/${created.id}`)
        } catch {
            // Error toast is handled by baseQueryWithErrorHandling
        }
    }

    const handleClear = () => {
        setInputQuery('')
        setDropdownResults([])
        setIsDropdownOpen(false)
    }

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
                <span className="absolute left-2 text-text/50 pointer-events-none text-sm select-none">🔍</span>
                <input
                    type="text"
                    value={inputQuery}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedSource ? `${selectedSource.apiName}…` : 'Search…'}
                    className="form-input pl-7 pr-7 py-1 text-sm w-full rounded-lg"
                />
                {inputQuery.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="absolute right-1.5 text-text/50 hover:text-text transition-colors text-xs leading-none"
                        title="Clear"
                        tabIndex={-1}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* API source pills — hidden when showApiSourcePills=false (Navbar uses SearchFilterDropdown instead) */}
            {showApiSourcePills && activeSources && activeSources.length > 0 && (
                <div className={`flex flex-wrap gap-1 ${isTop ? '' : 'w-full'}`}>
                    {activeSources.map(source => (
                        <button
                            key={source.id}
                            onClick={() => {
                                setSelectedApiSourceId(source.id)
                                setDropdownResults([])
                                setIsDropdownOpen(false)
                            }}
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
                    disabled={inputQuery.length < SEARCH_MIN_CHARS || selectedApiSourceId === null}
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

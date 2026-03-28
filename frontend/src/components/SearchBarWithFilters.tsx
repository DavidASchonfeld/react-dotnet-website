import { useState, useEffect } from 'react'
import SearchBar from './SearchBar'
import RoleBadge from './administrator_related/RoleBadge'
import { API_SUBTYPES, SITE_TYPE_SUBTYPES, DEFAULT_SITE_SEARCH_SUBTYPE } from '../constants'
import type { ExternalApiSourceSummary } from '../types/externalApiSource'
import { canSearch } from '../utils/searchUtils'
import type { SearchType } from '../utils/searchUtils'

export type { SearchType }

export interface FilterState {
    searchType: SearchType
    apiSourceId: number | null

    // For media: API-specific subtype (e.g. 'movie', 'game'). For tags/lists: scope ('all' | 'mine').
    subtype: string | undefined
}

const SEARCH_TYPES = [
    { id: 'media', label: 'Media' },
    { id: 'tags',  label: 'Tags'  },
    { id: 'lists', label: 'Lists' },
] as const


interface SearchBarWithFiltersProps {
    query: string
    defaultApiSourceId: number | null
    urlFilters: FilterState
    activeApiSources: ExternalApiSourceSummary[] | undefined
    isModerator: boolean
    isAdmin: boolean
    roleLevel: string | null
    isAuthenticated?: boolean
    shouldShowFilters?: boolean
    allowedSearchTypes?: SearchType[]  // restrict visible type pills; undefined = show all
    onSearch: (query: string, filters: FilterState, bypassCache: boolean) => void
}

export default function SearchBarWithFilters({
    query,
    defaultApiSourceId,
    urlFilters,
    activeApiSources,
    isModerator,
    isAdmin,
    roleLevel,
    isAuthenticated = true,
    shouldShowFilters = false,
    allowedSearchTypes,
    onSearch,
}: SearchBarWithFiltersProps) {
    const [isFiltersOpen, setIsFiltersOpen] = useState(shouldShowFilters)
    const [filters, setFilters] = useState<FilterState>(urlFilters)
    const [bypassCache, setBypassCache] = useState(false)

    // Visible type pills — filtered to allowedSearchTypes when provided
    const visibleTypes = allowedSearchTypes
        ? SEARCH_TYPES.filter(t => allowedSearchTypes.includes(t.id))
        : SEARCH_TYPES

    // urlFilters (prop) = committed filters from the last submitted search — reflects URL/active results
    // filters (state)   = pending/dirty filters the user is editing but hasn't submitted yet
    // Sync local state back to committed state on browser back/forward navigation.

    useEffect(() => {
        setFilters(urlFilters)
    }, [urlFilters])

    // If current searchType is not in allowedSearchTypes, reset to first allowed type
    useEffect(() => {
        if (!allowedSearchTypes) return
        if (!allowedSearchTypes.includes(filters.searchType)) {
            handleTypeChange(allowedSearchTypes[0])
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowedSearchTypes])

    const selectedFilterThirdPartyApiId = filters.apiSourceId ?? activeApiSources?.[0]?.id ?? null
    const selectedFilterThirdPartyApiDetails = activeApiSources?.find(s => s.id === selectedFilterThirdPartyApiId)
    const availableSubtypes = selectedFilterThirdPartyApiDetails ? (API_SUBTYPES[selectedFilterThirdPartyApiDetails.apiName] ?? []) : []

    const lastSearchResultsThirdPartyApiId = urlFilters.searchType === 'media'
        ? (urlFilters.apiSourceId ?? activeApiSources?.[0]?.id ?? null)
        : null
    const lastSearchResultsThirdPartyApiDetails = activeApiSources?.find(s => s.id === lastSearchResultsThirdPartyApiId)

    // isDirty = Are the currently-selected filters matching the current search results's filter?
    const isDirty =
        // if (searchType changed) || if (media: effective source ID (which API to use) changed) || if (subtype changed)
        filters.searchType !== urlFilters.searchType ||
        (filters.searchType === 'media' ? selectedFilterThirdPartyApiId : null) !==
        (urlFilters.searchType === 'media' ? lastSearchResultsThirdPartyApiId : null) ||
        filters.subtype !== urlFilters.subtype

    const urlChips = [
        SEARCH_TYPES.find(t => t.id === urlFilters.searchType)?.label ?? urlFilters.searchType,
        urlFilters.searchType === 'media' ? lastSearchResultsThirdPartyApiDetails?.apiName : undefined,

        // Look up the display label for the selected subtype within this API's subtype list
        urlFilters.searchType === 'media' && lastSearchResultsThirdPartyApiDetails
            ? (API_SUBTYPES[lastSearchResultsThirdPartyApiDetails.apiName] ?? []).find(s => s.value === urlFilters.subtype)?.label
            : undefined,
        urlFilters.searchType !== 'media'
            ? (SITE_TYPE_SUBTYPES[urlFilters.searchType] ?? []).find(s => s.value === urlFilters.subtype)?.label
            : undefined,
    ].filter((c): c is string => Boolean(c))

    // Handle when changing search type (type = Media, Tag or List, as defined in SearchType variable in this file above.)
    const handleTypeChange = (newType: SearchType) => {
        setFilters(prev => ({
            ...prev,
            searchType: newType,
            apiSourceId: newType === 'media' ? prev.apiSourceId : null,
            subtype: newType === 'media' ? undefined : DEFAULT_SITE_SEARCH_SUBTYPE,
        }))
    }

    const handleApiSourceChange = (id: number) => {
        setFilters(prev => ({ ...prev, apiSourceId: id, subtype: undefined }))
    }

    const handleSubtypeChange = (newSubtype: string) => {
        setFilters(prev => ({ ...prev, subtype: newSubtype || undefined }))
    }

    const committedFilters = (): FilterState => ({
        ...filters,
        apiSourceId: filters.searchType === 'media' ? selectedFilterThirdPartyApiId : null,
    })

    const handleSearchBarSubmit = (newQuery: string) => {
        onSearch(newQuery, committedFilters(), bypassCache)
    }

    return (
        <>
            {/* Search bar with filters toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors self-start"
                    style={{ width: '30px', height: '30px' }}
                    title={isFiltersOpen ? 'Hide filters' : 'Show filters'}
                    aria-label={isFiltersOpen ? 'Hide filters' : 'Show filters'}
                >
                    <span className="text-xs transition-transform" style={{
                        transform: isFiltersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        display: 'inline-block',
                    }}>
                        ▼
                    </span>
                </button>
                <SearchBar
                    mode="on-submit"
                    isTop={false}
                    effectiveMinimized={false}
                    defaultQuery={query}
                    defaultApiSourceId={filters.searchType === 'media' ? (selectedFilterThirdPartyApiId ?? undefined) : undefined}
                    searchType={filters.searchType}
                    onSubmit={handleSearchBarSubmit}
                    showApiSourcePills={false}
                    showSearchButton={false}
                />
            </div>

            {/* "Results for" chips — shown whenever a search is active */}
            {canSearch(query, urlFilters.searchType) && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-text/50">Results for:</span>
                    {urlChips.map(chip => (
                        <span
                            key={chip}
                            className="text-xs px-2.5 py-0.5 rounded-full border border-border bg-surface text-text/70 select-none"
                        >
                            {chip}
                        </span>
                    ))}
                    {isDirty
                        ? <span className="text-xs text-amber-500">— filters changed, press Search to update</span>
                        : <span className="text-xs text-text/40">— matches your current filters</span>
                    }
                </div>
            )}

            {/* Collapsible Advanced Filters */}
            {isFiltersOpen && (
                <div className="mt-4 p-4 border border-border rounded-lg bg-surface">
                    <div className="space-y-4">
                        {/* Search type selector — hidden when only 1 type is allowed */}
                        {visibleTypes.length > 1 && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Type</p>
                            <div className="flex flex-wrap gap-2">
                                {visibleTypes.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTypeChange(t.id)}
                                        className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                            filters.searchType === t.id
                                                ? 'bg-primary text-white border-primary'
                                                : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        )}

                        {/* API source selector */}
                        {filters.searchType === 'media' && activeApiSources && activeApiSources.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">API</p>
                                <div className="flex flex-wrap gap-2">
                                    {activeApiSources.map(source => (
                                        <button
                                            key={source.id}
                                            onClick={() => handleApiSourceChange(source.id)}
                                            className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                                selectedFilterThirdPartyApiId === source.id
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                                            }`}
                                        >
                                            {source.apiName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Subtype selector */}
                        {filters.searchType === 'media' && availableSubtypes.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                    Search for
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {availableSubtypes.map(sub => (
                                        <button
                                            key={sub.value}
                                            onClick={() => handleSubtypeChange(sub.value === filters.subtype ? '' : sub.value)}
                                            className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                                filters.subtype === sub.value
                                                    ? 'bg-primary/20 text-primary border-primary/40'
                                                    : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                                            }`}
                                        >
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Scope selector */}
                        {filters.searchType !== 'media' && (
                            <div>
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Scope</p>
                                <div className="flex gap-2">
                                    {(SITE_TYPE_SUBTYPES[filters.searchType] ?? []).filter(s => isAuthenticated || s.value !== 'mine').map(s => (
                                        <button
                                            key={s.value}
                                            onClick={() => handleSubtypeChange(s.value)}
                                            className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                                filters.subtype === s.value
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Admin/Moderator section */}
                        {isModerator && (
                            <div className="mt-6 rounded-xl border border-border p-4 bg-surface">
                                <div className="flex items-center gap-2 mb-3">
                                    <RoleBadge role={roleLevel as 'Administrator' | 'Moderator'} />
                                    <p className="text-sm font-semibold text-text">Moderation Filters</p>
                                </div>
                                {isAdmin ? (
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={bypassCache}
                                            onChange={e => setBypassCache(e.target.checked)}
                                            className="w-4 h-4 accent-amber-500"
                                        />
                                        <span className="text-sm text-text">Bypass cache — always fetch fresh from API</span>
                                    </label>
                                ) : (
                                    <p className="text-sm text-text/50">
                                        Additional filters for moderators and administrators will appear here.
                                    </p>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    )
}

import { useDispatch, useSelector } from 'react-redux'
import AnimatedPage from '../components/AnimatedPage'
import type { RootState, AppDispatch } from '../store/store'
import { setShowImageCacheIndicator } from '../store/adminSettingsSlice'
import {
    useGetApiUsageStatsQuery,
    useGetApiUsageHistoryQuery,
    useToggleApiDisabledMutation,
    useTogglePosterApiMutation,
    useGetAppGlobalSettingsQuery,
    useToggleGlobalNonSearchCacheMutation,
    useToggleGlobalSearchCacheMutation,
    useDeleteImageCachePlaceholdersMutation,
    useDeleteBigImagesMutation,
    useClearAllCacheItemsMutation,
} from '../services/apiSlice'
import type { ApiUsageStats, ApiUsageHistory } from '../types/apiUsage'
import UsageBarChart from '../components/UsageBarChart'

export default function AdminApiUsagePage() {

    const dispatch = useDispatch<AppDispatch>()
    const { showImageCacheIndicator } = useSelector((state: RootState) => state.adminSettings)

    const { data: stats = [], isLoading, error } = useGetApiUsageStatsQuery(undefined, {
        pollingInterval: 30_000,
    })
    // History is fetched separately so a slow chart load doesn't block the stats card
    const { data: history = [] } = useGetApiUsageHistoryQuery(undefined, {
        pollingInterval: 30_000,
    })
    const { data: globalSettings } = useGetAppGlobalSettingsQuery()
    const [toggleGlobalNonSearchCache, { isLoading: isTogglingGlobal }] = useToggleGlobalNonSearchCacheMutation()
    const [toggleGlobalSearchCache, { isLoading: isTogglingGlobalSearch }] = useToggleGlobalSearchCacheMutation()
    const [deleteImageCachePlaceholders, { isLoading: isDeletingPlaceholders }] = useDeleteImageCachePlaceholdersMutation()
    const [deleteBigImages, { isLoading: isDumpingBigImages }] = useDeleteBigImagesMutation()
    const [clearAllCacheItems, { isLoading: isClearingQueryCache }] = useClearAllCacheItemsMutation()

    return (
        <AnimatedPage>
            <div className="page">

                <div className="mb-6">
                    <h1 className="text-2xl font-bold">API Usage Tracker</h1>
                </div>

                {/* Settings card — groups all UI and cache toggle controls */}
                <div className="bg-surface-raised rounded-lg p-4 border border-border mb-4">
                    <h2 className="font-semibold mb-3">Settings</h2>
                    <div className="flex flex-col divide-y divide-border">

                        {/* UI Display */}
                        <div className="py-3 first:pt-0 last:pb-0">
                            <ToggleRow
                                label="Image cache source indicators"
                                description="A colored dot on each image shows whether it's served from the backend cache (green) or a 3rd party CDN (orange). Only visible to administrators."
                                isEnabled={showImageCacheIndicator}
                                onToggle={() => dispatch(setShowImageCacheIndicator(!showImageCacheIndicator))}
                            />
                        </div>

                        {/* Global non-search cache toggle — master switch for all APIs */}
                        <div className="py-3 first:pt-0 last:pb-0">
                            <ToggleRow
                                label="Global Non-Search Cache"
                                description="Master switch for caching detail/lookup fetches across all APIs. Per-API settings only apply when this is enabled."
                                isEnabled={globalSettings?.useNonSearchQueryCache ?? false}
                                onToggle={() => toggleGlobalNonSearchCache()}
                                isLoading={isTogglingGlobal}
                                isReady={globalSettings !== undefined}
                            />
                        </div>

                        {/* Global search cache toggle */}
                        <div className="py-3 first:pt-0 last:pb-0">
                            <ToggleRow
                                label="Global Search Cache"
                                description="Master switch for caching search-result fetches across all APIs."
                                isEnabled={globalSettings?.useSearchQueryCache ?? false}
                                onToggle={() => toggleGlobalSearchCache()}
                                isLoading={isTogglingGlobalSearch}
                                isReady={globalSettings !== undefined}
                            />
                        </div>

                    </div>
                </div>

                {/* Maintenance card — groups image data cleanup actions */}
                <div className="bg-surface-raised rounded-lg p-4 border border-border mb-4">
                    <h2 className="font-semibold mb-3">Maintenance</h2>
                    <div className="flex flex-col divide-y divide-border">

                        {/* Image Cache maintenance */}
                        <div className="py-3 first:pt-0 last:pb-0">
                            <MaintenanceRow
                                label="Image Cache"
                                description={<>Step 1: deletes <code className="font-mono">ImageCache</code> rows whose URL is a local path or whose blob is null (corrupt/incomplete entries).
                                    Step 2: sets <code className="font-mono">ThumbnailUrl</code> to null on any <code className="font-mono">MediaApiRef</code> whose thumbnail is a local path instead of a real external URL.
                                    Also runs automatically each night.</>}
                                buttonLabel="Clean Image Data"
                                onClick={() => deleteImageCachePlaceholders()}
                                isLoading={isDeletingPlaceholders}
                            />
                        </div>

                        {/* Query Cache clear — wipes all CacheItem rows (search + detail results) */}
                        <div className="py-3 first:pt-0 last:pb-0">
                            <MaintenanceRow
                                label="Query Cache"
                                description={<>Deletes all <code className="font-mono">CacheItem</code> rows — both search results and detail/lookup results — for all APIs. Fresh results will re-populate the cache on demand.</>}
                                buttonLabel="Clear Query Cache"
                                onClick={() => clearAllCacheItems()}
                                isLoading={isClearingQueryCache}
                            />
                        </div>

                        {/* Big Image (Poster API) cache dump */}
                        <div className="py-3 first:pt-0 last:pb-0">
                            <MaintenanceRow
                                label="Big Image Cache"
                                description={<>Removes all high-res poster images fetched via the Poster API from <code className="font-mono">ImageCache</code>,
                                    and resets each affected <code className="font-mono">MediaApiRef.PosterUrl</code> back to its thumbnail image.</>}
                                buttonLabel="Dump Big Images"
                                onClick={() => deleteBigImages()}
                                isLoading={isDumpingBigImages}
                            />
                        </div>

                    </div>
                </div>

                {/* API Sources section label */}
                <p className="text-xs text-text-muted uppercase tracking-wider mb-3">API Sources</p>

                {isLoading && <p className="text-text-muted">Loading...</p>}
                {error && <p className="text-red-500">Failed to load usage data.</p>}

                {!isLoading && !error && (
                    <div className="flex flex-col gap-4">
                        {stats.map(api => (
                            <ApiUsageCard
                                key={api.apiName}
                                api={api}
                                // Pass the matching history entry, or null while it's still loading
                                history={history.find(h => h.apiName === api.apiName) ?? null}
                            />
                        ))}
                    </div>
                )}

            </div>
        </AnimatedPage>
    )
}


interface ToggleRowProps {
    label: string
    description: React.ReactNode  // ReactNode to support <code> tags in descriptions
    isEnabled: boolean
    onToggle: () => void
    isLoading?: boolean
    isReady?: boolean             // extra disabled guard (e.g. settings not yet loaded)
}

// Reusable toggle row for the Settings card
function ToggleRow({ label, description, isEnabled, onToggle, isLoading, isReady = true }: ToggleRowProps) {
    return (
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-sm text-text-muted">{description}</p>
            </div>
            <button
                onClick={onToggle}
                disabled={isLoading || !isReady}
                className={`ml-auto px-3 py-1.5 text-sm rounded transition-colors duration-150 disabled:opacity-50 ${
                    isEnabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
                {isEnabled ? 'Disable' : 'Enable'}
            </button>
        </div>
    )
}


interface MaintenanceRowProps {
    label: string
    description: React.ReactNode  // ReactNode to support <code> tags in descriptions
    buttonLabel: string
    onClick: () => void
    isLoading?: boolean
}

// Reusable action button row for the Maintenance card
function MaintenanceRow({ label, description, buttonLabel, onClick, isLoading }: MaintenanceRowProps) {
    return (
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-sm text-text-muted">{description}</p>
            </div>
            <button
                onClick={onClick}
                disabled={isLoading}
                className="ml-auto px-3 py-1.5 text-sm rounded transition-colors duration-150 disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white"
            >
                {buttonLabel}
            </button>
        </div>
    )
}


function ApiUsageCard({ api, history }: { api: ApiUsageStats; history: ApiUsageHistory | null }) {

    const [toggleApiDisabled, { isLoading: isToggling }] = useToggleApiDisabledMutation()
    // Only rendered when api.supportsPosterApi is true (i.e. the active plan tier supports it).
    const [togglePosterApi, { isLoading: isTogglingPosterApi }] = useTogglePosterApiMutation()

    const hasLimit = api.requestLimit !== null

    // Determine bar colour: red if approaching/auto-block limit, amber if >75%, otherwise primary
    const barColor = (api.isApproachingLimit || api.isAutoBlocked)
        ? 'bg-red-500'
        : (api.percentUsed ?? 0) > 75
            ? 'bg-amber-500'
            : 'bg-primary'

    // Format period dates as readable local strings
    const periodStartStr = new Date(api.periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    const periodEndStr   = new Date(api.periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

    return (
        <div className="bg-surface-raised rounded-lg p-4 border border-border">

            {/* Header row: API name + period badge + approaching-limit warning */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h2 className="text-lg font-semibold">{api.apiName}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                    {api.periodType} · {periodStartStr} – {periodEndStr}
                </span>
                {api.isApproachingLimit && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                        ⚠ Approaching limit
                    </span>
                )}
                {api.isAutoBlocked && (
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 font-medium">
                        ⛔ Auto-blocked
                    </span>
                )}
                {api.isDisabledByAdmin && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-medium">
                        Disabled
                    </span>
                )}
            </div>

            {/* Progress bar (only shown when there is a configured limit) */}
            {/* Fills by % based on how much you used up that specific API's rate limits.
                The orange tick is the point in the "progress bar' where you reach your chosen "warning limit"
                and the red tick is the point in the "progress bar ' where you reach your "auto-block" limit.*/}
            {hasLimit && (
                <div className="mb-3">
                    <p className="font-medium text-sm">Progress Bar</p>
                    <p className="text-sm text-text-muted mb-2">Fills by % based on how much of this API's rate limit has been used. The amber tick marks the warning threshold; the orange tick marks the auto-block threshold.</p>
                    <div className="relative w-full h-2.5 rounded-full bg-surface overflow-visible border border-border">
                        <div
                            className={`h-full rounded-full transition-all duration-500 overflow-hidden ${barColor}`}
                            style={{ width: `${Math.min(api.percentUsed ?? 0, 100)}%` }}
                        />
                        {api.requestLimit && api.warningThreshold && (
                            <div
                                className="absolute top-0 h-full w-0.5 bg-amber-400 opacity-80"
                                style={{ left: `${(api.warningThreshold / api.requestLimit) * 100}%` }}
                            />
                        )}
                        {api.requestLimit && api.autoBlockThreshold && (
                            <div
                                className="absolute top-0 h-full w-0.5 bg-orange-500 opacity-90"
                                style={{ left: `${(api.autoBlockThreshold / api.requestLimit) * 100}%` }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Historical usage bar chart — rendered once history data arrives and has enough buckets */}
            {history && history.periods.length >= 2 && (
                <UsageBarChart history={history} />
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <StatItem label="Used" value={api.requestsUsed.toLocaleString()} />
                {hasLimit ? (
                    <>
                        <StatItem label="Limit" value={api.requestLimit!.toLocaleString()} />
                        {api.autoBlockThreshold !== null && (
                            <StatItem label="Auto-block at" value={api.autoBlockThreshold!.toLocaleString()} />
                        )}
                        <StatItem label="Remaining" value={api.requestsRemaining!.toLocaleString()} />
                        <StatItem label="% Used" value={`${api.percentUsed?.toFixed(1) ?? '0.0'}%`} />
                    </>
                ) : (
                    <StatItem label="Limit" value="No limit" muted />
                )}
            </div>

            {/* Action buttons row */}
            <div className="mt-3 flex justify-end gap-2 flex-wrap">
                {/* Poster API toggle — only shown when the active plan tier supports it */}
                {api.supportsPosterApi && (
                    <button
                        onClick={() => togglePosterApi(api.externalApiSourceId)}
                        disabled={isTogglingPosterApi}
                        className={`px-3 py-1.5 text-sm rounded transition-colors duration-150 disabled:opacity-50 ${
                            api.usePosterApi
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                        {api.usePosterApi ? 'Disable Poster API' : 'Enable Poster API'}
                    </button>
                )}

                {/* Toggle API availability for all users */}
                <button
                    onClick={() => toggleApiDisabled(api.externalApiSourceId)}
                    disabled={isToggling}
                    className={`px-3 py-1.5 text-sm rounded transition-colors duration-150 disabled:opacity-50 ${
                        api.isDisabledByAdmin
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                >
                    {api.isDisabledByAdmin ? 'Re-enable API' : 'Disable API'}
                </button>
            </div>

            {api.supportsPosterApi && (
                <p className="mt-2 text-xs text-text-muted text-right">
                    Note: OMDB's Poster API returns the same low-resolution image as the standard CDN for most titles — enabling this uses extra API quota without a visible quality improvement.
                </p>
            )}

        </div>
    )
}


function StatItem({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
    return (
        <div>
            <span className="text-text-muted uppercase text-xs tracking-wider">{label} </span>
            <span className={`font-medium ${muted ? 'text-text-muted' : 'text-text'}`}>{value}</span>
        </div>
    )
}

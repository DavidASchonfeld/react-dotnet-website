import AnimatedPage from '../components/AnimatedPage'
import {
    useGetApiUsageStatsQuery,
    useToggleApiDisabledMutation,
    useToggleApiNonSearchCacheMutation,
    useTogglePosterApiMutation,
    useGetAppGlobalSettingsQuery,
    useToggleGlobalNonSearchCacheMutation,
    useDeleteImageCachePlaceholdersMutation,
    useDeleteBigImagesMutation,
} from '../services/apiSlice'
import type { ApiUsageStats } from '../types/apiUsage'

export default function AdminApiUsagePage() {

    const { data: stats = [], isLoading, error } = useGetApiUsageStatsQuery(undefined, {
        pollingInterval: 30_000,
    })
    const { data: globalSettings } = useGetAppGlobalSettingsQuery()
    const [toggleGlobalNonSearchCache, { isLoading: isTogglingGlobal }] = useToggleGlobalNonSearchCacheMutation()
    const [deleteImageCachePlaceholders, { isLoading: isDeletingPlaceholders }] = useDeleteImageCachePlaceholdersMutation()
    const [deleteBigImages, { isLoading: isDumpingBigImages }] = useDeleteBigImagesMutation()

    return (
        <AnimatedPage>
            <div className="page">

                <div className="mb-6">
                    <h1 className="text-2xl font-bold">API Usage Tracker</h1>
                </div>

                {/* Global non-search cache toggle — master switch for all APIs */}
                <div className="bg-surface-raised rounded-lg p-4 border border-border mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h2 className="font-semibold">Global Non-Search Cache</h2>
                            <p className="text-sm text-text-muted">
                                Master switch for caching detail/lookup fetches across all APIs.
                                Per-API settings only apply when this is enabled.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleGlobalNonSearchCache()}
                            disabled={isTogglingGlobal || globalSettings === undefined}
                            className={`px-3 py-1.5 text-sm rounded transition-colors duration-150 disabled:opacity-50 ${
                                globalSettings?.useNonSearchQueryCache
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            {globalSettings?.useNonSearchQueryCache ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                </div>

                {/* Image Cache maintenance */}
                <div className="bg-surface-raised rounded-lg p-4 border border-border mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h2 className="font-semibold">Image Cache</h2>
                            <p className="text-sm text-text-muted">
                                Step 1: deletes <code className="font-mono">ImageCache</code> rows whose URL is a local path or whose blob is null (corrupt/incomplete entries).
                                Step 2: sets <code className="font-mono">ThumbnailUrl</code> to null on any <code className="font-mono">MediaApiRef</code> whose thumbnail is a local path instead of a real external URL.
                                Also runs automatically each night.
                            </p>
                        </div>
                        <button
                            onClick={() => deleteImageCachePlaceholders()}
                            disabled={isDeletingPlaceholders}
                            className="px-3 py-1.5 text-sm rounded transition-colors duration-150 disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Clean Image Data
                        </button>
                    </div>
                </div>

                {/* Big Image (Poster API) cache dump */}
                <div className="bg-surface-raised rounded-lg p-4 border border-border mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h2 className="font-semibold">Big Image Cache</h2>
                            <p className="text-sm text-text-muted">
                                Removes all high-res poster images fetched via the Poster API from <code className="font-mono">ImageCache</code>,
                                and resets each affected <code className="font-mono">MediaApiRef.PosterUrl</code> back to its thumbnail image.
                            </p>
                        </div>
                        <button
                            onClick={() => deleteBigImages()}
                            disabled={isDumpingBigImages}
                            className="px-3 py-1.5 text-sm rounded transition-colors duration-150 disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Dump Big Images
                        </button>
                    </div>
                </div>

                {isLoading && <p className="text-text-muted">Loading...</p>}
                {error && <p className="text-red-500">Failed to load usage data.</p>}

                {!isLoading && !error && (
                    <div className="flex flex-col gap-4">
                        {stats.map(api => (
                            <ApiUsageCard key={api.apiName} api={api} />
                        ))}
                    </div>
                )}

            </div>
        </AnimatedPage>
    )
}


function ApiUsageCard({ api }: { api: ApiUsageStats }) {

    const [toggleApiDisabled, { isLoading: isToggling }] = useToggleApiDisabledMutation()
    const [toggleApiNonSearchCache, { isLoading: isTogglingCache }] = useToggleApiNonSearchCacheMutation()
    // Only rendered when api.supportsPosterApi is true (i.e. the active plan tier supports it).
    const [togglePosterApi, { isLoading: isTogglingPosterApi }] = useTogglePosterApiMutation()

    const hasLimit = api.requestLimit !== null

    // Determine bar colour: red if approaching limit, amber if >75%, otherwise primary
    const barColor = api.isApproachingLimit
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
                {api.isDisabledByAdmin && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-medium">
                        Disabled
                    </span>
                )}
            </div>

            {/* Progress bar (only shown when there is a configured limit) */}
            {hasLimit && (
                <div className="mb-3">
                    <div className="w-full h-2.5 rounded-full bg-surface overflow-hidden border border-border">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.min(api.percentUsed ?? 0, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <StatItem label="Used" value={api.requestsUsed.toLocaleString()} />
                {hasLimit ? (
                    <>
                        <StatItem label="Limit" value={api.requestLimit!.toLocaleString()} />
                        <StatItem label="Remaining" value={api.requestsRemaining!.toLocaleString()} />
                        <StatItem label="% Used" value={`${api.percentUsed?.toFixed(1) ?? '0.0'}%`} />
                    </>
                ) : (
                    <StatItem label="Limit" value="No limit" muted />
                )}
            </div>

            {/* Action buttons row */}
            <div className="mt-3 flex justify-end gap-2 flex-wrap">
                {/* Toggle non-search cache for this API */}
                <button
                    onClick={() => toggleApiNonSearchCache(api.externalApiSourceId)}
                    disabled={isTogglingCache}
                    className={`px-3 py-1.5 text-sm rounded transition-colors duration-150 disabled:opacity-50 ${
                        api.useNonSearchQueryCache
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {api.useNonSearchQueryCache ? 'Disable Detail Cache' : 'Enable Detail Cache'}
                </button>

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

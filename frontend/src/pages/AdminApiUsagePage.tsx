import AnimatedPage from '../components/AnimatedPage'
import { useGetApiUsageStatsQuery, useToggleApiDisabledMutation } from '../services/apiSlice'
import type { ApiUsageStats } from '../types/apiUsage'

export default function AdminApiUsagePage() {

    const { data: stats = [], isLoading, error, refetch } = useGetApiUsageStatsQuery()

    return (
        <AnimatedPage>
            <div className="page">

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">API Usage Tracker</h1>
                    <button
                        onClick={refetch}
                        className="px-3 py-1.5 text-sm bg-surface-raised hover:bg-border rounded transition-colors duration-150"
                    >
                        ↻ Refresh
                    </button>
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

            {/* Toggle disable/enable button */}
            <div className="mt-3 flex justify-end">
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

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import type { ApiUsageHistory, ApiUsagePeriod } from '../types/apiUsage'

interface Props {
    history: ApiUsageHistory
}

// Bar colors use hardcoded hex because Recharts renders SVG — Tailwind classes don't apply there.
const COLOR_NORMAL  = '#6366f1'   // indigo-500  — matches bg-primary used in the progress bar
const COLOR_CURRENT = '#818cf8'   // indigo-400  — lighter shade to visually highlight the active period
const COLOR_WARN    = '#f59e0b'   // amber-500   — matches bg-amber-500 in the progress bar
const COLOR_BLOCK   = '#ef4444'   // red-500     — matches bg-red-500 in the progress bar

function getBarColor(period: ApiUsagePeriod, warningThreshold: number | null, autoBlockThreshold: number | null): string {
    const { requestCount } = period
    if (autoBlockThreshold !== null && requestCount >= autoBlockThreshold) return COLOR_BLOCK
    if (warningThreshold   !== null && requestCount >= warningThreshold)   return COLOR_WARN
    return period.isCurrentPeriod ? COLOR_CURRENT : COLOR_NORMAL
}

export default function UsageBarChart({ history }: Props) {
    const isMonthly = history.periods[0]?.periodType === 'Monthly'

    // Format X-axis date labels: "Mar 2026" (monthly) or "Mar 15" (daily)
    const formatLabel = (isoDate: string) => {
        const d = new Date(isoDate)
        return isMonthly
            ? d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
            : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }

    // Y-axis max: request limit when configured, otherwise 110% of observed peak to avoid a flat chart
    const peak     = Math.max(...history.periods.map(p => p.requestCount), 0)
    const yAxisMax = history.requestLimit ?? (Math.ceil(peak * 1.1) || 10)

    // Show every tick for monthly (12 labels fit), weekly ticks for daily (30 would crowd the axis)
    const xAxisInterval = isMonthly ? 0 : 6

    return (
        <div className="mt-3 mb-1">
            <ResponsiveContainer width="100%" height={160}>
                <BarChart
                    data={history.periods}
                    margin={{ top: 6, right: 8, left: -16, bottom: 0 }}
                    barCategoryGap="20%"
                >
                    {/* Horizontal grid lines only; stroke uses CSS var valid in SVG context */}
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />

                    <XAxis
                        dataKey="periodStart"
                        tickFormatter={formatLabel}
                        tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        tickLine={false}
                        interval={xAxisInterval}
                    />

                    <YAxis
                        domain={[0, yAxisMax]}
                        tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                    />

                    {/* Tooltip DOM element — CSS variables resolve correctly here */}
                    <Tooltip
                        cursor={{ fill: 'var(--color-surface)', opacity: 0.6 }}
                        contentStyle={{
                            backgroundColor: 'var(--color-surface-raised)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: 'var(--color-text)',
                        }}
                        labelFormatter={(label) => formatLabel(label as string)}
                        formatter={(value: number, _name, entry) => [
                            `${(value as number).toLocaleString()} requests`,
                            (entry.payload as ApiUsagePeriod).isCurrentPeriod ? 'Current period' : 'Requests',
                        ]}
                    />

                    {/* Dashed reference line at the warning threshold */}
                    {history.warningThreshold !== null && (
                        <ReferenceLine
                            y={history.warningThreshold}
                            stroke={COLOR_WARN}
                            strokeDasharray="4 2"
                            label={{ value: 'Warn', position: 'insideTopRight', fontSize: 9, fill: COLOR_WARN }}
                        />
                    )}

                    {/* Dashed reference line at the auto-block threshold */}
                    {history.autoBlockThreshold !== null && (
                        <ReferenceLine
                            y={history.autoBlockThreshold}
                            stroke={COLOR_BLOCK}
                            strokeDasharray="4 2"
                            label={{ value: 'Block', position: 'insideTopRight', fontSize: 9, fill: COLOR_BLOCK }}
                        />
                    )}

                    {/* Individual bar colors reflect threshold state, matching the progress bar logic */}
                    <Bar dataKey="requestCount" radius={[2, 2, 0, 0]}>
                        {history.periods.map((period) => (
                            <Cell
                                key={period.periodStart}
                                fill={getBarColor(period, history.warningThreshold, history.autoBlockThreshold)}
                            />
                        ))}
                    </Bar>

                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

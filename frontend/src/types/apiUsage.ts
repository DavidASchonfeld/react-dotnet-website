export interface ApiUsageStats {
    apiName: string
    requestsUsed: number
    requestLimit: number | null        // null = no configured limit for this API
    requestsRemaining: number | null   // null = no configured limit for this API
    percentUsed: number | null         // null = no configured limit for this API
    isApproachingLimit: boolean        // true when requestsUsed >= the warning threshold
    isAutoBlocked: boolean             // true when requestsUsed >= the auto-block threshold (computed server-side)
    autoBlockThreshold: number | null  // null = no auto-block configured for this plan
    warningThreshold: number | null    // null = no warning configured for this plan
    periodType: string                 // "Daily" or "Monthly"
    periodStart: string                // ISO 8601 UTC string
    periodEnd: string                  // ISO 8601 UTC string (exclusive)
    externalApiSourceId: number        // Id of the ExternalApiSource row for this API
    isDisabledByAdmin: boolean         // true when an admin has temporarily blocked this API
    supportsPosterApi?: boolean        // undefined = plan has no poster API tier; true = show the toggle button
    usePosterApi: boolean              // current per-source poster API toggle state
}

// One period bucket in the historical usage series for a single API.
export interface ApiUsagePeriod {
    periodStart: string       // ISO 8601 UTC
    periodType: string        // "Daily" or "Monthly"
    requestCount: number
    isCurrentPeriod: boolean  // true for the single bucket covering the current billing period
}

// Historical usage + threshold data for one API; self-contained for the chart.
export interface ApiUsageHistory {
    apiName: string
    requestLimit: number | null
    warningThreshold: number | null
    autoBlockThreshold: number | null
    periods: ApiUsagePeriod[]
}

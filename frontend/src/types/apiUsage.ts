export interface ApiUsageStats {
    apiName: string
    requestsUsed: number
    requestLimit: number | null        // null = no configured limit for this API
    requestsRemaining: number | null   // null = no configured limit for this API
    percentUsed: number | null         // null = no configured limit for this API
    isApproachingLimit: boolean        // true when requestsUsed >= the warning threshold
    periodType: string                 // "Daily" or "Monthly"
    periodStart: string                // ISO 8601 UTC string
    periodEnd: string                  // ISO 8601 UTC string (exclusive)
    externalApiSourceId: number        // Id of the ExternalApiSource row for this API
    isDisabledByAdmin: boolean         // true when an admin has temporarily blocked this API
}

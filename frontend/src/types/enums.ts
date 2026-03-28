// TODO: NOTE: I just copy-pasted this enum from the backend/MyDotNetWebsiteApi/Models/Enums.cs file
// and translated it to .ts (aka TypeScript):


export enum VisibilityStatus {
    Private = 0,
    Public = 1,
    Shared = 2
}

// Mirror of backend MediaListCategory enum — determines list behavior, badge display, and deletion rules
// NOTE: Uses string values to match what the backend's JsonStringEnumConverter serializes (e.g. "VisitingStatus", not 1)
export enum MediaListCategory {
    Standard = 'Standard',             // Regular user list — can be freely created and deleted
    VisitingStatus = 'VisitingStatus', // One of the per-user mutually exclusive status lists (e.g. "Want to Visit")
    Library = 'Library',               // Per-user protected singleton — remembers items without implying visit intent
    Featured = 'Featured',             // Admin-owned, site-wide — contents may be surfaced in special site sections
}
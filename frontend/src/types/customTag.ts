// TypeScript mirror of backend CustomTag DTOs

import type { VisibilityStatus } from './enums'

export interface CustomTagSummary {
    id: number;
    name: string;
    visibilityStatus: VisibilityStatus;
    createdById: string | null;
}

export interface CreateCustomTagRequest {
    name: string;
    visibilityStatus?: VisibilityStatus;
}

export interface UpdateCustomTagRequest {
    name?: string;
    visibilityStatus?: VisibilityStatus;
}

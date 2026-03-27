// TypeScript mirror of backend CustomTag DTOs

import type { VisibilityStatus } from './enums'
import type { MediaApiRefSummary } from './mediaApiRef'

export interface CustomTagSummary {
    id: number;
    name: string;
    description?: string | null;
    visibilityStatus: VisibilityStatus;
    createdById: string | null;
    canEdit: boolean;      // Owner can edit name/description and apply/remove the tag
}

export interface CreateCustomTagRequest {
    name: string;
    description?: string;
    visibilityStatus?: VisibilityStatus;
}

export interface UpdateCustomTagRequest {
    name?: string;
    description?: string;
    visibilityStatus?: VisibilityStatus;
}

export interface AddTagToMediaApiRefRequest {
    note?: string;
}

export interface TaggedMediaApiRef {
    tagNote?: string | null;
    item: MediaApiRefSummary;
}

// Reverse of TaggedMediaApiRef: a tag applied to a media item, with the per-link note
export interface AppliedTag {
    note?: string | null;
    tag: CustomTagSummary;
}

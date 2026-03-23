// NOTE: Each of these "export interface" objects are their own 
// copy-paste TypeScript versions of each backend's
// DTO requests of the backend C# DTO .cs class
// for the object MediaList

// For Example: "/backend/DTOs/MediaListDTOs/CreateUpdate/CreateMediaListDto.cs"
// is implemented here in the "CreateMediaListRequest" object listed below.

import type { VisibilityStatus } from "./enums";
import type { MediaItemSummary } from "./mediaItem";



//// /backend/DTOs/MediaListDTOs/Read/
// Note: I am not adding "Request" to the end of this object names,
// since these are not requests (aka we are not sending these objects to the backend)
// These are objects which we use to put data from the backend and understand the data from the backend

export interface MediaListSummary
{
    id: number;
    name: string;
    description: string | null;
    submittedById: string | null;
    visibilityStatus: VisibilityStatus;
    itemCount: number;
    canEdit: boolean;
}

export interface MediaListDetail
{
    id: number;
    submittedById: string | null;
    name: string;
    description: string | null;
    visibilityStatus: VisibilityStatus;
    canEdit: boolean;

    listContent: MediaItemSummary[];
}



//// /backend/DTOs/MediaListDTOs/CreateUpdate/

export interface CreateMediaListRequest
{
    name: string;
    description?: string;  // Optional: Adding a descriptiohn

    visibilityStatus?: VisibilityStatus;  // Optional: Adding a descriptiohn
}

export interface UpdateMediaListNotListContentRequest
{
    // Id NOT included here (aka it is commented out) because it will be passed via the URL when I send over this DTO
    // id: number;

    // Patch (Partial Update), so all fields optional

    // For Optional Fields:
    //     parameterName?: string; // means Optional Fields
    // NOT this
    //     name: string | null;  // means the field is required, but can be set to null.


    name?: string;
    description?: string;
    visibilityStatus?: VisibilityStatus;
}



//// /backend/DTOs/MediaListDTOs/ManageListItems/

export interface AddMediaItemToMediaListRequest
{
    // These are NOT included here (aka it is commented out) because it will be passed via the URL when I send over this DTO
    // mediaListId: number; // For MediaList
    // mediaItemId: number;  // For MediaItem


    // Position is optional -> If they do NOT pass it, I will default to adding the MediaItem to the end of the list.
    position?: number;
}

export interface MoveMediaItemWithinMediaListRequest
{
    // These are NOT included here (aka it is commented out) because it will be passed via the URL when I send over this DTO
    // mediaListId: number; // For MediaList
    // mediaItemId: number;  // For MediaItem

    newPosition: number;
}




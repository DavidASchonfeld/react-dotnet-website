import { BACKEND_BASE_URL } from '../config';
import type { MediaListSummary,
    CreateMediaListRequest,
    UpdateMediaListNotListContentRequest,
    AddMediaItemToMediaListRequest,
    MoveMediaItemWithinMediaListRequest,
    MediaListDetail
} from '../types/mediaList';

// NOTE: This file is a front-end version of
// creating 1 method for each endpoint related to MediaList,
// which, in the backend, would be located at
// "backend/MyDotNetWebsiteApi/Controllers/MediaListController.cs"

// What is Promise?
// JavaScript's version of marking a variable that will be returned asynchronously.
// A method can return a Promise<MediaListSummary>,
// so it is saying that eventually, it will return a MediaListSummary object.
// You use "await" to unwrap the promise aka wait until the value is fetched
// const dataToReceive = await createMediaList(token, data);
// C#'s equivalent of Promise<Object Type> is Task <Object Type>
// For both, you mark the function as "async"
// For both, you use "await" in your code so your code pauses until the value arrives:
// const dataToReceive = await createMediaList(token, data);




// Note: Why are we passing in the token as a parameter?
// Because the services files (including this file)
// do NOT know the "Who" (aka who is logged in etc.)
// The services only know the "How" (how to call the backend/interact with the backend)
// The components (who call this service)
// have access to the token and pass the token in via a parameter
// These service files are .ts, a plain TypeScript file, so it is NOT a hook
// and also cannot call hook files
// (I created and use the useAuth() hook to easily 
//  give access to the token to other files)
// "Rule of Hooks": Only React components or custom hooks can access hooks.

// For example (at the top of the .tsx component file. Like "MyListsPage.tsx"):
//     const lists = await getMyMediaLists(token!);

export async function getMyMediaLists(token: string): Promise<MediaListSummary[]> {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/GetMyLists`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to fetch MediaLists")

    const data: MediaListSummary[] = await response.json();
    
    return data;
}

export async function getMediaListDetail(token: string, mediaListId: number): Promise<MediaListDetail> {
    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/${mediaListId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to fetch list details.")

    const dataToReceive: MediaListDetail = await response.json();
    
    return dataToReceive;
}


export async function createMediaList(token: string, dataToSend: CreateMediaListRequest): Promise<MediaListSummary> {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/CreateList`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
    });

    if (!response.ok)
        throw new Error("Failed to create MediaList")

    const dataToReceive: MediaListSummary = await response.json();
    
    return dataToReceive;
}

export async function deleteMediaList(token: string, mediaListId: number): Promise<void> {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/${mediaListId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to delete MediaList")
    
    return;
}


// Update Basic Info on MediaList
// Update Name, Description, Visibility 
// Does NOT add/remove MediaItem(s) in MediaList
export async function patchListBasicInfo(token: string, mediaListId: number, dataToSend: UpdateMediaListNotListContentRequest):  Promise<MediaListSummary>  {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/${mediaListId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
    });

    if (!response.ok)
        throw new Error("Failed to patch MediaList's basic information")

    const dataToReceive: MediaListSummary = await response.json();
    
    return dataToReceive;
}


//// Editing Items in the MediaList Object:


// Add 1 MediaItem to MediaList
export async function addMediaItemToList(token: string, mediaListId: number, mediaItemId: number, dataToSend: AddMediaItemToMediaListRequest):  Promise<MediaListSummary>  {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/${mediaListId}/items/${mediaItemId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
    });

    if (!response.ok)
        throw new Error("Failed to add 1 MediaItem to MediaList")

    const dataToReceive: MediaListSummary = await response.json();
    
    return dataToReceive;
}


// Remove 1 MediaItem from MediaList
export async function removeMediaItemFromList(token: string, mediaListId: number, mediaItemId: number):  Promise<MediaListSummary>  {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/${mediaListId}/items/${mediaItemId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to remove 1 MediaItem from MediaList")

    const dataToReceive: MediaListSummary = await response.json();
    
    return dataToReceive;

}


// Reorder all items in a MediaList by submitting the new ordered array of item IDs
export async function reorderMediaListItems(token: string, mediaListId: number, orderedItemIds: number[]): Promise<void> {
    
    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/${mediaListId}/reorder`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderedItemIds }),
    });

    if (!response.ok)
        throw new Error('Failed to reorder items in MediaList');
}


// Move 1 MediaItem to a Different Position, still in the same MediaList
export async function moveMediaItemWithinMediaList(token: string, mediaListId: number, mediaItemId: number, dataToSend: MoveMediaItemWithinMediaListRequest):  Promise<MediaListSummary>  {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/${mediaListId}/items/${mediaItemId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
    });

    if (!response.ok)
        throw new Error("Failed to move 1 MediaItem to a different position within MediaList")

    const dataToReceive: MediaListSummary = await response.json();

    return dataToReceive;

}


// Search MediaLists by name (server-side, per-keystroke, results capped by backend).
// ownedByUserId = undefined/null  → all visible lists (owner || admin || public)
// ownedByUserId = current user ID → own lists only
// ownedByUserId = another user ID → that user's public lists (or all if admin)
export async function searchMediaLists(token: string, query: string, limit: number = 10, ownedByUserId?: string): Promise<MediaListSummary[]> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (ownedByUserId !== undefined) params.set('ownedByUserId', ownedByUserId);

    const response = await fetch(`${BACKEND_BASE_URL}/api/medialist/search?${params}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to search media lists");

    const data: MediaListSummary[] = await response.json();
    return data;
}
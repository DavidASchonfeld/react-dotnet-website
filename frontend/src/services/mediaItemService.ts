import { BACKEND_BASE_URL } from "../config";
import type { CreateMediaItemRequest, PatchMediaItemBasicInfoRequest, MediaItemDetail, MediaItemSummary } from "../types/mediaItem";
import type { MediaListSummary } from "../types/mediaList";




export async function getMediaItemDetail(token: string, mediaItemId: number): Promise<MediaItemDetail>
{
     const response = await fetch(`${BACKEND_BASE_URL}/api/mediaitem/${mediaItemId}`, {
        method: "GET",  // Technically not needed to add, since GET is the default
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to fetch media item detail");

    const data: MediaItemDetail = await response.json();
        
    return data;
    
}


export async function getRandomMediaItems(token: string, amount: number): Promise<MediaItemSummary[]>
{
     const response = await fetch(`${BACKEND_BASE_URL}/api/mediaitem/getRandom/${amount}`, {
        method: "GET",  // Technically not needed to add, since GET is the default
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to fetch media items");

    const data: MediaItemSummary[] = await response.json();
        
    return data;
    
}


export async function getAllApprovedMediaItemsForAdmin(token: string): Promise<MediaItemSummary[]>
{
    const response = await fetch(`${BACKEND_BASE_URL}/api/mediaitem/getAllApprovedMediaItemsForAdmin`, {
        method: "GET",  // Technically not needed to add, since GET is the default
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to fetch media item detail");

    const data: MediaItemSummary[] = await response.json();
        
    return data;
}


export async function createMediaItem(token: string, dataToSend: CreateMediaItemRequest): Promise<MediaItemSummary>
{
    const response = await fetch(`${BACKEND_BASE_URL}/api/mediaitem/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
    });

    if (!response.ok)
        throw new Error("Failed to create MediaItem");

    const dataToReceive: MediaItemSummary = await response.json();
        
    return dataToReceive;
}



export async function deleteMediaItem(token: string, mediaItemId: number): Promise<void> {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/mediaitem/${mediaItemId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to delete MediaItem")
    
    return;
}


// Update Basic Info on MediaItem
// Update Name, Description, Visibility 
// Does NOT add/remove links to concepts like Genres, Tags,Franchises, Series, etc.
export async function patchMediaItemBasicInfo(token: string, mediaItemId: number, dataToSend: PatchMediaItemBasicInfoRequest):  Promise<MediaItemDetail>  {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/mediaitem/${mediaItemId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
    });

    if (!response.ok)
        throw new Error("Failed to patch MediaItem's basic information")

    const dataToReceive: MediaItemDetail = await response.json();

    return dataToReceive;
}


// Returns all MediaLists (that the requester can see) which contain this MediaItem,
// each with canEdit indicating whether the requester can modify that list's membership.
export async function getMediaItemLists(token: string, mediaItemId: number): Promise<MediaListSummary[]> {
    const response = await fetch(`${BACKEND_BASE_URL}/api/mediaitem/${mediaItemId}/lists`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to fetch lists containing this media item");

    const data: MediaListSummary[] = await response.json();
    return data;
}
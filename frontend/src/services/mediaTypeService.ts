import { BACKEND_BASE_URL } from "../config";
import { apiFetch } from "./apiClient";
import type { MediaTypeSummary, MediaTypeDetail } from "../types/mediaType";


export async function getMediaTypeById(token: string, mediaTypeId: number): Promise<MediaTypeDetail>
{
    const response = await apiFetch(`${BACKEND_BASE_URL}/api/mediatype/${mediaTypeId}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });
    
    if (!response.ok)
        throw new Error(`MediaType ${mediaTypeId} was not found`);


    const data: MediaTypeDetail = await response.json();
    return data;
}


export async function getAllApprovedMediaTypes(token: string): Promise<MediaTypeSummary[]>
{
    const response = await apiFetch(`${BACKEND_BASE_URL}/api/mediatype/GetAllApproved`, {
        method: "GET",  // Technically not needed to add, since GET is the default
        headers: { Authorization: `Bearer ${token}` }
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to fetch media types");

    const data: MediaTypeSummary[] = await response.json();
    return data;
}
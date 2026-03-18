import { BACKEND_BASE_URL } from "../config";
import type { MediaTypeSummary } from "../types/mediaType";


export async function getAllApprovedMediaTypes(token: string): Promise<MediaTypeSummary[]>
{
    const response = await fetch(`${BACKEND_BASE_URL}/api/mediatype/GetAllApproved`, {
        method: "GET",  // Technically not needed to add, since GET is the default
        headers: { Authorization: `Bearer ${token}` }
        // No body needed for this API call.
    });

    if (!response.ok)
        throw new Error("Failed to fetch media types");

    const data: MediaTypeSummary[] = await response.json();
        
    return data;
}
import { BACKEND_BASE_URL } from "../config";
// Note: user management calls use fetch() directly (not apiSlice) because
// AdminManageAllUsersPage is a small standalone admin tool that does not need RTK Query caching.
import type { UserRole } from "../types/userRole";
import type { PaginatedResult } from "../types/pagination";

export type UserSummary = {
    id: string;
    userName: string;
    email: string | null;
    roleLevel: UserRole;
};

export async function getAllUsers(token: string, page = 1, pageSize = 10): Promise<PaginatedResult<UserSummary>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const response = await fetch(`${BACKEND_BASE_URL}/api/user/all?${params}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        // No body needed for this API call.
    });
    if (!response.ok)
        throw new Error("Failed to fetch users.");

    const data: PaginatedResult<UserSummary> = await response.json();
    return data;
}

export async function updateUserRole(token: string, targetUserId: string, newRoleLevel: UserRole): Promise<UserSummary> {
    const response = await fetch(`${BACKEND_BASE_URL}/api/user/${targetUserId}/role`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${token}`
        },
        body: JSON.stringify({newRoleLevel})
    });
    if (!response.ok)
        throw new Error(`Failed to update role for user ${targetUserId}`);
    
    const data: UserSummary = await response.json();
    return data;
}
import { BACKEND_BASE_URL } from '../config';


// Note: auth calls use fetch() directly (not apiSlice) because login/register
// cannot have a valid token yet, so they don't need 401-auto-logout handling.

export async function registerUser(userName: string, email: string, password: string) {
    const response = await fetch(`${BACKEND_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include' is required for the browser to send/receive the
        // HttpOnly refresh token cookie on cross-origin requests.
        credentials: 'include',
        body: JSON.stringify({ userName, email, password })
    });

    if (response.status === 429)
        throw new Error('Too many attempts. Please wait a moment and try again.')
    if (!response.ok) {
        // Parse Identity error descriptions (e.g. password policy failures) for display
        let errorMessage = 'Registration failed';
        try {
            const errors = await response.json();
            // Identity errors come back as [{ code: string, description: string }]
            if (Array.isArray(errors) && errors.length > 0)
                errorMessage = errors.map((e: { description: string }) => e.description).join(' ');
        } catch {
            // Response body not parseable — keep generic message
        }
        throw new Error(errorMessage);
    }

    return response.json();
}


export async function loginUser(userName: string, password: string) {
    const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include' is required for the browser to send/receive the
        // HttpOnly refresh token cookie on cross-origin requests.
        credentials: 'include',
        body: JSON.stringify({ userName, password })
    });

    if (response.status === 429)
        throw new Error('Too many attempts. Please wait a moment and try again.')
    if (!response.ok)
        throw new Error('Login failed')

    return response.json();
}


// Silently fetches a new access token using the HttpOnly refresh token cookie.
// No body needed — the browser sends the cookie automatically with credentials: 'include'.
// Throws on failure so the caller (apiSlice reauth wrapper) can fall back to logout.
export async function refreshAccessToken(): Promise<string> {
    const response = await fetch(`${BACKEND_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!response.ok) throw new Error('Refresh failed');
    const data = await response.json();
    return data.accessToken as string;
}


// Tells the backend to invalidate the server-side refresh token so the cookie
// cannot be reused after logout, even if it was captured.
// Errors are swallowed — the frontend clears its own state regardless.
export async function logoutUser(accessToken: string): Promise<void> {
    try {
        await fetch(`${BACKEND_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });
    } catch {
        // Network failure on logout is non-critical; local state is always cleared.
    }
}

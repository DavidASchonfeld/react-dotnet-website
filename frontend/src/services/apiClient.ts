import { store } from '../store/store';
import { clearCredentials } from '../store/authSlice';
import { safeToast } from '../utils/safeToast';

export async function apiFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    let response: Response;

    try {

        // "input" is the URL to call
        // fetch() is the TypeScript method to actually call the HTTP stuff/
        // The reason that all other services in the frontend
        // call this apiClient instead of calling fetch themselves
        // is because this wrapper function will catch/handle all general errors
        // in 1 central place
        response = await fetch(input, init);
    } catch {
        // This code never received a response at all (and does not know the specific reason why.)

        safeToast.error('Unable to reach the server. Please try again later.');
        throw new Error('Network error');
    }

    if (response.status === 401) {
        safeToast.error('Your session has expired. Please log in again.');
        store.dispatch(clearCredentials());
        throw new Error('Unauthorized: session expired');
    }

    if (response.status === 403) {
        safeToast.error('Access denied.');
        throw new Error('Forbidden');
    }

    if (response.status === 429) {
        safeToast.error('Too many requests. Please slow down.');
        throw new Error('Too Many Requests');
    }

    if (response.status >= 500) {
        safeToast.error('A server error occurred. Please try again later.');
        throw new Error(`Server error: ${response.status}`);
    }

    return response;
}

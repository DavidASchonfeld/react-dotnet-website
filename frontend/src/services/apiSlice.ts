import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { clearCredentials, setCredentials } from '../store/authSlice'
import { safeToast } from '../utils/safeToast'
import { BACKEND_BASE_URL } from '../config'
import { refreshAccessToken } from './authService'
import type { UserRole } from '../types/userRole'

import type {
    MediaApiRefSummary,
    MediaApiRefDetail,
    FindOrCreateMediaApiRefRequest,
} from '../types/mediaApiRef'
import type { ExternalApiSearchResult } from '../types/externalApiSearch'
import type { CachedResponse } from '../types/cacheMetadata'
import type { ExternalApiSourceSummary } from '../types/externalApiSource'
import type {
    CustomTagSummary,
    CreateCustomTagRequest,
    UpdateCustomTagRequest,
    TaggedMediaApiRef,
    AppliedTag,
} from '../types/customTag'
import type {
    MediaListDetail,
    MediaListSummary,
    CreateMediaListRequest,
    UpdateMediaListNotListContentRequest,
    AddMediaApiRefToMediaListRequest,
    AddToListByExternalRefRequest,
    MoveMediaApiRefWithinMediaListRequest,
} from '../types/mediaList'
import type { MediaTypeSummary, MediaTypeDetail } from '../types/mediaType'
import type { ApiUsageStats, ApiUsageHistory } from '../types/apiUsage'
import type { AppGlobalSettings } from '../types/appGlobalSettings'
import type { PaginatedResult } from '../types/pagination'


// ---- Base HTTP Query ----
// Attaches the JWT token from Redux auth state to every request automatically.
// This replaces the manual "Authorization: Bearer ${token}" headers in every service function.
// This baseQuery object gets a wrappr below called "baseQueryWithErrorHandling"
// in order to handle general error codes.

const baseQuery = fetchBaseQuery({
    baseUrl: BACKEND_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        // Normally you'd use: (getState() as RootState).auth.token
        // But RootState is defined in store.ts, which already imports apiSlice.
        // Importing RootState here would create a cycle: store → apiSlice → store → ...
        // which causes a runtime crash ("Cannot access 'apiSlice' before initialization").
        //
        // The fix: instead of importing the full RootState type from store.ts,
        // we inline just the part of the shape we actually need: { auth: { token } }.
        // TypeScript only cares that the shape matches — it doesn't care where the type came from.
        // This gives us identical type safety with zero import, breaking the cycle entirely.
        const token = (getState() as { auth: { token: string | null } }).auth.token
        if (token) headers.set('Authorization', `Bearer ${token}`)
        return headers
    },
})


// ---- Reauth Wrapper ----
// Wraps baseQuery with automatic token refresh on 401.
// On a 401 response, we silently try to get a new access token via the HttpOnly
// refresh cookie before giving up and logging the user out.
//
// Promise-based deduplication: all concurrent 401s share a single refresh call.
// Each waiter receives the same resolved token and retries its own request independently,
// so no request is silently dropped. This replaces the previous boolean-flag approach
// which only let the first concurrent 401 retry.
// "Instead of a boolean flag (which would silently drop concurrent 401s),
// we store the refresh call itself as a promise.
// Any 401 that arrives while a refresh is already in progress
// just awaits the same promise. Everyone gets the token,
// everyone retries — nothing is dropped."
// Note: Waiter = something which is waiting. Here, it is waiting for the promise
// Request B is suspended at that line until the promise resolves.
// That suspended state — "I'm blocked, waiting for this promise to finish" —
// is what's meant by "waiter." It's informal terminology for a
// caller that is awaiting a shared async operation it didn't initiate.

let refreshPromise: Promise<string | null> | null = null
// Ensures only the first waiter shows the toast and dispatches logout when a refresh cycle fails
let logoutDispatched = false

const baseQueryWithErrorHandling: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extra) => {
    let result = await baseQuery(args, api, extra)

    if (result.error) {
        const status = result.error.status

        if (status === 401) {
            // Only attempt refresh if the user has an active session — skip for guests.
            const isAuthenticated = (api.getState() as { auth: { isAuthenticated: boolean } }).auth.isAuthenticated
            if (isAuthenticated) {
                // Start a refresh only if one isn't already in flight; otherwise share the existing promise.
                if (!refreshPromise) {
                    logoutDispatched = false // New refresh cycle — reset the logout guard
                    refreshPromise = refreshAccessToken()
                        .catch(() => null) // Return null on failure so all waiters can handle it uniformly
                        .finally(() => { refreshPromise = null }) // Reset after all waiters have resolved
                }

                const newToken = await refreshPromise

                if (newToken) {
                    // Ask the backend for a new access token using the HttpOnly refresh cookie.
                    // If successful, store the new token so prepareHeaders picks it up on the retry.
                    const state = api.getState() as { auth: { userName: string | null; roleLevel: UserRole | null } }
                    api.dispatch(setCredentials({
                        token: newToken,
                        userName: state.auth.userName ?? '',
                        roleLevel: state.auth.roleLevel,
                    }))
                    // Retry the original request — prepareHeaders now has the new token.
                    result = await baseQuery(args, api, extra)
                } else {
                    // Refresh failed — session is truly expired. Only the first waiter logs the user out
                    // to avoid duplicate "Session Expired" toasts when multiple requests awaited the same refresh.
                    if (!logoutDispatched) {
                        logoutDispatched = true
                        safeToast.error('Your session has expired. Please log in again.')
                        api.dispatch(clearCredentials())
                    }
                    return result
                }
            }
        } else if (status === 'FETCH_ERROR') {
            safeToast.error('Unable to reach the server. Please try again later.')
        } else if (status === 403) {
            safeToast.error('Access denied.')
        } else if (status === 409) {
            safeToast.error('This item is already in the list.')
        } else if (status === 429) {
            safeToast.error('Too many requests. Please wait a moment and try again.')
        } else if (status === 503) {
            const detail = (result.error.data as { detail?: string })?.detail
            safeToast.error(detail ?? 'This API is temporarily unavailable.')
        } else if (typeof status === 'number' && status >= 500) {
            safeToast.error('A server error occurred. Please try again later.')
        }
    }

    return result
}


// ---- Placeholder Image Defaults ----
// Applied in transformResponse for any endpoint that returns image fields.
// Ensures image fields are never null/undefined in the Redux cache — components
// receive a guaranteed URL and don't need their own placeholder logic.
const PLACEHOLDER_THUMBNAIL = '/placeholder-thumbnail.svg'
const PLACEHOLDER_POSTER = '/placeholder-poster.svg'

function fillSummaryImages(item: MediaApiRefSummary): MediaApiRefSummary {
    return { ...item, thumbnailUrl: item.thumbnailUrl ?? PLACEHOLDER_THUMBNAIL }
}

function fillDetailImages(detail: MediaApiRefDetail): MediaApiRefDetail {
    return {
        ...detail,
        thumbnailUrl: detail.thumbnailUrl ?? PLACEHOLDER_THUMBNAIL,
        poster: detail.poster ?? PLACEHOLDER_POSTER,
    }
}


// ---- API Slice ----
// One file replaces: apiClient.ts, mediaApiRefService.ts, mediaListService.ts, mediaTypeService.ts, etc.
// RTK Query auto-generates hooks for each endpoint.


export const apiSlice = createApi({

    // This is the name of the reducerPath,
    // so in store.ts, I will pass in apiSlice.reducerPath AKA accessing this specific value
    reducerPath: 'api',

    baseQuery: baseQueryWithErrorHandling,

    // You have to mark each API call here with the type of object you are talking about
    // This is how, even though API calls
    // might use MediaApiRefSummary or MediaApiRefDetail,
    // it knows that they are both MediaApiRef because they,
    // in "invalidatesTags" or "providesTags" use ['MediaApiRef']
    tagTypes: ['MediaApiRef', 'MediaList', 'MediaType', 'CustomTag', 'ExternalApiSource', 'AppGlobalSettings'],
    endpoints: (builder) => ({


        // ---- MediaApiRef Endpoints ----

        getMediaApiRefDetail: builder.query<CachedResponse<MediaApiRefDetail>, number>({
            query: (id) => `/api/mediaapiref/${id}`,
            transformResponse: (response: CachedResponse<MediaApiRefDetail>) => ({
                ...response,
                data: fillDetailImages(response.data),
            }),
            providesTags: (_, __, id) => [{ type: 'MediaApiRef', id }],
        }),

        // Fetch detail by external identifiers (apiName + externalId).
        // Returns id=0 in the data when the item is not yet in the DB.
        getMediaApiRefByExternal: builder.query<
            CachedResponse<MediaApiRefDetail>,
            { apiName: string; externalId: string }
        >({
            query: ({ apiName, externalId }) =>
                `/api/mediaapiref/byexternal/${encodeURIComponent(apiName)}/${encodeURIComponent(externalId)}`,
            transformResponse: (response: CachedResponse<MediaApiRefDetail>) => ({
                ...response,
                data: fillDetailImages(response.data),
            }),
            providesTags: (_, __, { apiName, externalId }) => [
                { type: 'MediaApiRef', id: `${apiName}:${externalId}` },
            ],
        }),

        // ---- Searching External APIs ----
        // Searches the active external API (TMDB, Spotify, etc.) for the given media type.
        // Returns raw ExternalApiSearchResult items (not DB records yet).
        // `page` is 1-based for paginated results (used by SearchResultsPage).
        //
        // IMPORTANT: All responses are wrapped in CachedResponse, whether cached or fresh.
        // The backend caches results to avoid repeated external API calls.
        // Use cacheMetadata.isFromCache to determine if results are stale or fresh.
        //
        // Return type structure:
        //   result.data = CachedResponse<ExternalApiSearchResult[]>
        //   result.data.data = ExternalApiSearchResult[] (the actual results)
        //   result.data.cacheMetadata.isFromCache = boolean (cached or fresh?)
        //
        // Frontend usage pattern:
        //   - SearchBar.tsx: Ignores cache status, just shows results in dropdown
        //   - MediaApiRefDetailPage.tsx: (For Administrators only): Uses CacheStatusPill to show "Cached"/"Fresh" badge with age of cache.
        //
        // See types/cacheMetadata.ts for detailed examples.
        searchExternalApi: builder.query<
            CachedResponse<ExternalApiSearchResult[]>,
            { query: string; mediaTypeId: number; limit?: number; page?: number; subtype?: string; bypassCache?: boolean }
        >({
            query: ({ query, mediaTypeId, limit = 10, page = 1, subtype, bypassCache }) => {
                const params = new URLSearchParams({
                    q: query,
                    mediaTypeId: String(mediaTypeId),
                    limit: String(limit),
                    page: String(page),
                })
                if (subtype) params.set('subtype', subtype)
                if (bypassCache) params.set('bypassCache', 'true')
                return `/api/mediaapiref/search?${params}`
            },
            transformResponse: (response: CachedResponse<ExternalApiSearchResult[]>) => ({
                ...response,
                data: response.data.map(r => ({ ...r, thumbnailUrl: r.thumbnailUrl ?? PLACEHOLDER_THUMBNAIL })),
            }),
        }),

        // Idempotent: finds existing MediaApiRef by (externalApiSourceId, externalId) or creates it.
        // Idempotent means calling the operation multiple times produces the same result as calling it once.
        // For findOrCreateMediaApiRef: whether you call it 1 time or 10 times with the same (externalApiSourceId, externalId),
        // you end up with exactly one MediaApiRef in the database — no duplicates.
        // It's safe to call this repeatedly without worrying about creating duplicates.
        // Call this after user picks an item from searchExternalApi results.
        findOrCreateMediaApiRef: builder.mutation<MediaApiRefDetail, FindOrCreateMediaApiRefRequest>({
            query: (body) => ({
                url: '/api/mediaapiref/find-or-create',
                method: 'POST',
                body,
            }),
            transformResponse: (response: MediaApiRefDetail) => fillDetailImages(response),
            invalidatesTags: ['MediaApiRef'],
        }),

        // This returns a MediaListSummary[], (all MediaLists that the user has access to. Since it is only reading
        // which lists have a link to the MediaApiRef that this query is asking about, so
        // this endpoint does NOT call a 3rd party API. )
        getMediaApiRefLists: builder.query<MediaListSummary[], number>({
            query: (mediaApiRefId) => `/api/mediaapiref/${mediaApiRefId}/lists`,
            providesTags: ['MediaList'],
        }),

        getMediaApiRefTags: builder.query<CustomTagSummary[], number>({
            query: (mediaApiRefId) => `/api/mediaapiref/${mediaApiRefId}/tags`,
            providesTags: (_, __, mediaApiRefId) => [{ type: 'CustomTag', id: `ref-${mediaApiRefId}` }],
        }),

        getAppliedTagsWithNotes: builder.query<AppliedTag[], number>({
            query: (mediaApiRefId) => `/api/mediaapiref/${mediaApiRefId}/applied-tags`,
            providesTags: (_, __, mediaApiRefId) => [{ type: 'CustomTag', id: `ref-${mediaApiRefId}` }],
        }),

        // Force-refresh: bypasses CacheItem, fetches fresh data from external API, and clears staleness.
        refreshMediaApiRefDetails: builder.mutation<CachedResponse<MediaApiRefDetail>, number>({
            query: (mediaApiRefId) => ({
                url: `/api/mediaapiref/${mediaApiRefId}/refresh`,
                method: 'POST',
            }),
            transformResponse: (response: CachedResponse<MediaApiRefDetail>) => ({
                ...response,
                data: fillDetailImages(response.data),
            }),
            invalidatesTags: (_, __, mediaApiRefId) => [{ type: 'MediaApiRef', id: mediaApiRefId }],
        }),


        // ---- MediaList Endpoints ----

        getMyMediaLists: builder.query<PaginatedResult<MediaListSummary>, { page?: number; pageSize?: number }>({
            query: ({ page = 1, pageSize = 10 }) => {
                const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
                return `/api/medialist/my-lists?${params}`
            },
            providesTags: ['MediaList'], // refetches ALL mediaList queries
        }),

        getMediaListDetail: builder.query<MediaListDetail, number>({
            query: (id) => `/api/medialist/${id}`,
            transformResponse: (response: MediaListDetail) => ({
                ...response,
                listContent: response.listContent.map(fillSummaryImages),
            }),
            providesTags: (_, __, id) => [{ type: 'MediaList', id }],
            // -- > this specific cached entry can be targeted for invalidation
            // by the tag (Example:) {type: 'MediaList', id: 5}
            // surgical invalidation. refetches only the detail query for mediaList id = 5.
        }),

        createMediaList: builder.mutation<MediaListSummary, CreateMediaListRequest>({
            query: (body) => ({
                url: '/api/medialist/create-list',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['MediaList'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Creating list...',
                    success: 'List created!',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        deleteMediaList: builder.mutation<void, number>({
            query: (id) => ({
                url: `/api/medialist/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['MediaList'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Deleting...',
                    success: 'List deleted',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        patchListBasicInfo: builder.mutation<
            MediaListSummary,
            { mediaListId: number; data: UpdateMediaListNotListContentRequest }
        >({
            query: ({ mediaListId, data }) => ({
                url: `/api/medialist/${mediaListId}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_, __, { mediaListId }) => [
                { type: 'MediaList', id: mediaListId },
                'MediaList',
            ],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Saving...',
                    success: 'Changes saved',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        addMediaApiRefToList: builder.mutation<
            MediaListSummary,
            { listId: number; mediaApiRefId: number; data?: AddMediaApiRefToMediaListRequest }
        >({
            query: ({ listId, mediaApiRefId, data }) => ({
                url: `/api/medialist/${listId}/items/${mediaApiRefId}`,
                method: 'POST',
                body: data ?? {},
            }),
            invalidatesTags: (_, __, { listId }) => [
                { type: 'MediaList', id: listId },
                'MediaList',
            ],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Adding...',
                    success: 'Item added to list',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        removeMediaApiRefFromList: builder.mutation<
            MediaListSummary,
            { listId: number; mediaApiRefId: number }
        >({
            query: ({ listId, mediaApiRefId }) => ({
                url: `/api/medialist/${listId}/items/${mediaApiRefId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_, __, { listId }) => [
                { type: 'MediaList', id: listId },
                'MediaList',
            ],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Removing...',
                    success: 'Item removed',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        // Finds or creates the MediaApiRef by external key, then links it to the list.
        // Idempotent: returns success even if the item is already in the list.
        // Used by SearchPage for raw external search results (no local DB id yet).
        addMediaApiRefToListByExternalRef: builder.mutation<
            MediaListSummary,
            { listId: number; data: AddToListByExternalRefRequest }
        >({
            query: ({ listId, data }) => ({
                url: `/api/medialist/${listId}/items/by-external`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (_, __, { listId }) => [
                { type: 'MediaList', id: listId },
                'MediaList',
            ],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Adding...',
                    success: 'Item added to list',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        // Removes a MediaApiRef from a list, identified by its external API key.
        // Idempotent: returns success if the item is not in the DB or not in the list.
        // Used by SearchPage for raw external search results (no local DB id yet).
        removeMediaApiRefFromListByExternalRef: builder.mutation<
            MediaListSummary,
            { listId: number; externalApiSourceId: number; externalId: string }
        >({
            query: ({ listId, externalApiSourceId, externalId }) => ({
                url: `/api/medialist/${listId}/items/by-external?externalApiSourceId=${externalApiSourceId}&externalId=${encodeURIComponent(externalId)}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_, __, { listId }) => [
                { type: 'MediaList', id: listId },
                'MediaList',
            ],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Removing...',
                    success: 'Item removed from list',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        reorderMediaListItems: builder.mutation<
            void,
            { mediaListId: number; orderedItemIds: number[] }
        >({
            query: ({ mediaListId, orderedItemIds }) => ({
                url: `/api/medialist/${mediaListId}/reorder`,
                method: 'PATCH',
                body: { orderedItemIds },
            }),
            invalidatesTags: (_, __, { mediaListId }) => [{ type: 'MediaList', id: mediaListId }],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Saving order...',
                    success: 'Order saved',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        moveMediaApiRefWithinMediaList: builder.mutation<
            MediaListSummary,
            { listId: number; mediaApiRefId: number; data: MoveMediaApiRefWithinMediaListRequest }
        >({
            query: ({ listId, mediaApiRefId, data }) => ({
                url: `/api/medialist/${listId}/items/${mediaApiRefId}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_, __, { listId }) => [{ type: 'MediaList', id: listId }],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Moving...',
                    success: 'Item moved',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        searchMediaLists: builder.query<
            MediaListSummary[],
            { query: string; limit?: number; ownedByUserId?: string; mineOnly?: boolean; page?: number }
        >({
            query: ({ query, limit = 10, ownedByUserId, mineOnly, page }) => {
                const params = new URLSearchParams({ q: query, limit: String(limit) })
                if (ownedByUserId !== undefined) params.set('ownedByUserId', ownedByUserId)
                // mineOnly=true tells the backend to filter by the requesting user's own lists
                // (avoids needing to pass a GUID userId from the frontend)
                if (mineOnly) params.set('mineOnly', 'true')
                if (page && page > 1) params.set('page', String(page))
                return `/api/medialist/search?${params}`
            },
        }),

        // Dedicated endpoint — bypasses the DefaultPageSize cap that getMyMediaLists applies
        getMyVisitingStatusLists: builder.query<MediaListSummary[], void>({
            query: () => '/api/medialist/my-visiting-status-lists',
            providesTags: ['MediaList'],
        }),

        getFeaturedLists: builder.query<MediaListDetail[], void>({
            query: () => '/api/medialist/featured',
            transformResponse: (response: MediaListDetail[]) =>
                response.map(list => ({
                    ...list,
                    listContent: list.listContent.map(fillSummaryImages),
                })),
            providesTags: ['MediaList'],
        }),

        createFeaturedList: builder.mutation<MediaListSummary, CreateMediaListRequest>({
            query: (body) => ({
                url: '/api/medialist/create-featured-list',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['MediaList'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Creating featured list...',
                    success: 'Featured list created!',
                    error: '',
                })
            },
        }),


        // ---- CustomTag Endpoints ----

        getCustomTag: builder.query<CustomTagSummary, number>({
            query: (tagId) => `/api/customtag/${tagId}`,
            providesTags: (_, __, tagId) => [{ type: 'CustomTag', id: tagId }],
        }),

        getMyCustomTags: builder.query<PaginatedResult<CustomTagSummary>, { page?: number; pageSize?: number }>({
            query: ({ page = 1, pageSize = 10 }) => {
                const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
                return `/api/customtag/my-tags?${params}`
            },
            providesTags: ['CustomTag'],
        }),

        createCustomTag: builder.mutation<CustomTagSummary, CreateCustomTagRequest>({
            query: (body) => ({
                url: '/api/customtag/create',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['CustomTag'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Creating tag...',
                    success: 'Tag created!',
                    error: '',
                })
            },
        }),

        patchCustomTag: builder.mutation<
            CustomTagSummary,
            { tagId: number; data: UpdateCustomTagRequest }
        >({
            query: ({ tagId, data }) => ({
                url: `/api/customtag/${tagId}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['CustomTag'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Saving...',
                    success: 'Tag updated',
                    error: '',
                })
            },
        }),

        deleteCustomTag: builder.mutation<void, number>({
            query: (tagId) => ({
                url: `/api/customtag/${tagId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['CustomTag'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Deleting tag...',
                    success: 'Tag deleted',
                    error: '',
                })
            },
        }),

        searchCustomTags: builder.query<
            CustomTagSummary[],
            { query: string; limit?: number; mineOnly?: boolean; page?: number }
        >({
            query: ({ query, limit = 10, mineOnly, page }) => {
                const params = new URLSearchParams({ q: query, limit: String(limit) })
                // mineOnly=true tells the backend to return only the current user's tags (skip public tags from others)
                if (mineOnly) params.set('mineOnly', 'true')
                if (page && page > 1) params.set('page', String(page))
                return `/api/customtag/search?${params}`
            },
            // Invalidated by create/patch/delete tag mutations so SearchPage refetches after changes
            providesTags: ['CustomTag'],
        }),

        addTagToMediaApiRef: builder.mutation<
            void,
            { tagId: number; mediaApiRefId: number; note?: string }
        >({
            query: ({ tagId, mediaApiRefId, note }) => ({
                url: `/api/customtag/${tagId}/items/${mediaApiRefId}`,
                method: 'POST',
                body: note !== undefined ? { note } : undefined,
            }),
            invalidatesTags: (_, __, { tagId, mediaApiRefId }) => [
                { type: 'CustomTag', id: `ref-${mediaApiRefId}` },
                { type: 'CustomTag', id: tagId },
            ],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Tagging...',
                    success: 'Tag applied',
                    error: '',
                })
            },
        }),

        removeTagFromMediaApiRef: builder.mutation<
            void,
            { tagId: number; mediaApiRefId: number }
        >({
            query: ({ tagId, mediaApiRefId }) => ({
                url: `/api/customtag/${tagId}/items/${mediaApiRefId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_, __, { tagId, mediaApiRefId }) => [
                { type: 'CustomTag', id: `ref-${mediaApiRefId}` },
                { type: 'CustomTag', id: tagId },
            ],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Removing tag...',
                    success: 'Tag removed',
                    error: '',
                })
            },
        }),

        getItemsByTag: builder.query<PaginatedResult<TaggedMediaApiRef>, { tagId: number; page?: number; pageSize?: number }>({
            query: ({ tagId, page = 1, pageSize = 10 }) => {
                const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
                return `/api/customtag/${tagId}/items?${params}`
            },
            providesTags: (_, __, { tagId }) => [{ type: 'CustomTag', id: tagId }],
        }),


        // ---- ExternalApiSource Endpoints ----

        getActiveApiSources: builder.query<ExternalApiSourceSummary[], void>({
            query: () => '/api/externalapisource/active',
        }),


        // ---- API Usage Endpoints ----

        // Returns usage stats for all external APIs. Admin-only — backend returns 403 for non-admins.
        getApiUsageStats: builder.query<ApiUsageStats[], void>({
            query: () => '/api/apiusage',
            providesTags: ['ExternalApiSource'],
        }),

        // Returns historical usage buckets per API. Admin-only.
        // Invalidated by the same mutations as getApiUsageStats (ExternalApiSource tag).
        getApiUsageHistory: builder.query<ApiUsageHistory[], void>({
            query: () => '/api/apiusage/history',
            providesTags: ['ExternalApiSource'],
        }),

        toggleApiDisabled: builder.mutation<
            { id: number; apiName: string; isDisabledByAdmin: boolean },
            number  // externalApiSourceId
        >({
            query: (id) => ({
                url: `/api/externalapisource/${id}/toggle-disabled`,
                method: 'PATCH',
            }),
            invalidatesTags: ['ExternalApiSource'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Updating...',
                    success: 'API status updated',
                    error: '',
                })
            },
        }),

        // Flips UsePosterApi for one API source — only shown when the plan supports it. Admin-only.
        togglePosterApi: builder.mutation<
            { id: number; apiName: string; usePosterApi: boolean },
            number  // externalApiSourceId
        >({
            query: (id) => ({
                url: `/api/externalapisource/${id}/toggle-poster-api`,
                method: 'PATCH',
            }),
            invalidatesTags: ['ExternalApiSource'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Updating...',
                    success: (result) => `Poster API ${result.data.usePosterApi ? 'enabled' : 'disabled'}`,
                    error: '',
                })
            },
        }),

        // Returns global app settings. Admin-only.
        getAppGlobalSettings: builder.query<AppGlobalSettings, void>({
            query: () => '/api/appsettings',
            providesTags: ['AppGlobalSettings'],
        }),

        // Flips the global UseNonSearchQueryCache flag. Admin-only.
        toggleGlobalNonSearchCache: builder.mutation<AppGlobalSettings, void>({
            query: () => ({
                url: '/api/appsettings/toggle-nonsearch-cache',
                method: 'PATCH',
            }),
            invalidatesTags: ['AppGlobalSettings'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Updating...',
                    success: 'Global non-search cache setting updated',
                    error: 'Failed to update cache setting',
                })
            },
        }),

        // Flips the global UseSearchQueryCache flag. Admin-only.
        toggleGlobalSearchCache: builder.mutation<AppGlobalSettings, void>({
            query: () => ({
                url: '/api/appsettings/toggle-search-cache',
                method: 'PATCH',
            }),
            invalidatesTags: ['AppGlobalSettings'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Updating...',
                    success: 'Global search cache setting updated',
                    error: 'Failed to update cache setting',
                })
            },
        }),


        // ---- CacheItem Endpoints ----

        // Deletes all query-cache entries (search + detail) from the CacheItem table. Admin-only.
        clearAllCacheItems: builder.mutation<{ deleted: number }, void>({
            query: () => ({
                url: '/api/appsettings/cache-items',
                method: 'DELETE',
            }),
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Clearing query cache...',
                    success: (result) => {
                        const { deleted } = result.data
                        return deleted > 0 ? `${deleted} cache ${deleted === 1 ? 'entry' : 'entries'} cleared` : 'Cache was already empty'
                    },
                    error: '',
                })
            },
        }),


        // ---- ImageCache Endpoints ----

        // Cleans invalid ImageCache entries and non-http MediaApiRef thumbnail URLs. Admin-only.
        deleteImageCachePlaceholders: builder.mutation<{ deletedCacheEntries: number; nulledPlaceholderThumbnails: number }, void>({
            query: () => ({
                url: '/api/imagecache/placeholders',
                method: 'DELETE',
            }),
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Cleaning image data...',
                    success: (result) => {
                        const { deletedCacheEntries, nulledPlaceholderThumbnails } = result.data
                        const parts = []
                        if (deletedCacheEntries > 0) parts.push(`${deletedCacheEntries} cache ${deletedCacheEntries === 1 ? 'entry' : 'entries'} removed`)
                        if (nulledPlaceholderThumbnails > 0) parts.push(`${nulledPlaceholderThumbnails} bad thumbnail ${nulledPlaceholderThumbnails === 1 ? 'URL' : 'URLs'} cleared`)
                        return parts.length > 0 ? parts.join(', ') : 'Nothing to clean up'
                    },
                    error: '',
                })
            },
        }),


        // Removes all poster-api:// blobs and resets affected MediaApiRef.PosterUrl values. Admin-only.
        deleteBigImages: builder.mutation<{ deletedCacheEntries: number; resetPosterUrls: number }, void>({
            query: () => ({
                url: '/api/imagecache/big-images',
                method: 'DELETE',
            }),
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Dumping big images...',
                    success: (result) => {
                        const { deletedCacheEntries, resetPosterUrls } = result.data
                        const parts = []
                        if (deletedCacheEntries > 0) parts.push(`${deletedCacheEntries} cached ${deletedCacheEntries === 1 ? 'image' : 'images'} removed`)
                        if (resetPosterUrls > 0) parts.push(`${resetPosterUrls} ${resetPosterUrls === 1 ? 'item' : 'items'} reset to thumbnail`)
                        return parts.length > 0 ? parts.join(', ') : 'Nothing to dump'
                    },
                    error: '',
                })
            },
        }),


        // ---- MediaType Endpoints ----

        getAllApprovedMediaTypes: builder.query<MediaTypeSummary[], void>({
            query: () => '/api/mediatype/all-approved',
            providesTags: ['MediaType'],
        }),

        getMediaTypeById: builder.query<MediaTypeDetail, number>({
            query: (id) => `/api/mediatype/${id}`,
            providesTags: (_, __, id) => [{ type: 'MediaType', id }],
        }),


        // ---- User Preference Endpoints ----

        // Fetches the app-wide default appearance values — public, no auth required.
        getAppearanceDefaults: builder.query<{ theme: string; modifier: string }, void>({
            query: () => '/api/user/appearance-defaults',
        }),

        // Persists the authenticated user's chosen theme to their account on the backend.
        updateUserTheme: builder.mutation<string | null, string | null>({
            query: (theme) => ({
                url: '/api/user/me/theme',
                method: 'PATCH',
                body: { theme },
            }),
        }),

        // Persists the authenticated user's chosen style modifier (e.g. "glass") to the backend.
        updateUserModifier: builder.mutation<string | null, string | null>({
            query: (modifier) => ({
                url: '/api/user/me/modifier',
                method: 'PATCH',
                body: { modifier },
            }),
        }),

        // Changes the caller's username; returns the new username on success.
        updateUsername: builder.mutation<string, string>({
            query: (newUserName) => ({
                url: '/api/user/me/username',
                method: 'PATCH',
                body: { newUserName },
            }),
        }),

        // Changes the caller's password using their current password for verification.
        updatePassword: builder.mutation<boolean, { currentPassword: string; newPassword: string }>({
            query: (body) => ({
                url: '/api/user/me/password',
                method: 'PATCH',
                body,
            }),
        }),
    }),
})

export const {
    // MediaApiRef
    useGetMediaApiRefDetailQuery,
    useGetMediaApiRefByExternalQuery,
    useSearchExternalApiQuery,
    useLazySearchExternalApiQuery,
    useFindOrCreateMediaApiRefMutation,
    useGetMediaApiRefListsQuery,
    useGetMediaApiRefTagsQuery,
    useGetAppliedTagsWithNotesQuery,
    useRefreshMediaApiRefDetailsMutation,
    // MediaList
    useGetMyMediaListsQuery,
    useLazyGetMyMediaListsQuery,
    useGetMediaListDetailQuery,
    useCreateMediaListMutation,
    useDeleteMediaListMutation,
    usePatchListBasicInfoMutation,
    useAddMediaApiRefToListMutation,
    useAddMediaApiRefToListByExternalRefMutation,
    useRemoveMediaApiRefFromListMutation,
    useRemoveMediaApiRefFromListByExternalRefMutation,
    useReorderMediaListItemsMutation,
    useMoveMediaApiRefWithinMediaListMutation,
    useSearchMediaListsQuery,
    useLazySearchMediaListsQuery,
    useGetMyVisitingStatusListsQuery,
    useGetFeaturedListsQuery,
    useCreateFeaturedListMutation,
    // CustomTag
    useGetCustomTagQuery,
    useGetMyCustomTagsQuery,
    useCreateCustomTagMutation,
    usePatchCustomTagMutation,
    useDeleteCustomTagMutation,
    useSearchCustomTagsQuery,
    useLazySearchCustomTagsQuery,
    useAddTagToMediaApiRefMutation,
    useRemoveTagFromMediaApiRefMutation,
    useGetItemsByTagQuery,
    // API Usage
    useGetApiUsageStatsQuery,
    useGetApiUsageHistoryQuery,
    useToggleApiDisabledMutation,
    useTogglePosterApiMutation,           // toggles UsePosterApi on a per-source basis
    // App Global Settings
    useGetAppGlobalSettingsQuery,
    useToggleGlobalNonSearchCacheMutation,
    useToggleGlobalSearchCacheMutation,
    useClearAllCacheItemsMutation,        // deletes all CacheItem rows (search + detail)
    // ImageCache
    useDeleteImageCachePlaceholdersMutation,
    useDeleteBigImagesMutation,           // removes poster-api:// blobs + resets PosterUrl values
    // ExternalApiSource
    useGetActiveApiSourcesQuery,
    // MediaType
    useGetAllApprovedMediaTypesQuery,
    useGetMediaTypeByIdQuery,
    // User Preferences
    useGetAppearanceDefaultsQuery,
    useUpdateUserThemeMutation,
    useUpdateUsernameMutation,
    useUpdatePasswordMutation,
} = apiSlice

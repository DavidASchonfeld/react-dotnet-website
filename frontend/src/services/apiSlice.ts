import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { clearCredentials } from '../store/authSlice'
import { safeToast } from '../utils/safeToast'
import { BACKEND_BASE_URL } from '../config'

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
import type { ApiUsageStats } from '../types/apiUsage'
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


// ---- Error Handling Wrapper ----
// api.dispatch is injected by RTK's middleware
// This is a wrapper around baseQuery to handle errors.
// This is the base query object that gets passed into apiSlice
// Below, in apiSlice, every query listed is added at the end of this baseQuery
// (as commanded in the object apiSlice's "baseQuery" value)
// that way, whenever I call a query,
// I never have to keep typing about the token, the BACKEND_BASE_URL etc.
//
const baseQueryWithErrorHandling: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extra) => {
    const result = await baseQuery(args, api, extra)

    if (result.error) {
        const status = result.error.status
        if (status === 'FETCH_ERROR') {
            safeToast.error('Unable to reach the server. Please try again later.')
        } else if (status === 401) {
            safeToast.error('Your session has expired. Please log in again.')
            api.dispatch(clearCredentials())
        } else if (status === 403) {
            safeToast.error('Access denied.')
        } else if (status === 409) {
            safeToast.error('This item is already in the list.')
        } else if (status === 429) {
            safeToast.error('Too many requests. Please slow down.')
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
        }),

        getMediaApiRefTags: builder.query<CustomTagSummary[], number>({
            query: (mediaApiRefId) => `/api/mediaapiref/${mediaApiRefId}/tags`,
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
            { query: string; limit?: number; ownedByUserId?: string; mineOnly?: boolean }
        >({
            query: ({ query, limit = 10, ownedByUserId, mineOnly }) => {
                const params = new URLSearchParams({ q: query, limit: String(limit) })
                if (ownedByUserId !== undefined) params.set('ownedByUserId', ownedByUserId)
                // mineOnly=true tells the backend to filter by the requesting user's own lists
                // (avoids needing to pass a GUID userId from the frontend)
                if (mineOnly) params.set('mineOnly', 'true')
                return `/api/medialist/search?${params}`
            },
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
            { query: string; limit?: number; mineOnly?: boolean }
        >({
            query: ({ query, limit = 10, mineOnly }) => {
                const params = new URLSearchParams({ q: query, limit: String(limit) })
                // mineOnly=true tells the backend to return only the current user's tags (skip public tags from others)
                if (mineOnly) params.set('mineOnly', 'true')
                return `/api/customtag/search?${params}`
            },
        }),

        addTagToMediaApiRef: builder.mutation<
            void,
            { tagId: number; mediaApiRefId: number }
        >({
            query: ({ tagId, mediaApiRefId }) => ({
                url: `/api/customtag/${tagId}/items/${mediaApiRefId}`,
                method: 'POST',
            }),
            invalidatesTags: (_, __, { mediaApiRefId }) => [
                { type: 'CustomTag', id: `ref-${mediaApiRefId}` },
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
            invalidatesTags: (_, __, { mediaApiRefId }) => [
                { type: 'CustomTag', id: `ref-${mediaApiRefId}` },
            ],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Removing tag...',
                    success: 'Tag removed',
                    error: '',
                })
            },
        }),

        getItemsByTag: builder.query<PaginatedResult<MediaApiRefSummary>, { tagId: number; page?: number; pageSize?: number }>({
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

        // Flips UseNonSearchQueryCache for one API source. Admin-only.
        toggleApiNonSearchCache: builder.mutation<
            { id: number; apiName: string; useNonSearchQueryCache: boolean },
            number  // externalApiSourceId
        >({
            query: (id) => ({
                url: `/api/externalapisource/${id}/toggle-nonsearch-cache`,
                method: 'PATCH',
            }),
            invalidatesTags: ['ExternalApiSource'],
            onQueryStarted: (_, { queryFulfilled }) => {
                safeToast.promise(queryFulfilled, {
                    loading: 'Updating...',
                    success: 'Cache setting updated',
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
                    success: 'Global cache setting updated',
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
    useGetFeaturedListsQuery,
    useCreateFeaturedListMutation,
    // CustomTag
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
    useToggleApiDisabledMutation,
    useToggleApiNonSearchCacheMutation,
    // App Global Settings
    useGetAppGlobalSettingsQuery,
    useToggleGlobalNonSearchCacheMutation,
    // ExternalApiSource
    useGetActiveApiSourcesQuery,
    // MediaType
    useGetAllApprovedMediaTypesQuery,
    useGetMediaTypeByIdQuery,
} = apiSlice

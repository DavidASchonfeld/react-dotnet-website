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
    MoveMediaApiRefWithinMediaListRequest,
} from '../types/mediaList'
import type { MediaTypeSummary, MediaTypeDetail } from '../types/mediaType'
import type { ApiUsageStats } from '../types/apiUsage'


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
        } else if (status === 429) {
            safeToast.error('Too many requests. Please slow down.')
        } else if (typeof status === 'number' && status >= 500) {
            safeToast.error('A server error occurred. Please try again later.')
        }
    }

    return result
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
    tagTypes: ['MediaApiRef', 'MediaList', 'MediaType', 'CustomTag'],
    endpoints: (builder) => ({


        // ---- MediaApiRef Endpoints ----

        getMediaApiRefDetail: builder.query<MediaApiRefDetail, number>({
            query: (id) => `/api/mediaapiref/${id}`,
            providesTags: (_, __, id) => [{ type: 'MediaApiRef', id }],
        }),

        // Searches the active external API for the given media type.
        // Returns raw ExternalApiSearchResult items (not DB records yet).
        // `page` is 1-based for paginated results (used by SearchResultsPage).
        searchExternalApi: builder.query<
            ExternalApiSearchResult[],
            { query: string; mediaTypeId: number; limit?: number; page?: number }
        >({
            query: ({ query, mediaTypeId, limit = 10, page = 1 }) => {
                const params = new URLSearchParams({
                    q: query,
                    mediaTypeId: String(mediaTypeId),
                    limit: String(limit),
                    page: String(page),
                })
                return `/api/mediaapiref/search?${params}`
            },
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
            invalidatesTags: ['MediaApiRef'],
        }),

        getMediaApiRefLists: builder.query<MediaListSummary[], number>({
            query: (mediaApiRefId) => `/api/mediaapiref/${mediaApiRefId}/lists`,
        }),

        getMediaApiRefTags: builder.query<CustomTagSummary[], number>({
            query: (mediaApiRefId) => `/api/mediaapiref/${mediaApiRefId}/tags`,
            providesTags: (_, __, mediaApiRefId) => [{ type: 'CustomTag', id: `ref-${mediaApiRefId}` }],
        }),


        // ---- MediaList Endpoints ----

        getMyMediaLists: builder.query<MediaListSummary[], void>({
            query: () => '/api/medialist/my-lists',
            providesTags: ['MediaList'], // refetches ALL mediaList queries
        }),

        getMediaListDetail: builder.query<MediaListDetail, number>({
            query: (id) => `/api/medialist/${id}`,
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
                    loading: 'Removing...',
                    success: 'Item removed',
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
                    loading: 'Moving...',
                    success: 'Item moved',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        searchMediaLists: builder.query<
            MediaListSummary[],
            { query: string; limit?: number; ownedByUserId?: string }
        >({
            query: ({ query, limit = 10, ownedByUserId }) => {
                const params = new URLSearchParams({ q: query, limit: String(limit) })
                if (ownedByUserId !== undefined) params.set('ownedByUserId', ownedByUserId)
                return `/api/medialist/search?${params}`
            },
        }),


        // ---- CustomTag Endpoints ----

        getMyCustomTags: builder.query<CustomTagSummary[], void>({
            query: () => '/api/customtag/my-tags',
            providesTags: ['CustomTag'],
        }),

        createCustomTag: builder.mutation<CustomTagSummary, CreateCustomTagRequest>({
            query: (body) => ({
                url: '/api/customtag/create',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['CustomTag'],
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
                    loading: 'Deleting tag...',
                    success: 'Tag deleted',
                    error: '',
                })
            },
        }),

        searchCustomTags: builder.query<
            CustomTagSummary[],
            { query: string; limit?: number }
        >({
            query: ({ query, limit = 10 }) => {
                const params = new URLSearchParams({ q: query, limit: String(limit) })
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
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
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
                    loading: 'Removing tag...',
                    success: 'Tag removed',
                    error: '',
                })
            },
        }),

        getItemsByTag: builder.query<MediaApiRefSummary[], number>({
            query: (tagId) => `/api/customtag/${tagId}/items`,
            providesTags: (_, __, tagId) => [{ type: 'CustomTag', id: tagId }],
        }),


        // ---- ExternalApiSource Endpoints ----

        getActiveApiSources: builder.query<ExternalApiSourceSummary[], void>({
            query: () => '/api/externalapisource/active',
        }),


        // ---- API Usage Endpoints ----

        // Returns usage stats for all external APIs. Admin-only — backend returns 403 for non-admins.
        getApiUsageStats: builder.query<ApiUsageStats[], void>({
            query: () => '/api/apiusage',
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
    useSearchExternalApiQuery,
    useLazySearchExternalApiQuery,
    useFindOrCreateMediaApiRefMutation,
    useGetMediaApiRefListsQuery,
    useGetMediaApiRefTagsQuery,
    // MediaList
    useGetMyMediaListsQuery,
    useLazyGetMyMediaListsQuery,
    useGetMediaListDetailQuery,
    useCreateMediaListMutation,
    useDeleteMediaListMutation,
    usePatchListBasicInfoMutation,
    useAddMediaApiRefToListMutation,
    useRemoveMediaApiRefFromListMutation,
    useReorderMediaListItemsMutation,
    useMoveMediaApiRefWithinMediaListMutation,
    useLazySearchMediaListsQuery,
    // CustomTag
    useGetMyCustomTagsQuery,
    useCreateCustomTagMutation,
    usePatchCustomTagMutation,
    useDeleteCustomTagMutation,
    useLazySearchCustomTagsQuery,
    useAddTagToMediaApiRefMutation,
    useRemoveTagFromMediaApiRefMutation,
    useGetItemsByTagQuery,
    // API Usage
    useGetApiUsageStatsQuery,
    // ExternalApiSource
    useGetActiveApiSourcesQuery,
    // MediaType
    useGetAllApprovedMediaTypesQuery,
    useGetMediaTypeByIdQuery,
} = apiSlice

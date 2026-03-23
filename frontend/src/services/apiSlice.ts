import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { clearCredentials } from '../store/authSlice'
import { safeToast } from '../utils/safeToast'
import { BACKEND_BASE_URL } from '../config'

import type {
    MediaItemDetail,
    MediaItemSummary,
    CreateMediaItemRequest,
    PatchMediaItemBasicInfoRequest,
} from '../types/mediaItem'
import type {
    MediaListDetail,
    MediaListSummary,
    CreateMediaListRequest,
    UpdateMediaListNotListContentRequest,
    AddMediaItemToMediaListRequest,
    MoveMediaItemWithinMediaListRequest,
} from '../types/mediaList'
import type { MediaTypeSummary, MediaTypeDetail } from '../types/mediaType'


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
// One file replaces: apiClient.ts, mediaItemService.ts, mediaListService.ts, mediaTypeService.ts
// RTK Query auto-generates hooks for each endpoint.


export const apiSlice = createApi({

    // This is the name of the reducerPath,
    // so in store.ts, I will pass in apiSlice.reducerPath AKA accessing this specific value
    reducerPath: 'api',  

    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['MediaItem', 'MediaList', 'MediaType'],
    endpoints: (builder) => ({


        // ---- MediaItem Endpoints ----

        getMediaItemDetail: builder.query<MediaItemDetail, number>({
            query: (id) => `/api/mediaitem/${id}`,
            providesTags: (_, __, id) => [{ type: 'MediaItem', id }],
        }),

        getRandomMediaItems: builder.query<MediaItemSummary[], number>({
            query: (amount) => `/api/mediaitem/random/${amount}`,
        }),

        getAllApprovedMediaItemsForAdmin: builder.query<MediaItemSummary[], void>({
            query: () => '/api/mediaitem/all-approved-admin',
            providesTags: ['MediaItem'],
        }),

        createMediaItem: builder.mutation<MediaItemDetail, CreateMediaItemRequest>({
            query: (body) => ({
                url: '/api/mediaitem/create',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['MediaItem'],
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
                    loading: 'Creating...',
                    success: 'Media item created!',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        deleteMediaItem: builder.mutation<void, number>({
            query: (id) => ({
                url: `/api/mediaitem/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['MediaItem'],
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
                    loading: 'Deleting...',
                    success: 'Media item deleted',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        patchMediaItemBasicInfo: builder.mutation<
            MediaItemDetail,
            { mediaItemId: number; data: PatchMediaItemBasicInfoRequest }
        >({
            query: ({ mediaItemId, data }) => ({
                url: `/api/mediaitem/${mediaItemId}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_, __, { mediaItemId }) => [
                { type: 'MediaItem', id: mediaItemId },
                'MediaItem',
            ],
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
                    loading: 'Saving...',
                    success: 'Changes saved',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        searchMediaItems: builder.query<
            MediaItemSummary[],
            { query: string; limit?: number; mediaTypeId?: number }
        >({
            query: ({ query, limit = 10, mediaTypeId }) => {
                const params = new URLSearchParams({ q: query, limit: String(limit) })
                if (mediaTypeId !== undefined) params.set('mediaTypeId', String(mediaTypeId))
                return `/api/mediaitem/search?${params}`
            },
        }),

        getMediaItemLists: builder.query<MediaListSummary[], number>({
            query: (mediaItemId) => `/api/mediaitem/${mediaItemId}/lists`,
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

        addMediaItemToList: builder.mutation<
            MediaListSummary,
            { listId: number; mediaItemId: number; data?: AddMediaItemToMediaListRequest }
        >({
            query: ({ listId, mediaItemId, data }) => ({
                url: `/api/medialist/${listId}/items/${mediaItemId}`,
                method: 'POST',
                body: data ?? {},
            }),
            invalidatesTags: (_, __, { listId }) => [
                { type: 'MediaList', id: listId },
                'MediaList',
                'MediaItem',
            ],
            onQueryStarted: async (_, { queryFulfilled }) => {
                await safeToast.promise(queryFulfilled, {
                    loading: 'Adding...',
                    success: 'Item added to list',
                    error: '',   // suppressed — baseQueryWithErrorHandling handles errors
                })
            },
        }),

        removeMediaItemFromList: builder.mutation<
            MediaListSummary,
            { listId: number; mediaItemId: number }
        >({
            query: ({ listId, mediaItemId }) => ({
                url: `/api/medialist/${listId}/items/${mediaItemId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_, __, { listId }) => [
                { type: 'MediaList', id: listId },
                'MediaList',
                'MediaItem',
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

        moveMediaItemWithinMediaList: builder.mutation<
            MediaListSummary,
            { listId: number; mediaItemId: number; data: MoveMediaItemWithinMediaListRequest }
        >({
            query: ({ listId, mediaItemId, data }) => ({
                url: `/api/medialist/${listId}/items/${mediaItemId}`,
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
    useGetMediaItemDetailQuery,
    useLazyGetMediaItemDetailQuery,
    useGetRandomMediaItemsQuery,
    useGetAllApprovedMediaItemsForAdminQuery,
    useCreateMediaItemMutation,
    useDeleteMediaItemMutation,
    usePatchMediaItemBasicInfoMutation,
    useLazySearchMediaItemsQuery,
    useGetMediaItemListsQuery,
    useLazyGetMediaItemListsQuery,
    useGetMyMediaListsQuery,
    useLazyGetMyMediaListsQuery,
    useGetMediaListDetailQuery,
    useCreateMediaListMutation,
    useDeleteMediaListMutation,
    usePatchListBasicInfoMutation,
    useAddMediaItemToListMutation,
    useRemoveMediaItemFromListMutation,
    useReorderMediaListItemsMutation,
    useMoveMediaItemWithinMediaListMutation,
    useLazySearchMediaListsQuery,
    useGetAllApprovedMediaTypesQuery,
    useGetMediaTypeByIdQuery,
} = apiSlice

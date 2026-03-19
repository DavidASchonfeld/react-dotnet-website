import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { MediaListSummary, MediaListDetail, CreateMediaListRequest, UpdateMediaListNotListContentRequest } from '../types/mediaList';
import {
    getMyMediaLists,
    getMediaListDetail,
    createMediaList,
    deleteMediaList,
    patchListBasicInfo,
    addMediaItemToList,
    removeMediaItemFromList,
    reorderMediaListItems,
} from '../services/mediaListService';
import type { MediaItemSummary } from '../types/mediaItem';



type MediaListsState = {
    mediaLists: MediaListSummary[];
    selectedMediaListDetail: MediaListDetail | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
};


// Sets the initial value of the MediaListsState object to null/false/etc.
// will be automatically filled by the persist storage
const initialState: MediaListsState = {
    mediaLists: [],
    selectedMediaListDetail: null,
    status: 'idle',
    error: null
};


// Async Thunks:

// Unlike before, where I had my MyMediaListsPage.tsx to call my service (aka the code that calls the API),
// and manage/store the MediaList(s) that it is currently looking at,
// this file will manage all that and 
// the MyMediaListsPage.tsx will only manage the design/actual things that users see,
// not the data

// This is the replacement for the MyMediaListsPage.tsx using a callback to call my getMyMediaLists(token) function.
export const fetchMyLists = createAsyncThunk(
    'mediaLists/fetchMyLists',
    async (token: string) => {
        return await getMyMediaLists(token);
    }
);


export const fetchListDetail = createAsyncThunk(
    'mediaLists/fetchListDetail',
    async ({token, mediaListId}: {token: string; mediaListId: number}) => {
        return await getMediaListDetail(token, mediaListId);
    }
);


export const createList = createAsyncThunk(
    'mediaLists/createList',
    async({token, data}: {token: string; data: CreateMediaListRequest}) => {
        return await createMediaList(token, data);
    }
);


export const deleteList = createAsyncThunk(
    'mediaLists/deleteList',
    async ({token, mediaListId}: {token: string; mediaListId: number}) => {
        await deleteMediaList(token, mediaListId);

        // Since deleteMediaList returns void (aka nothing),
        // I am returning mediaListId so my slice
        // (in the my code below in this same file)
        // can remove the list in my frontend storage
        // without needing to call API requests 
        return mediaListId;
    }
);

export const patchBasicInfoList = createAsyncThunk(
    'mediaLists/patchBasicInfoList',
    async ({token, mediaListId, data}: {token: string; mediaListId: number; data: UpdateMediaListNotListContentRequest}) => {
        return await patchListBasicInfo(token, mediaListId, data);
    }
);

export const addItemToList = createAsyncThunk(
    'mediaLists/addItemToList',
    async ({token, mediaListId, mediaItemId, mediaItem} : {
        token: string;
        mediaListId: number;
        mediaItemId: number;
        mediaItem: MediaItemSummary;
    }) => {
        await addMediaItemToList(token, mediaListId, mediaItemId, {});
        return mediaItem;  // Return the item so the state can append it optimistically
    }
);

export const removeItemFromList = createAsyncThunk(
    'mediaLists/removeItemFromList',
    async ({token, mediaListId, mediaItemId }: {token: string; mediaListId: number; mediaItemId: number}) => {
        await removeMediaItemFromList(token, mediaListId, mediaItemId);
        return mediaItemId;  // Return the Id so the state/my Redux logic can filter it out
    }
);

export const reorderItemsInList = createAsyncThunk(
    'mediaLists/reorderItemsInList',
    async ({token, mediaListId, orderedItemIds}: {token: string; mediaListId: number; orderedItemIds: number[]}) => {
        await reorderMediaListItems(token, mediaListId, orderedItemIds);
        return orderedItemIds;
    }
);


// Slices

const mediaListsSlice = createSlice({
    name: 'mediaLists',
    initialState,

    // reducers VS extraReducers
    // For both, I dispatch (aka request for them to be run) to Redux, who runs them

    // reducers: defines synchronous actions that this slice creates and owns.
    // extraReducers: listens to actions created outside of the slice,
    //      specifically the .pending/.fulfilled/.rejected
    //      lifecycle events emitted by createAsyncThunk.
    
    reducers: {
        clearSelectedListDetail: (state) => {
            state.selectedMediaListDetail = null;
        }
    },
    extraReducers: (builder) => {


        // ---- fetchMyLists ------
        builder.addCase(fetchMyLists.pending, (state) => {
            // Replace the setIsLoading(true) and setError(null) from original logic in MyMediaListsPage.tsx
            state.status = 'loading';
            state.error = null;
        })
        .addCase(fetchMyLists.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;

            // action.payload is the list of the user's MediaList objects.
            state.mediaLists = action.payload;
        })
        .addCase(fetchMyLists.rejected, (state, action) => {
            state.status = 'failed';

            // If action.error.message is null, use the string "Failed to load lists."
            state.error = action.error.message ?? 'Failed to load lists.';
        });



        // ---- fetchListDetail ----
        builder.addCase(fetchListDetail.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        })
        .addCase(fetchListDetail.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;
            state.selectedMediaListDetail = action.payload;
        })
        .addCase(fetchListDetail.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to load list details.';
        })



        // ---- createList -----
        
        // When successful, push the new list directly into state.lists
        // This means that the page updates immediately
        // without needing another API call to show the updated list of MediaList objects

        builder.addCase(createList.fulfilled, (state, action) => {

            // action.payload = the MediaListSummary returned by createMediaList()
            state.status = 'succeeded';
            state.error = null;
            state.mediaLists.push(action.payload);
        });

        builder.addCase(createList.pending, (state) => {

            // action.payload = the MediaListSummary returned by createMediaList()
            state.status = 'loading';
            state.error = null;
        });

        builder.addCase(createList.rejected, (state, action) => {

            // action.payload = the MediaListSummary returned by createMediaList()
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to create list.';
        });
        


        // ---- deleteList -----

        // action.payload = the mediaListId number returned from the "deleteList" thunk function listed above in this file.
        // Filter it out of the lists array so we can immediately show the change to the user
        // without needing to send another API request to show the updated list of MediaList items
        builder.addCase(deleteList.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;
            state.mediaLists = state.mediaLists.filter(l => l.id !== action.payload);
        });


        builder.addCase(deleteList.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to delete list.';
        });


        // ---- patchBasicInfoList -----
        
        builder.addCase(patchBasicInfoList.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;

            // Update selectedMediaListDetail fields in place
            if (state.selectedMediaListDetail) {
                state.selectedMediaListDetail.name = action.payload.name;
                state.selectedMediaListDetail.description = action.payload.description;
                state.selectedMediaListDetail.visibilityStatus = action.payload.visibilityStatus;
            }

            // Update the MediaListSummary in mediaLists[]
            const indexInStoreListOfMediaLists = state.mediaLists.findIndex(l => l.id === action.payload.id);
            if (indexInStoreListOfMediaLists !== -1) state.mediaLists[indexInStoreListOfMediaLists] = action.payload;
        });

        builder.addCase(patchBasicInfoList.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });

        builder.addCase(patchBasicInfoList.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to update list.';
        });


        // ---- addItemToList -----

        builder.addCase(addItemToList.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;

            
            if (state.selectedMediaListDetail) {
                state.selectedMediaListDetail.listContent.push(action.payload);
            }
        });

        builder.addCase(addItemToList.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(addItemToList.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to update list.';
        });


        // ---- removeItemFromList -----

        builder.addCase(removeItemFromList.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;

            
            // If the item is in the detail, remove it since the user just successfully deleted the item.
            if (state.selectedMediaListDetail) {
                state.selectedMediaListDetail.listContent = state.selectedMediaListDetail.listContent.filter(item => item.id !== action.payload);
            }
        });

        builder.addCase(removeItemFromList.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(removeItemFromList.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to update list.';
        });


        // ---- reorderItemsInList -----
        // Optimistic update is handled locally in the page before dispatch,
        // so no state mutation needed on fulfilled — just clear any error.
        builder.addCase(reorderItemsInList.fulfilled, (state) => {
            state.status = 'succeeded';
            state.error = null;
        });
        builder.addCase(reorderItemsInList.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to reorder list items.';
        });
    }
});

export const {clearSelectedListDetail} = mediaListsSlice.actions;
export default mediaListsSlice.reducer;
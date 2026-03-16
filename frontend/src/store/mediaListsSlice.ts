import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { MediaListSummary, MediaListDetail, CreateMediaListRequest } from '../types/mediaList';
import {
    getMyMediaLists,
    getMediaListDetail,
    createMediaList,
    deleteMediaList,
} from '../services/mediaListService';



//TODO: Comments
type MediaListsState = {
    mediaLists: MediaListSummary[];
    selectedMediaListDetail: MediaListDetail | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
};


// Sets the inital value of the MediaListsState object to null/false/etc.
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

// Is the replacement for the MyMediaListsPage.tsx using a callback to call my getMyMediaLists(token) function.
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

        // Since deteMediaList returns void (aka nothing),
        // I am returning mediaListId so my slice
        // (in the my code below in this same file)
        // can remove the list in my frontend storage
        // without needing to call API requests 
        return mediaListId;
    }
)


// Slices

const mediaListsSlice = createSlice({
    name: 'mediaLists',
    initialState,
    reducers: {
        //TODO: Comment
        clearSelectedListDetail: (state) => {
            state.selectedMediaListDetail = null;
        }
    },
    extraReducers: (builder) => {


        // ---- fetchMyLists ------
        builder.addCase(fetchMyLists.pending, (state) => {
            // Replace the setIsLoading(true) and setError(null) from original logc in MyMediaLsitsPage.tsx
            state.status = 'loading';
            state.error = null;
        })
        .addCase(fetchMyLists.fulfilled, (state, action) => {
            state.status = 'succeeded';

            // action.payload is the list of the user's MediaList objects.
            state.mediaLists = action.payload;
        })
        .addCase(fetchMyLists.rejected, (state, action) => {
            state.status = 'failed';

            // If aciton.error.message is null, use the string "Failed to load lists."
            state.error = action.error.message ?? 'Failed to load lists.';
        });



        // ---- fetchListDetail ----
        builder.addCase(fetchListDetail.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        })
        .addCase(fetchListDetail.fulfilled, (state, action) => {
            state.status = 'succeeded';
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
            state.mediaLists.push(action.payload);
        });
        


        // ---- deleteList -----

        // action.payload = the mediaListId number returned from the "deleteList" thunk function listed above in this file.
        // Filter it out of the lists array so we can immediately show the change to the user
        // without needing to send another API request to show the updated list of MediaList items
        builder.addCase(deleteList.fulfilled, (state, action) => {
            state.mediaLists = state.mediaLists.filter(l => l.id !== action.payload);
        });

    }
});

export const {clearSelectedListDetail} = mediaListsSlice.actions;
export default mediaListsSlice.reducer;
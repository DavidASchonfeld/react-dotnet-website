import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { MediaItemSummary, MediaItemDetail, CreateMediaItemRequest, PatchMediaItemBasicInfoRequest} from '../types/mediaItem'
import * as mediaItemService from '../services/mediaItemService';

type MediaItemsState = {
    mediaItems: MediaItemSummary[];
    selectedMediaItemDetail: MediaItemDetail | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

// Sets the inital value of the MediaItemsState object to null/false/etc.
// will be automatically filled by the persist storage
const initialState: MediaItemsState = {
    mediaItems: [],
    selectedMediaItemDetail: null,
    status: 'idle',
    error: null
};


// Async Thunks

export const fetchMediaItemDetail = createAsyncThunk(
    'mediaItems/fetchMediaItemDetail',  // I can choose whatever value I want in here. It's for me, the developer to see in other places as the name for this async thunk.
    async({token, mediaItemId}: {token: string; mediaItemId: number}) => {
        return await mediaItemService.getMediaItemDetail(token, mediaItemId);
    }
);

export const createMediaItemTHUNK = createAsyncThunk(
    'mediaItems/create',
    async({token, data}: {token: string; data: CreateMediaItemRequest}) => {
        return await mediaItemService.createMediaItem(token, data);
    }
);

export const deleteMediaItemTHUNK = createAsyncThunk(
    'mediaItems/delete',
    async ({token, mediaItemId}: {token: string; mediaItemId: number}) => {
        await mediaItemService.deleteMediaItem(token, mediaItemId);

        // Since deleteMediaItem returns void (aka nothing),
        // I am returning mediaItemId so my slice
        // (in the my code below in this same file)
        // can remove the list in my frontend storage
        // without needing to call API requests 
        return mediaItemId;
    }
)

export const fetchRandomMediaItems = createAsyncThunk(
    'mediaItems/fetchRandomAmountX',
    async({token, amount}: {token: string; amount: number}) => {
        return await mediaItemService.getRandomMediaItems(token, amount);
    }
);

export const fetchAllApprovedMediaItemsForAdmin = createAsyncThunk(
    'mediaItems/fetchAllApprovedForAdmin',
    async (token: string) => {
        return await mediaItemService.getAllApprovedMediaItemsForAdmin(token);
    }
);

export const patchMediaItemBasicInfoTHUNK = createAsyncThunk(
    'mediaItems/patchNotLinks',
    async({token, mediaItemId, data}: {token: string; mediaItemId: number, data: PatchMediaItemBasicInfoRequest}) => {
        return await mediaItemService.patchMediaItemBasicInfo(token, mediaItemId, data);
    }
)




// Slices

const mediaItemsSlice = createSlice({
    name: 'mediaItems',
    initialState,
    reducers: {
        
        clearSelectedMediaItemDetail: (state) => {
            state.selectedMediaItemDetail = null;
        }
    },
    extraReducers: (builder) => {

        // ---- All Loading -----
        builder.addCase(fetchMediaItemDetail.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(createMediaItemTHUNK.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(deleteMediaItemTHUNK.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(fetchRandomMediaItems.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(fetchAllApprovedMediaItemsForAdmin.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(patchMediaItemBasicInfoTHUNK.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });


        // ---- All Error -----
        // I am putting all error cases in 1 section, since I am doing the same basic actions for erros for all methods

        builder.addCase(fetchMediaItemDetail.rejected, (state, action) => {
            state.status = 'failed';

            // If action.error.message is null, set it to the string below: "Failed to load media item."
            state.error = action.error.message ?? 'Failed to load media item.';
        });

        builder.addCase(createMediaItemTHUNK.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to create media item.';
        });

        builder.addCase(deleteMediaItemTHUNK.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to delete media item.';
        });

        builder.addCase(fetchRandomMediaItems.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to fetch random media items.';
        });
        builder.addCase(fetchAllApprovedMediaItemsForAdmin.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to fetch all approved media items (admin exclusive method).';
        });
        builder.addCase(patchMediaItemBasicInfoTHUNK.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to patch media item\'s basic (aka non-linked) info.';
        });




        // ---- Success ----

        builder.addCase(fetchMediaItemDetail.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;
            state.selectedMediaItemDetail = action.payload;
        });

        
        builder.addCase(createMediaItemTHUNK.fulfilled, (state, action) => {

            // action.payload = the MediaItemDetail returned by createMediaItem()
            state.status = 'succeeded';
            state.error = null;
            // Since mediaItems is MediaItemSummary[],
            // here I am converting the input MediaItemDetail
            // that this received from the HTTP CreateMediaItem request
            // and then adding the MediaItems array.
            state.mediaItems.push({
                id: action.payload.id,
                name: action.payload.name,
                mediaTypeId: action.payload.mediaTypeId
            } as MediaItemSummary);
        });
        
        builder.addCase(deleteMediaItemTHUNK.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;

            // action.payload = the mediaItemId number returned from the "deleteMediaItem" thunk
            state.mediaItems = state.mediaItems.filter(l => l.id !== action.payload);
        });

        builder.addCase(fetchRandomMediaItems.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;

            // Loading only those randomly chosen mediaItems in my current dispalyed list of Media Items
            state.mediaItems = action.payload;
        });
        

        builder.addCase(fetchAllApprovedMediaItemsForAdmin.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;
            state.mediaItems = action.payload;
        });

        builder.addCase(patchMediaItemBasicInfoTHUNK.fulfilled, (state, action) => {

            // Since the patch was successful
            // completely replace this front-end version of the mediaItem
            // with the newly updated mediaItem received from the backend
            const index = state.mediaItems.findIndex(i => i.id === action.payload.id);
            if (index !== -1){

                // Pull information from the MediaItemDetail into this MediaItemSummary item
                state.mediaItems[index] = {
                    id: action.payload.id,
                    name: action.payload.name,
                    mediaTypeId: action.payload.mediaTypeId
                };
            }

            // If that mediaItem is in the currently-being-viewed detail, update that too:
            if (state.selectedMediaItemDetail?.id === action.payload.id) {
                state.selectedMediaItemDetail = action.payload;
            }
        });
        





    }
});

export const {clearSelectedMediaItemDetail} = mediaItemsSlice.actions;
export default mediaItemsSlice.reducer;
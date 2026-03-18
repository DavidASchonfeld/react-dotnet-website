import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { MediaTypeSummary, MediaTypeDetail } from "../types/mediaType";
import * as mediaTypeService from '../services/mediaTypeService';

type MediaTypesState = {
    mediaTypes: MediaTypeSummary[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
};

const initialState: MediaTypesState = {
    mediaTypes: [],
    status: 'idle',
    error: null
};


// Loads all approved types
// Will run once when this frontend starts up
export const fetchAllApprovedMediaTypes = createAsyncThunk(
    'mediaTypes/fetchAllApproved',
    async (token: string) => {
        return await mediaTypeService.getAllApprovedMediaTypes(token);
    }
);


// Fetches 1 MediaType by its Id.
// Never rejects: fallback will be a placeholder MediaType object
// to prevent this method from being called over and over
// on every render
export const fetchSingleMediaType = createAsyncThunk(
    'mediaTypes/fetchSingle',
    async ({token, mediaTypeId}: {token: string; mediaTypeId: number}) => {
        try {
            return await mediaTypeService.getMediaTypeById(token, mediaTypeId);
        } catch {
            const fallback: MediaTypeDetail = {
                id: mediaTypeId,
                name: 'Unknown',
                icon: '❓',
                description: null,


                // Submission Details:
                // Besides isApproved, setting all to blank
                // Setting isApproved = true so this MediaType doesn't get filtered out
                isApproved: true,  
                submittedById: '',
                dateSubmitted: ''
            }
            return fallback;
        }
    }
)

const mediaTypesSlice = createSlice({
    name: 'mediaTypes',
    initialState,
    reducers: {},
    extraReducers: (builder) => {


        // ---- Fetch All Approved Media Types ----

        builder.addCase(fetchAllApprovedMediaTypes.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });

        builder.addCase(fetchAllApprovedMediaTypes.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;
            state.mediaTypes = action.payload;
        });

        builder.addCase(fetchAllApprovedMediaTypes.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? 'Failed to load media types';
        });


        // ---- Fetch 1 Media Type by Id ----
        builder.addCase(fetchSingleMediaType.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.error = null;

            // Only add if not already in the store (to prevent duplicates)
            const alreadyExists = state.mediaTypes.some(t => t.id === action.payload.id);
            if (!alreadyExists)
                state.mediaTypes.push(action.payload);
        });


        builder.addCase(fetchSingleMediaType.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(fetchSingleMediaType.rejected, (state, action) => {
            state.status = 'failed';

            // Note: I am using backtick ` NOT single quotation mark ' to ensure that ${} inputs the variable value.
            state.error = action.error.message ?? `Failed to load media type with id ${action.meta.arg.mediaTypeId}`;
        });
    }
});

export default mediaTypesSlice.reducer;
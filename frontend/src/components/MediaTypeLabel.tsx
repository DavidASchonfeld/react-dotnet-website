import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from '../store/store';
import { fetchSingleMediaType } from "../store/mediaTypesSlice";

export default function MediaTypeLabel({mediaTypeId}: {mediaTypeId: number}){

        const dispatch = useDispatch<AppDispatch>();
        const { token } = useSelector((state: RootState) => state.auth);
        const mediaType = useSelector((state: RootState) =>
            state.mediaTypes.mediaTypes.find(t => t.id === mediaTypeId)
        );

        // If this MediaType is not in Redux's store yet
        // (for example, if someone recently
        // approved/published a new MediaType),
        // fetch it.
        // App.tsx already loaded all approved types when login
        // so this only fires for edge-case missing types
        useEffect(() => {
            if(!mediaType && token) {
                dispatch(fetchSingleMediaType({token, mediaTypeId}));
            }
        }, [mediaType, token, mediaTypeId, dispatch]);



        return (
            <>
            {/*
                Tailwind:
                Pill-Appearnace:
                rounded-full: makes this look like a pill
                inline-flex and items-center: puts both items on the same line, centered in the object
                gap-1.5 puts a 1.5 gap between the 2 objects
                px-3 py-1: Puts 3 padding in x direction and 1 padding in the y direction.

                Text:
                font-medium controls the bold/heavy for the letters
                text-sm controls the font size
            */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                <span>{mediaType?.icon ?? ''}</span>

            {/* The "..." below is to demonstrate that the name is still loading.
            In the mediaTypeSlice, I have a fallback placeholder mediaType
            so if the script cannot find info on the matching mediaTypeId,
            the ... will still be replaced by that fallback's mediaType's Name
            I hardcoded that fallback MediaType's Name to be "Unknown" and icon to "❓"*/}
                <span>{mediaType?.name ?? '❓'}</span>
            </span>
            </>
        );


}
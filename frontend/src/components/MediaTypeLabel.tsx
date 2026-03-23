import { useSelector } from "react-redux";
import type { RootState } from '../store/store';
import { useGetAllApprovedMediaTypesQuery } from "../services/apiSlice";

export default function MediaTypeLabel({mediaTypeId, faded}: {mediaTypeId: number, faded?: boolean}){

        const { token } = useSelector((state: RootState) => state.auth);

        // Re-use the same cached query that App.tsx already fired on login.
        // RTK Query deduplicates — no extra network request if the data is already in cache.
        // skip=true when there is no token so this component does not try to fetch unauthenticated.
        const { data: allTypes } = useGetAllApprovedMediaTypesQuery(undefined, { skip: !token });
        const mediaType = allTypes?.find(t => t.id === mediaTypeId);



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

                ${faded ? 'bg-border/60' : 'bg-surface-raised'}
                -- if faded == true, make the background (not the txt/icon) faded/very transparent
                -- if faded == false, use the theme's raised surface color.

            */}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-text ${faded ? 'bg-border/60' : 'bg-surface-raised'}`}>

                <span>{mediaType?.icon ?? ''}</span>

                {/* The "..." below is to demonstrate that the name is still loading.
                In the mediaTypeSlice, I have a fallback placeholder mediaType
                so if the script cannot find info on the matching mediaTypeId,
                the ... will still be replaced by that fallback's mediaType's Name
                I hardcoded that fallback MediaType's Name to be "Unknown" and icon to "❓"*/}
                <span className="hidden sm:inline">{mediaType?.name ?? '❓'}</span>
            </span>
            </>
        );


}
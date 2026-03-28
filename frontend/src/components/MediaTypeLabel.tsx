import { useGetAllApprovedMediaTypesQuery } from "../services/apiSlice";
import { getMediaTypeIcon } from "../utils/mediaTypeIcons";
import { SUBTYPE_DISPLAY } from "../constants"; // subtype icon/label map lives in constants to keep this file component-only

export default function MediaTypeLabel({mediaTypeId, faded, subtype}: {mediaTypeId: number, faded?: boolean, subtype?: string | null}){

        // Approved media types are public — fetch for all users, no token required.
        // RTK Query deduplicates — no extra network request if the data is already in cache.
        const { data: allTypes } = useGetAllApprovedMediaTypesQuery(undefined);
        const mediaType = allTypes?.find(t => t.id === mediaTypeId);

        // When a subtype is known, use its specific label; otherwise fall back to the MediaType name
        const subtypeDisplay = subtype ? SUBTYPE_DISPLAY[subtype] : undefined;
        const icon  = subtypeDisplay?.icon  ?? getMediaTypeIcon(mediaType?.name);
        const label = subtypeDisplay?.label ?? mediaType?.name ?? '...';

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

                <span>{icon}</span>

                {/* The "..." below is to demonstrate that the name is still loading.
                In the mediaTypeSlice, I have a fallback placeholder mediaType
                so if the script cannot find info on the matching mediaTypeId,
                the ... will still be replaced by that fallback's mediaType's Name
                I hardcoded that fallback MediaType's Name to be "Unknown"
                getMediaTypeIcon returns "❓" for any unrecognized or undefined name */}
                <span className="hidden sm:inline">{label}</span>
            </span>
            </>
        );


}
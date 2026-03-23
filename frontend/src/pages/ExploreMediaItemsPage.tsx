import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RowItemContent from "../components/RowItemContent";
import RowItemStyling from "../components/RowItemStyling";
import MediaTypeLabel from "../components/MediaTypeLabel";
import { EXPLORE_PAGE_ITEM_COUNT } from "../constants";
import AnimatedPage from "../components/AnimatedPage";
import { safeToast } from "../utils/safeToast";
import { useGetRandomMediaItemsQuery } from "../services/apiSlice";


export default function ExploreMediaItemsPage() {


    // Importing ability to Redirect
    const navigate = useNavigate();

    // Number of Random MediaItems to show on this page
    const amount = EXPLORE_PAGE_ITEM_COUNT;

    const { data: mediaItems = [], isLoading, error, refetch } = useGetRandomMediaItemsQuery(amount);

    // Show an error toast if the query fails
    useEffect(() => {
        if (error) safeToast.error('Failed to load items');
    }, [error]);

    // The scroll-up too much automatically refreshes the list of MediaItems.
    useEffect( () => {
        let lastScrollY = window.scrollY;
        function handleScroll() {
            const currentScrollY = window.scrollY;
            if (currentScrollY === 0 && lastScrollY > 0){
                // Intentionally silent — errors are handled by the error toast above.
                refetch();
            }
            lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [refetch]);




    if (isLoading) return (
        <div className="page">
            {/* animate-pulse: Tailwind class that fades opacity in and out, creating
                a "breathing" shimmer effect. It needs multiple child <div>s because
                animate-pulse only provides the animation — each child <div> is a
                separate placeholder block that visually represents one row item that
                will appear once data loads. Without them there is nothing to animate. */}
            <div className="animate-pulse space-y-3">
                <RowItemStyling>
                    <div className="h-14 bg-surface-raised rounded-lg" />
                </RowItemStyling>
            </div>
        </div>
    );

    return (
        <AnimatedPage>
        <div className ="page flex-col">
            <h1 className = "h1-styling">Explore Media Items</h1>
            <button
                // mx-auto automatically sets margins left/right to auto, which centers this button because its parent container div has "flex"
                className = "btn btn-secondary w-fit mx-auto"
                onClick = {() => refetch()}
            >Refresh</button>
            <br />
            {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm mx-auto">
                    Failed to load items
                </div>
            )}
            <div>
                {mediaItems.map(mediaItem => (
                    <RowItemStyling key={mediaItem.id} onClick={() => navigate(`/mediaitem/${mediaItem.id}`)}>
                        <RowItemContent
                            firstString={mediaItem.name}
                            secondString={'TODO: ADD CREATORS'}
                            labelPill={<MediaTypeLabel mediaTypeId={mediaItem.mediaTypeId} faded={true} />}
                        />
                    </RowItemStyling>
                ))}
            </div>
        </div>
        </AnimatedPage>
    );

}

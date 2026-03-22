import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import { useEffect } from "react";
import { fetchRandomMediaItems} from "../store/mediaItemsSlice";
import { useNavigate } from "react-router-dom";
import RowItemContent from "../components/RowItemContent";
import RowItemStyling from "../components/RowItemStyling";
import MediaTypeLabel from "../components/MediaTypeLabel";
import { EXPLORE_PAGE_ITEM_COUNT } from "../constants";
import AnimatedPage from "../components/AnimatedPage";
import { safeToast } from "../utils/safeToast";


export default function ExploreMediaItemsPage() {


    // Importing ability to Redirect
    const navigate = useNavigate(); 
    
    const { mediaItems, status, error } = useSelector((state: RootState) => state.mediaItems);
    const token = useSelector((state: RootState) => state.auth.token);


    const dispatch = useDispatch<AppDispatch>();

    // Number of Random MediaItems to show on this page
    const amount = EXPLORE_PAGE_ITEM_COUNT;

    useEffect( () => {
        const run = async () => {
            try {
                await dispatch(fetchRandomMediaItems({token: token!, amount: amount})).unwrap();
            } catch (err) {
                console.error(err);
                safeToast.error('Failed to load items');
            }
        };
        run();
    }, [dispatch, token, amount]);

    // The scroll-up too much automatically refreshes the list of MediaItems.
    useEffect( () => {
        let lastScrollY = window.scrollY;
        function handleScroll() {
            const currentScrollY = window.scrollY;
            if (currentScrollY === 0 && lastScrollY > 0){
                // I am intentially giving it silent failing, because this triggers every time
                // that the user scrolls to the top, which would be disruptive to the user.
                // Errors are still stored in the Redux state.
                // I need to use .unwrap() to expose dispatch's error outwards, which I need here
                // to catch the error and type it to the console.log.
                dispatch(fetchRandomMediaItems({token: token!, amount: amount}))
                    .unwrap()
                    .catch(err => console.log('[Scroll Refresh] Silent fail — Error stored in Redux state:', err));
            }
            lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [dispatch, token, amount]);




    if (status === 'loading') return (
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
                onClick = {() => dispatch(fetchRandomMediaItems({token: token!, amount: amount}))}
            >Refresh</button>
            <br />
            {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm mx-auto">
                    {error}
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
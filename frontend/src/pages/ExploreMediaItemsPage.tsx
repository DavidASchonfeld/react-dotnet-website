import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import { useEffect } from "react";
import { fetchRandomMediaItems} from "../store/mediaItemsSlice";
import MediaTypeLabel from "../components/MediaTypeLabel";
import { Link } from "react-router-dom";


export default function ExploreMediaItemsPage() {


    
    // Original, separate fetching from RootState
    // const { mediaItems, status, error } = useSelector((state: RootState) => state.mediaItems);
    // const { token } = useSelector((state:RootState) => state.auth);
    // Consolidated into 1 Request for Fetching from RootState:
    const { mediaItems, token } = useSelector((state: RootState) => ({
        ...state.mediaItems,  // Unwrap the mediaList key/value-pair-objects and put them all into the output
        token: state.auth.token   // Telling where to specifically find the token value inside the RootState object
    }))


    const dispatch = useDispatch<AppDispatch>();

    // Number of Random MediaItems to show on this page
    const amount = 10;

    useEffect( () => {
        try {
            dispatch(fetchRandomMediaItems({token: token!, amount: amount}));
        } catch(err) {
            console.error(err);
        }
    }, [dispatch, token]);

    // The scroll-up too much automatically refreshes the list of MediaItems.
    useEffect( () => {
        let lastScrollY = window.scrollY;
        function handleScroll() {
            const currentScrollY = window.scrollY;
            if (currentScrollY === 0 && lastScrollY > 0){
                try {
                    dispatch(fetchRandomMediaItems({token: token!, amount: amount}));
                } catch(err) {
                    console.error(err);
                }
            }
            lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [dispatch, token]);




    return (
        <div>
            <h1>Explore Media Items</h1>
            <button
                onClick = {() => dispatch(fetchRandomMediaItems({token: token!, amount: amount}))}
            >Refresh</button>
            
            {mediaItems.map(mediaItem => (
                <div key={mediaItem.id}>
                    <Link to = {`/mediaitem/${mediaItem.id}`}>{mediaItem.name}</Link>
                    <MediaTypeLabel mediaTypeId={mediaItem.mediaTypeId} />
                    
                </div>
            ))}
        </div>
    );

}
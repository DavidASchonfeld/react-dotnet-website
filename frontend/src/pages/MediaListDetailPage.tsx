// React Libraries
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// My Code
import type { RootState, AppDispatch } from '../store/store';
import { fetchListDetail, clearSelectedListDetail} from '../store/mediaListsSlice';
import MediaTypeLabel from '../components/MediaTypeLabel';



export default function MediaListDetailPage() {
    

    // useParams() reads the :id from the URL
    // Ex: /medialist/42 -> id ="42". (passed as a string)
    // Explanation for line below:
    // Left-Side:
    //     Equivalent of doing:
    //          const params = useParams();
    //          const id = params.id;
    // Right-Side:
    //      <{id: string}>  This is a TypeScript generic.
    //      It is telling TypeScript that
    //      this object is a TypeScript type shape
    //      (very similar to a JSON object)
    //      with only 1 parameter
    //      called "id" with type "string".
    const { id } = useParams<{ id: string }>();

    // Get Details of selected MediaList from store (aka Redux)(and if store doesn't have it, it will send commands to Service which will send HTTP requests to backend)
    const { selectedMediaListDetail, status, error } = useSelector((state: RootState) => state.mediaLists); 

    const { token } = useSelector((state: RootState) => state.auth);
    
    const dispatch = useDispatch<AppDispatch>();


    // Runs only once (unless any of its dependencies (dispatch, token, id) changes)
    useEffect(()=> {
        // Since this function is here in the useEffect() body,
        // it runs as soon as this component is rendered (aka shown on the screen.)
        dispatch(fetchListDetail({token: token!, mediaListId: parseInt(id!)}));

        // Cleanup: When the user navigates from this page,
        // let's clear the stored detailed list.
        // This prevents seeing the previious lists's data
        // when loading/navigating to a different list.
        
        // () => {} means that this function runs when this component unmounts (aka leaves the screen)
        return () => {
            dispatch(clearSelectedListDetail());
        };
    }, [dispatch, token, id]); 



    if (status === 'loading') return <div>Loading...</div>
    if (error) return <div>{error}</div>
    if (!selectedMediaListDetail) return null

    return (
        <div>
            <Link to="/my-medialists">⬅︎ Back to My Lists</Link>

            <h1>{selectedMediaListDetail.name}</h1>
            <p>{selectedMediaListDetail.description}</p>
            {selectedMediaListDetail.listContent.map(mediaItem => (
                <div key={mediaItem.id}>
                    <p>{mediaItem.name}</p>
                    <MediaTypeLabel mediaTypeId={mediaItem.mediaTypeId} />
                </div>
            ))}
        </div>
    )


}

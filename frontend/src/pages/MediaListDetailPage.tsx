// React Libraries
import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';

// My Code
import { useAuth } from '../hooks/useAuth';
import type { MediaListDetail } from '../types/mediaList';
import { getMediaListDetail } from '../services/mediaListService';

export default function MediaListDetailPage() {
    const { token } = useAuth();

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

    const [mediaList, setMediaList] = useState<MediaListDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // This is a function, specifically cached with useCallback ( useCallBack is for caching functions).
    // What would be our parameters for this before-useCallback
    // are now called "dependencies" and are listed at the end of this code block.
    //
    const fetchDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // id from the URL as a string
            // so we need to convert it to a number
            // token! <- I am telling this code that token will never be null
            //   because this page is in <ProtectedRoute> as seen in App.tsx
            //   I created ProtectedRoute in frontend/src/components/ProtectedRoute.tsx
            // Why "id!"?
            // --- If that URL part is blank, React's Routing will not navigate to this page.
            // --- If a non-Number is passed into that part of the URL,
            //     it will trigger the parseInt() function in the code line below
            //     to return NaN, which causes the getMediaListDetail to throw a 400 Bad Request error
            //     which goes to the "catch(err)" section I wrote a few lines below
            const data = await getMediaListDetail(token!, parseInt(id!));

            // Only occurs if the fetch was successful.
            setMediaList(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load list details');
        } finally {
            setIsLoading(false);
        }
    }, [token, id]);
    // For a callback function, we put the
    // parameters (now called dependencies for useCallback)
    // here instead.
    // Only the function is re-created if the parameter value is changed.
    // Here, that would be the token value or the id value

    useEffect(()=> {
        fetchDetails();
    }, [fetchDetails]); 
    // I created fetchDetails and used useCallBack to cache the function
    // to prevent an infinite loop for rendering for that function to be called indefinitely.
    // This prevents the function fetchDetails() from being re-created
    // every time that this component is re-rendered.
    // If there is a state change in that function that causes the
    // component to re-render, which might cause the function to be
    // created again, that could cause an infinite loop.
    // Making that function a callback function causes that function to
    // be cached and therefore NOT need to be recreated every time that component is rendered.

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>{error}</div>
    if (!mediaList) return null

    return (
        <div>
            <Link to="/my-medialists">⬅︎ Back to My Lists</Link>

            <h1>{mediaList.name}</h1>
            <p>{mediaList.description}</p>
            {mediaList.listContent.map(mediaItem => (
                <div key={mediaItem.id}>
                    <p>{mediaItem.name}</p>
                    <p>{mediaItem.mediaTypeName}</p>
                </div>
            ))}
        </div>
    )


}

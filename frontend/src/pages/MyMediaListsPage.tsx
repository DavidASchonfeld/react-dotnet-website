// React.js Library
import { useState, useEffect } from 'react';


// My Code
import { useAuth } from '../hooks/useAuth';
import type { MediaListSummary } from '../types/mediaList';

import { getMyMediaLists} from '../services/mediaListService';
// import { getMyMediaLists,
//     createMediaList,
//     deleteMediaList } from '../services/mediaListService';




export default function MyMediaListsPage() {

    const { token } = useAuth();

    // Data for list of MediaLists
    // Initialize as an Empty Array
    const [mediaLists, setMediaLists] = useState<MediaListSummary[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [error, setError] = useState<string | null>(null);


    // Method just for this component
    async function fetchMediaLists() {
            setIsLoading(true);
            setError(null);
            try {

                // token! has "!", which tells JavaScript that I am promising that this value is never null.
                //  Why am I doing that? Because this page is in <ProtectedRoute>
                // (as I created in /frontend/src/components/ProtectedRoute.tsx)
                // (meaning it is only accessible to logged-in users)
                // so logged-in users always have a non-null token value.
                const data = await getMyMediaLists(token!);
                setMediaLists(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load lists.");
            } finally {
                setIsLoading(false);
            }
        }

    // Note: I am using 2 useEffect() methods,
    //  one for each piece of conceptual logic


    // For onPageLoading for First Time
    // Runs after Page Loads , for fetchMediaLists() for the first time.
    useEffect(() => {
        fetchMediaLists()
    }, []);  // Runs once the page loads, specifically when the componnent mounts. Not when the component re-renderss

    // For onPageLoading for First Time
    // Runs after Page Loads, adds EventListener for scroll tracking for refreshing/calling fetchMediaLists() if the user scrolls too high
    useEffect(() => {

        // This is TypeScript's "let"
        // "let": a new reassignable variable.
        // Also, I could do (explicitly write the type "number")
        // let lastScrollY: number= window.scrollY;
        // but don't need to.
        // The C# equivalent is "var"

        let lastScrollY = window.scrollY;
        function handleScroll() {
            const currentScrollY = window.scrollY;

        
            // Triggers when user was lower in the page and just scrolled to the top.
        
            // Use === instead of == for strict equality, 
            // In JavaScript, == only checks for equal value (and converts types to compare)
            // So we need to use === to keep the types without converting
            if (currentScrollY === 0 && lastScrollY > 0){
                fetchMediaLists();
            }
            
            // Update lastScroll
            lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll);

        // When this page unmounts, remove tis listener.
        // Otherwise, the listener would keep running
        // even after leaving this specific page.
        return () => window.removeEventListener('scroll', handleScroll)


    }, []);  // Runs once the page loads, specifically when the componnent mounts. Not when the component re-renderss


    

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>{error}</div>

    return (
        <div>
            <h1>My Lists</h1>

            {/* Refresh Button - Calls Refresh on Click: */}
            <button onClick={fetchMediaLists}>Refresh</button>
            {mediaLists.map(mediaList => (
                <div key={mediaList.id}>
                    <h2>{mediaList.name}</h2>
                    <p>{mediaList.description}</p>
                    <p>{mediaList.itemCount}</p>
                </div>
            ))}
        </div>
    );
}
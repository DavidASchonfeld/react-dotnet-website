// React.js Library
import { useState, useEffect } from 'react';


// My Code
import { useAuth } from '../hooks/useAuth';
import type { MediaListSummary } from '../types/mediaList';
import { VisibilityStatus } from '../types/enums';

import { getMyMediaLists,
    createMediaList,
    deleteMediaList } from '../services/mediaListService';




export default function MyMediaListsPage() {

    const { token } = useAuth();

    // Data for list of MediaLists
    // Initialize as an Empty Array
    const [mediaLists, setMediaLists] = useState<MediaListSummary[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [error, setError] = useState<string | null>(null);

    // For Deletion
    const [mediaListToDelete, setMediaListToDelete] = useState<number | null>(null);

    // For Create MediaList
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [newListDescription, setNewListDescription] = useState<string>('');


    // Functions here are only accessible to this component

    async function fetchMediaLists() {
            setIsLoading(true);
            setError(null);
            try {

                // Note on "token!"
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


    async function confirmDelete() {
        if (mediaListToDelete === null) return;
        try {
            await deleteMediaList(token!, mediaListToDelete);

            // Below only occurs if the deleteMediaList() succeeds

            setMediaListToDelete(null);  // <- Close the modal (aka popup)
            await fetchMediaLists();  // Refresh the MediaList now that the MediaList is deleted
            
        } catch (err) {
            console.error(err);
            setError(`Failed to delete list id: ${mediaListToDelete}.`)
        }
    }

    async function handleCreateMediaList() {
        if (!newListName.trim()) return  //Prevents submitting empty name
        try {
            await createMediaList(token!, {
                name: newListName,
                description: newListDescription || undefined,
                visibilityStatus: VisibilityStatus.Private  // Default
            });

            // Below only occurs if createMediaList succeeds.
            setShowCreateModal(false);  // Hide the modal
            setNewListName('');  // sets the variables back to blank
            setNewListDescription('');  // sets the variables back to blank

            await fetchMediaLists(); // Refresh the list now that the new MediaList was created

        } catch (err) {
            console.error(err);
            setError("Failed to create List");
        }
    }


    // Note: I am using 2 useEffect() methods,
    //  one for each piece of conceptual logic


    // For onPageLoading for First Time
    // Runs after Page Loads , for fetchMediaLists() for the first time.
    useEffect(() => {
        fetchMediaLists()
    }, []);  // Runs once the page loads, specifically when the componnent mounts. Not when the component re-renderss


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
            
            {/* Create MediaList Button */}
            <button onClick={
                () => setShowCreateModal(true)
            }>+ Create List</button>
            

            {/* Refresh Button - Calls Refresh on Click: */}
            <button onClick={fetchMediaLists}>Refresh</button>
            {mediaLists.map(mediaList => (
                <div key={mediaList.id}>
                    <h2>{mediaList.name}</h2>
                    <p>{mediaList.description}</p>
                    <p>{mediaList.itemCount}</p>
                    <button onClick={
                        () => setMediaListToDelete(mediaList.id)
                    }>Delete</button>
                </div>
            ))}

            {showCreateModal && (
                <>

                {/* This div is over the top of everything else
                    to partially black out the background
                    to better show that the modal is currently open. */}
                {/* Tailwind-Specific Explanations (as applied here in "className")
                    inset-0: full screen
                    bg-black/50: Means it is black at 50% transparency
                    z-50: At z-index:50, which means its on top of everything else
                    
                */}
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">  

                    {/* The Modal aka Popup
                    Tailwind-Specific Explanations:
                    min-w-72: Minumum width is 72
                    rounded-lg: Rounded corners
                    p-8: 8-sized padding
                    flex-col: Make all items into 1 column (if we want the buttons side-by-side, we'll put them in 1 div)
                    flex: You need flex here to use "flex-col" and "gap-4"
                    gap-4: Make gap == 4 between each object in this column
                    */}
                    <div className = "bg-white p-8 rounded-lg min-w-72 flex flex-col gap-4">
                        <h2>Create New List</h2>
                        <input
                            placeholder="Name (Required)"
                            value = {newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                        />
                        <input
                            placeholder="Description (Optional)"
                            value = {newListDescription}
                            onChange={(e) => setNewListDescription(e.target.value)}
                        />
                        {/*
                            We don't need to add flex-row because here, it by default fits things side-by-side
                            until it runs out of room, to add to the next line
                        */}
                        <div className="flex gap-2">
                            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button onClick={handleCreateMediaList}>Create</button>
                        </div>
                    </div>
                </div>
                </>
             )}

            {mediaListToDelete !== null && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">  
                    <div className = "bg-white p-8 rounded-lg min-w-72 flex flex-col gap-4">
                        <h2>Delete the List "{mediaLists.find(l => l.id === mediaListToDelete)?.name}"?</h2>
                        <p>Are you sure you want to delete this list?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setMediaListToDelete(null)}>Cancel</button>
                            <button onClick={confirmDelete}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
             )}

             
        </div>
    );
}
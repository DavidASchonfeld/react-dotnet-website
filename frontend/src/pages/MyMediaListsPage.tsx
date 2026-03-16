// React.js Library
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';


// My Code
import { VisibilityStatus } from '../types/enums';
import type { RootState, AppDispatch } from '../store/store';
import { fetchMyLists, createList, deleteList } from '../store/mediaListsSlice';




export default function MyMediaListsPage() {


    
    //// From Redux Store
    // replaces storing mediaLists directly here in the component
    // and ther isLoading and userState errors also from being stored here in the component
    const { mediaLists, status, error } = useSelector((state: RootState) => state.mediaLists);
    const { token } = useSelector((state:RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();

    //// Local State for this component
    // They are about UI state, so they do not need to be shared globally nor need to survive a page refresh.

    // For Deletion
    const [mediaListToDelete, setMediaListToDelete] = useState<number | null>(null);

    // For Create MediaList
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [newListDescription, setNewListDescription] = useState<string>('');







    // Functions here are only accessible to this component




    async function confirmDelete() {
        if (mediaListToDelete === null) return;
        try {
            // Old function having this .tsx file calling the API function directly,
            // before I implemented using Redux. Now, instead, this component
            // dispatches (Aka calls a synchronous function to call those API calls),
            // with all of that logic in the deleteList AsyncThunk 
            // in frontend/src/store/mediaListsSlice.ts
            //    await deleteMediaList(token!, mediaListToDelete);


            // .unwrap() so this try/catch block can catch errors.
            await dispatch(deleteList({ token: token!, mediaListId: mediaListToDelete})).unwrap();


            // Below only occurs if the deleteMediaList() succeeds

            setMediaListToDelete(null);


            // Since the deleteList's asyncThunk's fulfilled logic 
            // (in frontend/src/store/mediaListsSlice.ts)
            // already removes the deleted list in our frontend storage,
            // then this function does not need to call fetchMyLists again to get the updated list 
            // now that the MediaList objected was deleted

            
        } catch (err) {
            console.error(err);
        }
    }

    async function handleCreateMediaList() {
        if (!newListName.trim()) return  //Prevents submitting empty name
        try {


            // Before I implemented Redux (and therefore the AsyncThunks),
            //   I called the API method directly here.
            // await createMediaList(token!, {
            //     name: newListName,
            //     description: newListDescription || undefined,
            //     visibilityStatus: VisibilityStatus.Private  // Default
            // });


            // Use unwrap() so this try/catch block can catch errors
            // createList is an asyncThunk I created
            // in frontend/src/store/mediaListsSlice.ts
            await dispatch(createList({


                // Since this page is only accessible if a user is logged in, I know that token will never be null
                // so I add ! to token to tell TypeScript that this variable will never be null.
                token: token!,  

                data: {
                    name: newListName,
                    description: newListDescription || undefined,
                    visibilityStatus: VisibilityStatus.Private
                }
            })).unwrap();

            // Below only occurs if createMediaList succeeds.


            // The createList.fulfilled handler
            // (in frontend/src/store/mediaListsSlice.ts)
            // already pushed this new list into the state.lists
            // so no new to call fetchMediaLists() again.

            // Manually reset the UI compoents
            setShowCreateModal(false);  // Hide the modal
            setNewListName('');  // sets the variables back to blank
            setNewListDescription('');  // sets the variables back to blank

            
        } catch (err) {
            console.error(err);
        }
    }


    // Note: I am using 2 useEffect() methods,
    //  one for each piece of conceptual logic


    // For onPageLoading for First Time
    // Runs after Page Loads , to load the mediaLists into this page for the first time.
    useEffect(() => {
        dispatch(fetchMyLists(token!));
    }, [dispatch, token]);
    // dispatch and token are dependencies (aka similar in concept to how parameters are passed into functions)
    // They are passed in here as dependencies to prevent any accidental inifite loops
    // They are saved so they do not need to be reloaded every time this component re-renders.
    // Here, this useEffect() would only be reloaded if either of those dependences (dispatch or token)
    // changes it values.
    // Why save these over refreshes?
    // To prevent an accidental infinite loop: 
    // If either of them (For example: dispatch) has logic that would trigger the component to re-load,
    // Then when the component reloads and the dispatch gets re-created, that dispatch being created might trigger
    // the component to reload which would cause an inifinite loop between the component being forced to reload
    // and one of its items in the component's creation process (Example: Dispatch) to cause the component to reload
    // causing the componennet to infinitely reload over and over again.


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
                dispatch(fetchMyLists(token!));
            }
            
            // Update lastScroll
            lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll);

        // When this page unmounts, remove tis listener.
        // Otherwise, the listener would keep running
        // even after leaving this specific page.
        return () => window.removeEventListener('scroll', handleScroll)


    }, [dispatch, token]);
    // See above for explanation about dependencies


    

    if (status === 'loading') return <div>Loading...</div>
    if (error) return <div>{error}</div>

    return (
        <div>
            <h1>My Lists</h1>
            
            {/* Create MediaList Button */}
            <button onClick={
                () => setShowCreateModal(true)
            }>+ Create List</button>
            

            {/* Refresh Button - Calls Refresh on Click: */}
            {/* Remember, you need "() =>"" so the function
            only runs when the button is clicked, instead
            of when the button is rendered. */}
            <button onClick={() => dispatch(fetchMyLists(token!))}>Refresh</button>
            {mediaLists.map(mediaList => (
                <div key={mediaList.id}>
                    <Link to={`/medialist/${mediaList.id}`}>
                        <h2>{mediaList.name}</h2>
                    </Link>
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
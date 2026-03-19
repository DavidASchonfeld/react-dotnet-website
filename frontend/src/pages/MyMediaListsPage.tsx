// React.js Library
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';


// My Code
import { VisibilityStatus } from '../types/enums';
import type { RootState, AppDispatch } from '../store/store';
import { fetchMyLists, createList, deleteList } from '../store/mediaListsSlice';
import MediaListFormModal from '../components/modals/MediaListFormModal';
import ConfirmModal from '../components/modals/ConfirmModal';



export default function MyMediaListsPage() {


    
    //// From Redux Store
    // replaces storing mediaLists directly here in the component
    // and their isLoading and userState errors also from being stored here in the component
    
    // Original, separate fetching from RootState
    // const { mediaLists, status, error } = useSelector((state: RootState) => state.mediaLists);
    // const { token } = useSelector((state:RootState) => state.auth);
    // Consolidated into 1 Request for Fetching from RootState:
    const { mediaLists, status, error, token } = useSelector((state: RootState) => ({
        ...state.mediaLists,  // Unwrap the mediaList key/value-pair-objects and put them all into the output
        token: state.auth.token   // Telling where to specifically find the token value inside the RootState object
    }))

    
    const dispatch = useDispatch<AppDispatch>();

    

    //// Local State for this component
    // They are about UI state, so they do not need to be shared globally nor need to survive a page refresh.

    // For Deletion
    const [mediaListToDelete, setMediaListToDelete] = useState<number | null>(null);

    // For Create MediaList
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);



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

            
            // Close the Modal Window:
            setMediaListToDelete(null);

            // In the return section for HTML/JavaScript below, 
            // this webpage displays the error in this section
            // (This section only appears if error is not null.)
            // {error && <h2>{error}</h2>}

        }
    }

    async function handleCreateMediaList(newListName: string, newListDescription: string) {
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

            // Manually reset the UI Modal
            //   The other UI-related parts for that modal are now in the frontend/src/components/modals/CreateListModal.tsx file
            setShowCreateModal(false);  // Hide the modal
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
    // They are passed in here as dependencies to prevent any accidental infinite loops
    // They are saved so they do not need to be reloaded every time this component re-renders.
    // Here, this useEffect() would only be reloaded if either of those dependencies (dispatch or token)
    // changes it values.
    // Why save these over refreshes?
    // To prevent an accidental infinite loop: 
    // If either of them (For example: dispatch) has logic that would trigger the component to re-load,
    // Then when the component reloads and the dispatch gets re-created, that dispatch being created might trigger
    // the component to reload which would cause an infinite loop between the component being forced to reload
    // and one of its items in the component's creation process (Example: Dispatch) to cause the component to reload
    // causing the component to infinitely reload over and over again.


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

        // When this page unmounts, remove this listener.
        // Otherwise, the listener would keep running
        // even after leaving this specific page.
        return () => window.removeEventListener('scroll', handleScroll)


    }, [dispatch, token]);
    // See above for explanation about dependencies


    

    if (status === 'loading') return <div>Loading...</div>
    if (error) return <div>{error}</div>
    if (!token) return null;  // Putting this here is important
    // to tell people who read this code that this component
    // should not run if the token is null since this page
    // needs a token value to request API calls for MediaList Objects


    return (
        <div>
            {error && <h2>{error}</h2>}

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


            {/*
                in showCreateModal,
                    for onConfirm: pass in the already-created function handleCreateMediaList in directly
                    for onCancel: here, passing in a non-named function (by calling "() => "), and inside that non-named function, run a specific command "setShowCreateModal(false)"
            */}
            {showCreateModal && (
                
                <MediaListFormModal
                    mode = "create"
                    onConfirm={handleCreateMediaList}
                    onCancel={() => setShowCreateModal(false)}    
                />
            )}


            {/* Remember "?" means the object could be null
            ?? means if that value is null, use the string after the "??" */}
            {mediaListToDelete !== null && (

               <ConfirmModal
                    title = {`Remove "${mediaLists.find(l=>l.id==mediaListToDelete)?.name ?? ''}"`}
                    message = "This item will be removed from the list."
                    confirmLabel = "Delete"
                    onConfirm = {confirmDelete}
                    onCancel = { () => setMediaListToDelete(null)}
                />
             )}

             
        </div>
    );
}
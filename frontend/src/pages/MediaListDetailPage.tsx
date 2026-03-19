// React Libraries
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// My Code
import type { RootState, AppDispatch } from '../store/store';
import { fetchListDetail, clearSelectedListDetail, addItemToList, patchBasicInfoList, removeItemFromList} from '../store/mediaListsSlice';
import MediaTypeLabel from '../components/MediaTypeLabel';

import { fetchRandomMediaItems } from '../store/mediaItemsSlice';
import MediaListFormModal from '../components/modals/MediaListFormModal';



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
    const mediaItems = useSelector((state: RootState) => state.mediaItems.mediaItems); 

    const { token } = useSelector((state: RootState) => state.auth);
    
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();



    // Local Variables:
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddBrowsePanel, setShowAddBrowsePanel] = useState(false);
    const [searchBarContent, setSearchBarContent] = useState('');


    // Runs only once (unless any of its dependencies (dispatch, token, id) changes)
    useEffect(()=> {
        // Since this function is here in the useEffect() body,
        // it runs as soon as this component is rendered (aka shown on the screen.)
        dispatch(fetchListDetail({token: token!, mediaListId: parseInt(id!)}));

        // Cleanup: When the user navigates from this page,
        // let's clear the stored detailed list.
        // This prevents seeing the previous list's data
        // when loading/navigating to a different list.
        
        // () => {} means that this function runs when this component unmounts (aka leaves the screen)
        return () => {
            dispatch(clearSelectedListDetail());
        };
    }, [dispatch, token, id]); 

    
    if (status === 'loading') return <div>Loading...</div>
    if (error) return <div>{error}</div>
    if (!selectedMediaListDetail) return null



    

    const mediaListId = selectedMediaListDetail.id;
    const existingIds = new Set(selectedMediaListDetail?.listContent.map(i => i.id));
    const filteredCandidates = mediaItems.filter(
        item => !existingIds.has(item.id) &&
        item.name.toLowerCase().includes(searchBarContent.toLowerCase())
    );


    function handleToggleEditMode() {
        if(isEditMode) setShowAddBrowsePanel(false);
        setIsEditMode(prev => !prev);  // switch the mode to whatever its opposite is.
    }
    





    return (
        <div>
            {/* -- Header -- */}
            <Link to="/my-medialists">⬅︎ Back to My Lists</Link>
            {selectedMediaListDetail.canEdit && (
                <button onClick = {handleToggleEditMode}>
                    {isEditMode ? 'Exit "Edit Mode"' : 'Edit'}
                </button>
            )}
            

            {/* -- List Info -- */}
            <h1>{selectedMediaListDetail.name}</h1>
            <p>{selectedMediaListDetail.description}</p>
            {isEditMode && <button onClick={() => setIsEditModalOpen(true)}>Edit List's Basic Info</button>}

            {/* -- List Content -- */}
            {selectedMediaListDetail.listContent.map(mediaItem => (
                <div key={mediaItem.id}>
                    {isEditMode && <p>{mediaItem.name}</p>}
                    {!isEditMode && <Link to = {`/mediaitem/${mediaItem.id}`}>{mediaItem.name}</Link>}
                    <MediaTypeLabel mediaTypeId={mediaItem.mediaTypeId} />

                    {isEditMode && 
                    <>
                        <button
                        >Edit Position (TODO: Implement)</button>
                        <button onClick={
                            () => dispatch(removeItemFromList({token: token!, mediaListId: mediaListId, mediaItemId: mediaItem.id}))
                        }>Delete</button>
                    </>
                    }
                    
                </div>
            ))}

            {/* -- Add Item to List (Edit Mode only) */}
            {isEditMode && !showAddBrowsePanel && (
                <button onClick = {() => {
                    setShowAddBrowsePanel(true);
                    if(mediaItems.length == 0) dispatch(fetchRandomMediaItems({token: token!, amount: 5}));
                }}>+ Add Item (Browse Panel)</button>
            )}

            
            {/* -- "Add Items" Browser Panel -- */}
            {isEditMode && showAddBrowsePanel && (
                <div>
                    <h3>Add an Item</h3>
                    <input
                        placeholder = "Search by name..."
                        value = {searchBarContent}
                        onChange = {(e) => setSearchBarContent(e.target.value)}
                    />

                    <button onClick = { () => dispatch(fetchRandomMediaItems({token: token!, amount: 5}))}
                    >Browse More Random MediaItems</button>

                    <button onClick = { () => setShowAddBrowsePanel(false)}
                    >Cancel</button>

                    {filteredCandidates.map(item => (
                        <div key={item.id}>
                            <span>{item.name}</span>
                            <MediaTypeLabel mediaTypeId={item.mediaTypeId} />
                            <button onClick = { () => dispatch(addItemToList({token: token!, mediaListId: mediaListId, mediaItemId: item.id, mediaItem: item}))}
                            >Add</button>
                        </div>
                    ))}

                </div>
            )}

            {/* Edit List Info Modal (for Editing Non-Linked Info like Name) (separate from isEditMode) */}
            {isEditModalOpen && (
                <MediaListFormModal
                    mode = "edit"
                    initialName = {selectedMediaListDetail.name}
                    initialDescription = {selectedMediaListDetail.description}
                    initialVisibility = {selectedMediaListDetail.visibilityStatus}
                    onConfirm = { (name, description, visibility) => {
                        dispatch(patchBasicInfoList({token: token!, mediaListId: mediaListId, data: {
                            name, description, visibilityStatus: visibility
                        }}));
                        setIsEditModalOpen(false);
                    }}
                    onCancel={ () => setIsEditModalOpen(false)}
                />
            )}
        </div>
    )


}

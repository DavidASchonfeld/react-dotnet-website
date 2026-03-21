// React Libraries
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// My Code
import type { RootState, AppDispatch } from '../store/store';
import { clearSelectedMediaItemDetail} from '../store/mediaItemsSlice';
import MediaTypeLabel from '../components/MediaTypeLabel';
import { fetchMediaItemDetail, patchMediaItemBasicInfoTHUNK } from '../store/mediaItemsSlice';
import MediaItemFormModal from '../components/modals/MediaItemFormModal';
import RowItemContent from '../components/RowItemContent';
import RowItemStyling from '../components/RowItemStyling';
import AnimatedPage from '../components/AnimatedPage';



export default function MediaItemDetailPage() {
    

    // useParams() reads the :id from the URL
    // Ex: /mediaitem/42 -> id ="42". (passed as a string)
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

    // Get Details of selected MediaItem from store (aka Redux)(and if store doesn't have it, it will send commands to Service which will send HTTP requests to backend)
    const { selectedMediaItemDetail, status, error } = useSelector((state: RootState) => state.mediaItems); 

    const { token } = useSelector((state: RootState) => state.auth);
    
    const dispatch = useDispatch<AppDispatch>();

    const [isEditMode, setIsEditMode] = useState(false);


    // Runs only once (unless any of its dependencies (dispatch, token, id) changes)
    useEffect(()=> {
        // Since this function is here in the useEffect() body,
        // it runs as soon as this component is rendered (aka shown on the screen.)
        dispatch(fetchMediaItemDetail({token: token!, mediaItemId: parseInt(id!)}));

        // Cleanup: When the user navigates from this page,
        // let's clear the stored detailed list.
        // This prevents seeing the previous list's data
        // when loading/navigating to a different list.
        
        // () => {} means that this function runs when this component unmounts (aka leaves the screen)
        return () => {
            dispatch(clearSelectedMediaItemDetail());
        };
    }, [dispatch, token, id]); 




    if (status === 'loading') return <div>Loading...</div>
    if (error) return <div>{error}</div>
    if (!selectedMediaItemDetail) return null

    return (
        <AnimatedPage>
        <div>

            <RowItemStyling>
                <RowItemContent
                    firstString={selectedMediaItemDetail.name}
                    secondString={'TODO: ADD CREATORS'}
                    emojiIcon={<MediaTypeLabel mediaTypeId={selectedMediaItemDetail.mediaTypeId} faded={true} />}
                />
            </RowItemStyling>

            {selectedMediaItemDetail.canEdit && (
                <button onClick = {() => setIsEditMode(prev => !prev)}>
                    {isEditMode ? 'Exit "Edit Mode"' : 'Edit'}
                </button>
            )}
            
            {isEditMode ? (
                <>
                    {/* Edit Mode */}
                    <MediaItemFormModal
                        existingItem={selectedMediaItemDetail}
                        onConfirm = {(name, description, mediaTypeId, publishedDateTime) => {
                            dispatch(patchMediaItemBasicInfoTHUNK({
                                token: token!,
                                mediaItemId: selectedMediaItemDetail.id,
                                data: {name, description, mediaTypeId, publishedDateTime}
                            }));
                            setIsEditMode(false);
                        }}
                        onCancel = { () => setIsEditMode(false)}
                    />
                </>
            ) : (
                <>
                    {/* View Mode */}
                    <h1>{selectedMediaItemDetail.name}</h1>
                    <MediaTypeLabel mediaTypeId={selectedMediaItemDetail.mediaTypeId} />
                    <p>{selectedMediaItemDetail.description}</p>

                    {/*If .publishedDateTime is null,
                    then the new Date() constructor will output the default date (like January 1970 or something)
                    which would be wrong. So, this will only show the publishedDate
                    if it is stored */}
                    {selectedMediaItemDetail.publishedDateTime && ( 
                        <p>{new Date(selectedMediaItemDetail.publishedDateTime).toLocaleDateString()}</p>
                    )}
                </>
            )}


            
        </div>
        </AnimatedPage>
    )


}

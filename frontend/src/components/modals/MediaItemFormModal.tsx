import { useState } from "react";
import { useSelector } from "react-redux";
import type { MediaItemDetail } from "../../types/mediaItem";
import type { RootState } from "../../store/store";

interface Props {
    existingItem?: MediaItemDetail;  // optional. If not here, the mode is to create a MediaItem
    onConfirm: (name: string, description: string, mediaTypeId: number, publishedDateTime: string) => void;
    onCancel: () => void;
}

// In this function's parameter, it destructures the Props object into individual named variables
export default function MediaItemFormModal({ existingItem, onConfirm, onCancel}: Props){
    const [name, setName] = useState(existingItem?.name ?? '');
    const [description, setDescription] = useState(existingItem?.description ?? '');
    const [mediaTypeId, setMediaTypeId] = useState(existingItem?.mediaTypeId ?? 0);
    const [publishedDateTime, setPublishedDateTime] = useState(

        // The .split('T')[0] strips away the time, so we only get the Date half of the datetime object.
        existingItem?.publishedDateTime ? existingItem.publishedDateTime.split('T')[0]: ''
    );
    const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
    const isEditMode = (existingItem !== undefined);

        function handleSubmit() {
            if (!name.trim()) return;  // Do not create with an empty name.
            if (mediaTypeId <= 0) return;  // Do not create without a selected MediaType
            onConfirm(name, description, mediaTypeId, publishedDateTime);
        }

    return (
        <div>


            <h2>{isEditMode ? 'Edit Media Item' : 'Create New Media Item'}</h2>

            <input
                placeholder="Name (Required)"
                value = {name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                placeholder="Description (Optional)"
                value = {description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <select
                value={mediaTypeId}
                onChange={(e) => setMediaTypeId(parseInt(e.target.value))}
            >
                <option value={0}>-- Media Type (Required) --</option>
                {mediaTypes.map(mediaTypeOption => (
                    <option key = {mediaTypeOption.id} value = {mediaTypeOption.id}>
                        {mediaTypeOption.icon} {mediaTypeOption.name}
                    </option>
                ))}
            </select>

            <div>
                <label>Published Date (Optional)</label>
                <input
                    type = "date"
                    value = {publishedDateTime}
                    onChange = {(e) => setPublishedDateTime(e.target.value)}
                />
            </div>

            <button onClick={onCancel}>Cancel</button>

            <button onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Create'}</button>

        </div>
    );
}
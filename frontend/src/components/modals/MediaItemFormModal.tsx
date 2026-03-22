import { useState } from "react";
import { useSelector } from "react-redux";
import type { MediaItemDetail } from "../../types/mediaItem";
import type { RootState } from "../../store/store";

import Select, { type SingleValue } from 'react-select';
import MediaTypeLabel from "../MediaTypeLabel";
import AnimatedPage from "../AnimatedPage";

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


    type MediaTypeOption = {value: number; label: string};
    const selectOptions: MediaTypeOption[] = mediaTypes.map(mediaTypeObject => ({
        value: mediaTypeObject.id,
        label: mediaTypeObject.name
    }));


    function handleSubmit() {
        if (!name.trim()) return;  // Do not create with an empty name.
        if (mediaTypeId <= 0) return;  // Do not create without a selected MediaType
        onConfirm(name, description, mediaTypeId, publishedDateTime);
    }

    return (
        <div className="modal-overlay">
            {/* Dark backdrop — see .modal-overlay in index.css for Tailwind breakdown */}
            <AnimatedPage>
            {/* Modal panel — see .modal-panel in index.css for Tailwind breakdown */}
            <div className="modal-panel">

            <h2>{isEditMode ? 'Edit Media Item' : 'Create New Media Item'}</h2>

            {/* See .form-input in index.css for Tailwind breakdown */}
            <input
                placeholder="Name (Required)"
                value = {name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
            />
            <input
                placeholder="Description (Optional)"
                value = {description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
            />


            {/* TODO: DELETE the following:
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
            </select> */}
        <Select<MediaTypeOption>
            options = {selectOptions}
            value = {mediaTypeId === 0 ? null : selectOptions.find(o => o.value === mediaTypeId) ?? null}
            onChange = {(option: SingleValue<MediaTypeOption>) =>
                setMediaTypeId(option ? option.value : 0)
            }
            placeholder = "-- Media Type (Required) --"
            formatOptionLabel = {(option) => <MediaTypeLabel mediaTypeId = {option.value} />}
            isClearable = {true}
        />




            <div>
                <label>Published Date (Optional)</label>
                <input
                    type = "date"
                    value = {publishedDateTime}
                    onChange = {(e) => setPublishedDateTime(e.target.value)}
                />
            </div>

            <button className = "btn btn-secondary w-fit"
                onClick={onCancel}
            >Cancel</button>

            <button className = "btn btn-secondary w-fit"
                onClick={handleSubmit} 
            >{isEditMode ? 'Save Changes' : 'Create'}</button>
            </div>
            </AnimatedPage>
        </div>
    );
}
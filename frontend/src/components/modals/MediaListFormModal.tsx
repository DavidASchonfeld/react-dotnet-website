import { useState } from 'react';
import { VisibilityStatus } from '../../types/enums';
import AnimatedPage from '../AnimatedPage';

// This defines what the caller must pass in
interface Props {
    mode: 'create' | 'edit';
    initialName?: string;
    initialDescription?: string | null;
    initialVisibility?: VisibilityStatus;




    onConfirm: (newListName: string, newListDescription: string, visibility: VisibilityStatus) => void;  // For this parameter, pass in a function with the input parameters matching this line, and a void output (meaning no output) 
    onCancel: () => void;  // For this parameter, pass in a function
}

// In this function's parameter, it destructures the Props object into individual named variables
export default function MediaListFormModal({
    mode,
    initialName,
    initialDescription,
    initialVisibility,


    onConfirm,
    onCancel
}: Props){
    const [name, setName] = useState(initialName ?? '');
    const [description, setDescription] = useState(initialDescription ?? '');
    const [visibility, setVisibility] = useState<VisibilityStatus>(initialVisibility ?? VisibilityStatus.Private);

    function handleSubmit() {
        if (!name.trim()) return  //Prevents submitting empty name
        onConfirm(name, description, visibility);
    }

    return (
        <div className="modal-overlay">
            {/* Dark backdrop — see .modal-overlay in index.css for Tailwind breakdown */}
            <AnimatedPage>
                {/* The Modal aka Popup — see .modal-panel in index.css for Tailwind breakdown */}
                <div className="modal-panel">
                    <h2 className="h1-styling">Name &amp; Description</h2>
                    {/* See .form-input in index.css for Tailwind breakdown */}
                    <input
                        placeholder="Name (Required)"
                        value = {name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input"
                    />
                    <textarea
                        placeholder="Add description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="form-input resize-none"
                    />
                    {/*
                        I do not need to add flex-row because here, it by default fits things side-by-side
                        until it runs out of room.
                    */}
                    {mode === 'edit' && (
                        <select
                            value={visibility}
                            onChange = {(e) => setVisibility(Number(e.target.value) as VisibilityStatus)}
                            className="form-input"
                        >
                            <option value = {VisibilityStatus.Private}>Private</option>
                            {/* <option value = {VisibilityStatus.Shared}>Shared</option> TODO: Implement Sharing.*/}
                            {/* <option value = {VisibilityStatus.Public}>Public</option> TODO: Implement Submission/Approval System*/}
                        </select>
                    )}
                    <div className="flex gap-2 justify-center">
                        <button onClick={onCancel} className = "btn btn-secondary w-fit">Cancel</button>
                        <button onClick={handleSubmit} className = "btn btn-secondary w-fit">
                            {mode === 'create' ? 'Create' : 'Save'}
                        </button>
                    </div>
                </div>
            </AnimatedPage>
        </div>
    );
}
import { useState } from 'react';
import { VisibilityStatus } from '../../types/enums';

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
                dark: that thing is active in "dark mode" (which Tailwind automatically activates at night.)
                */}
                <div className = "bg-white dark:bg-gray-800 p-8 rounded-lg min-w-72 flex flex-col gap-4">
                    <h2
                        className = "text-gray-900 dark:text-gray-100"
                    >{mode === 'create' ? 'Create New List' : 'Edit List'}</h2>
                    <input
                        placeholder="Name (Required)"
                        value = {name}
                        onChange={(e) => setName(e.target.value)}
                        className = "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    />
                    <input
                        placeholder="Description (Optional)"
                        value = {description}
                        onChange={(e) => setDescription(e.target.value)}
                        className = "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    />
                    {/*
                        We don't need to add flex-row because here, it by default fits things side-by-side
                        until it runs out of room, to add to the next line
                    */}
                    {mode === 'edit' && (
                        <select
                            value={visibility}
                            onChange = {(e) => setVisibility(Number(e.target.value) as VisibilityStatus)}
                            className = "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                        >
                            <option value = {VisibilityStatus.Private}>Private</option>
                            <option value = {VisibilityStatus.Shared}>Shared</option>
                            <option value = {VisibilityStatus.Public}>Public</option>
                        </select>
                    )}
                    <div className="flex gap-2">
                        <button onClick={onCancel}>Cancel</button>
                        <button onClick={handleSubmit}>
                            {mode === 'create' ? 'Create' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
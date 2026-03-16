import { useState } from 'react';

// This defines what the caller must pass in
interface Props {
    onConfirm: (newListName: string, newListDescription: string) => void;  // For this parameter, pass in a function with the input parameters matching this line, and a void output (meaning no output) 
    onCancel: () => void;  // For this parameter, pass in a function
}

// In this function's parameter, it destructures the Props object into individual named variables
export default function CreateListModal({ onConfirm, onCancel}: Props){
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');

    function handleSubmit() {
        if (!newListName.trim()) return  //Prevents submitting empty name
        onConfirm(newListName, newListDescription);
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
                        <button onClick={onCancel}>Cancel</button>
                        <button onClick={handleSubmit}>Create</button>
                    </div>
                </div>
            </div>
        </>
    );
}
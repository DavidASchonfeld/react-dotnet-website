import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { VisibilityStatus } from '../../types/enums';
import ResponsiveModalFrame from './modal_frame/ResponsiveModalFrame';

// This defines what the caller must pass in
interface Props {
    mode: 'create' | 'edit';
    initialName?: string;
    initialDescription?: string | null;
    initialVisibility?: VisibilityStatus;
    showDescription?: boolean;  // defaults to true

    onConfirm: (newListName: string, newListDescription: string, visibility: VisibilityStatus) => void;  // For this parameter, pass in a function with the input parameters matching this line, and a void output (meaning no output)
    onCancel: () => void;  // For this parameter, pass in a function
}

// In this function's parameter, it destructures the Props object into individual named variables
export default function NameAndDescriptionModal({
    mode,
    initialName,
    initialDescription,
    initialVisibility,
    showDescription = true,
    onConfirm,
    onCancel
}: Props){
    const [name, setName] = useState(initialName ?? '');
    const [description, setDescription] = useState(initialDescription ?? '');
    // Visibility is not user-editable here; managed via the dedicated toggle on the list detail page.
    // On create it defaults to Private; on edit it preserves the existing value passed via initialVisibility.
    const [visibility] = useState<VisibilityStatus>(initialVisibility ?? VisibilityStatus.Private);

    // Selects the right panel class: drawer-panel (mobile bottom-sheet) vs modal-panel (desktop dialog)
    const isMobile = useIsMobile();

    function handleSubmit() {
        if (!name.trim()) return  //Prevents submitting empty name
        onConfirm(name, description, visibility);
    }

    return (
        // open={true} because NameAndDescriptionModal is always conditionally mounted by its parent
        // ResponsiveModalFrame picks DrawerModal on mobile, DialogOverlay on desktop
        // a11y: titleId links the dialog's aria-labelledby to the visible heading inside
        <ResponsiveModalFrame open={true} onClose={onCancel} titleId="name-desc-modal-title">
            {(_close) => (
                // The Modal aka Popup — see .modal-panel / .drawer-panel in index.css for Tailwind breakdown
                <div className={isMobile ? 'drawer-panel' : 'modal-panel'}>
                    {/* a11y: id matches titleId so aria-labelledby on the dialog points here */}
                    <h2 id="name-desc-modal-title" className="h1-styling">Name &amp; Description</h2>
                    {/* See .form-input in index.css for Tailwind breakdown */}
                    {/* a11y: sr-only label so screen readers announce "Name, required" for this field */}
                    <label htmlFor="ndm-name" className="sr-only">Name (required)</label>
                    <input
                        id="ndm-name"
                        placeholder="Name (Required)"
                        value = {name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input"
                        // a11y: aria-required tells screen readers this field must be filled before submitting
                        aria-required="true"
                    />
                    {showDescription && (
                        <>
                            {/* a11y: sr-only label so screen readers announce "Description" for this textarea */}
                            <label htmlFor="ndm-description" className="sr-only">Description</label>
                            <textarea
                                id="ndm-description"
                                placeholder="Add description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="form-input resize-none"
                            />
                        </>
                    )}
                    <div className="flex justify-between">
                        <button onClick={onCancel} className = "btn btn-secondary w-fit">Cancel</button>
                        <button onClick={handleSubmit} className = "btn btn-secondary w-fit">
                            {mode === 'create' ? 'Create' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </ResponsiveModalFrame>
    );
}

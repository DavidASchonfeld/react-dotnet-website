import { useEffect, useState, type ReactNode } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    preview?: ReactNode;
    children: (close: () => void) => ReactNode;
    

    //TODO Delete these comments from old code
    // currentMediaItem: MediaItemSummary | null;  // null = closed
    
}

export default function ItemSettingsDrawerModal({open, onClose, preview, children}: Props){

        // 'visible' drives the CSS slide-up/slide-down animation
        //  visible is separate from the item variable because
        //  visible is related to the animation showing/hiding the modal.

        const [visible, setVisible] = useState(false);
        

        // When a new MediaItemItem is passed in, show this modal
        // by animating the modal coming up
        // This useEffect only runs when this modal first loads
        // and when its dependency's (listed at end of this useEffect)
        // value changes
        useEffect(() => {
            if (open) {

                // the Animation (outside of React.JS) is told to start rendering
                // Yes, outside of React.JS so this doesn't accidentally
                // start an infinite loop so React.JS renders -> state changers -> React.JS renders etc.
                // React.js finishes the render, then listens to that AnimationFrame
                // to mount this modal. While this transition is happening,
                // this continues to run, so the animation happens so the
                // modal floats up from the bottom to the location "translate-y-0"
                const id = requestAnimationFrame(() => setVisible(true));

                // Below is the cleanup for this (disposing this when this component closes)
                return () => cancelAnimationFrame(id);
            }
        }, [open]);

        function close() {
            setVisible(false);

            // Wait 300ms for the slidedown animation to finish
            // before telling this object's parent
            setTimeout(onClose, 300);
        }

        // If there is no currentMediaItem,
        // this modal will not render
        if (!open) return null;

        return (
            <div

            // Backdrop - dims everything behind the sheet
            className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ${visible ? 'bg-black/50' : 'bg-black/0'}`}
            
            // This div will catch all clicks,
            // except for within the menu object inside 
            // because that menu object calls
            // onClick = {e => e.stopPropagation()}
            onClick={close} 
            >
                {/*  The Pop-up Menu  */}
                <div
                    // Tailwind:
                    //  -- w-full: Make this as wide as the screen
                    //  -- max-w-lg: max width will be "large" size in Tailwind (512 pixels)
                    //  -- rounded-t-2xl: Only rounds the top left/right corners (bottom corners are square)
                    //  -- pb-8: Add 32px on the bottom. Its good breath room, but also important iPhones cut into part of the screen.
                    //  -- bg-surface-raised: Uses the semantic "floating element" color from the active theme (see index.css @theme)
                    className={
                        `w-full max-w-lg bg-surface-raised
                        rounded-t-2xl pb-8
                        transform transition-transform duration-300 ease-out
                        ${visible ? 'translate-y-0': 'translate-y-full'}
                    `}
                    onClick = {e => e.stopPropagation()}
                >

                    {/* Drag Handle Icon */}
                    <div className = "flex justify-center pt-3 pb-2">
                        <div className = "w-10 h-2 rounded-full bg-text-muted" />
                    </div>

                    {/* Read-Only MediaItem Preview*/}
                    {/* <RowItemStyling>
                        <RowItemContent
                            firstString={currentMediaItem.name}
                            secondString={'TODO: ADD CREATORS'}
                            emojiIcon={<MediaTypeLabel mediaTypeId={currentMediaItem.mediaTypeId} faded={true} />}
                        />
                    </RowItemStyling> */}
                    {/* The "preview" is a passed-in ReactNode that is at the top of the settigns bar,
                    to be used as a stylized way to tell the user which item they are editing.
                    I prefer passing in
                        <RowItemStyling
                            <RowItemContent />
                        </RowItemStyling>*/}
                    {preview}





                    {/* The Menu Options*/}
                    <div className = "flex flex-col">

                        {/* This means that this modal is calling its children as a function,
                        passing in the close function as a parameter*/}
                        {children(close)}
                    </div>





                </div>
            </div>
        );
}

export function SettingsRow({icon, label, onClick}: {icon: string; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}

            // Tailwind:
            //  -- active: when the user's finger/mouse is pressed down on this element
            //  -- gap-4: 16px between each child element (the icon span and the label span)
            //  -- text-text, hover:bg-surface, active:bg-border: all use semantic theme colors (see index.css @theme)
            className="flex items-center gap-4 px-6 py-4 text-left text-text hover:bg-surface active:bg-border transition-colors w-full"
        >
            <span className="text-xl w-6 text-center">{icon}</span>
            <span className="text-base">{label}</span>
        </button>
    );
}
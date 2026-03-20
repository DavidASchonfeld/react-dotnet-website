import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MediaItemRowContent from "../MediaItemRowContent";
import MediaTypeLabel from "../MediaTypeLabel";
import type { MediaItemSummary } from "../../types/mediaItem";

interface Props {
    currentMediaItem: MediaItemSummary | null;  // null = closed
    onClose: () => void;
}

export default function MediaItemSettingsModal({currentMediaItem, onClose}: Props){

        // 'visible' drives the CSS slide-up/slide-down animation
        //  visible is separate from the item variable because
        //  visible is related to the animation showing/hiding the modal.

        const [visible, setVisible] = useState(false);
        const navigate = useNavigate();

        // navigator.share = the native iOS/Android/desktop share sheet (like Spotify).
        // This is the default Share popup that you see whenever you click Share on your iPhone.
        // Supported on Chrome/Safari/Edge on macOS & Windows, but NOT Firefox desktop.
        // When unavailable, the button becomes a "Copy Link" button instead.
        const canNativeShare = typeof navigator.share === 'function';

        // When a new MediaItemItem is passed in, show this modal
        // by animating the modal coming up
        // This useEffect only runs when this modal first loads
        // and when its dependency's (listed at end of this useEffect)
        // value changes
        useEffect(() => {
            if (currentMediaItem) {

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
        }, [currentMediaItem]);

        function close() {
            setVisible(false);
            // Wait 300ms for the slidedown animation to finish
            // before telling this object's parent
            setTimeout(onClose, 300);
        }

        // If there is no currentMediaItem,
        // this modal will not render
        if (!currentMediaItem) return null;

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
                    <div className = "flex items-center gap-2 px-4 py-3 border-b border-border">
                        <MediaItemRowContent
                            firstString={currentMediaItem.name}
                            emojiIcon={<MediaTypeLabel mediaTypeId={currentMediaItem.mediaTypeId} faded={true} />}
                        />
                    </div>

                    {/* The Menu Options*/}
                    <div className = "flex flex-col">
                        <SettingsRow
                            icon="🔗"
                            label={canNativeShare ? "Share" : "Copy Link"}
                            onClick={() => {
                                const url = `${window.location.origin}/mediaitem/${currentMediaItem.id}`;
                                if (canNativeShare) {
                                    // .catch() swallows the AbortError thrown when the user
                                    // dismisses the native share sheet without sharing.
                                    navigator.share({ title: currentMediaItem.name, url }).catch(() => {});
                                } else {
                                    navigator.clipboard.writeText(url).catch(() => {});
                                }
                                close();
                            }}
                        />
                        <SettingsRow
                            icon="📄"
                            label="Go to Details"
                            onClick={() => { navigate(`/mediaitem/${currentMediaItem.id}`); close(); }}
                        />
                        {/* TODO: Implement this page: navigate(`/mediaitem/${currentMediaItem.id}/creators`);                         
                        <SettingsRow
                            icon="👤"
                            label="View Creators"
                            onClick={() => { navigate(`/mediaitem/${currentMediaItem.id}/creators`); close(); }}
                        /> */}
                    </div>





                </div>
            </div>
        );
}

function SettingsRow({icon, label, onClick}: {icon: string; label: string; onClick: () => void }) {
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
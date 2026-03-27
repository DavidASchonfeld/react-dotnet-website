import { type ReactNode } from 'react';
import { BACKEND_BASE_URL } from '../../config';
import ItemActionsButton from './ItemActionsButton';
import type { MenuAction } from '../../utils/menuActions';
import type { RowItemDisplayProps } from '../../types/rowItemTypes';
import ImageCacheIndicatorDot from '../administrator_related/ImageCacheIndicatorDot';

export type { MenuAction };

interface Props extends RowItemDisplayProps {
    onClick?: () => void;
    onMenuClick?: MenuAction[];
    preview?: ReactNode;  // overrides the auto-generated drawer preview; only used when onMenuClick is set
}

// Generic row content for any named object.
// Layout: [Photo or placeholder] | [flex-col: [firstString] / [secondString] / [thirdString (larger only)]] | [labelPill] | [ItemActionsButton]
// Used as the children of SwipeReorderRowItem (swipe + drag) and RowItemStyling (visual styling only), and other pages/modals.
export default function RowItemContent({ firstString, secondString, thirdString, larger, photographOnLeft, useDirectUrl, labelPill, onClick, onMenuClick, preview }: Props) {

    const imageSrc = photographOnLeft
        ? (useDirectUrl || !photographOnLeft.startsWith('http')
            ? photographOnLeft
            : `${BACKEND_BASE_URL}/api/imagecache?url=${encodeURIComponent(photographOnLeft)}`)
        : null;

    return (
        <div className={`flex flex-row items-stretch gap-3 w-full min-w-0${onClick ? ' cursor-pointer' : ''}`} onClick={onClick}>

            {/* Photograph — fixed size; placeholder shown if no URL.
                larger mode: self-stretch (height) + w-16 (fixed width) fills the card height flush.
                             Parent must use items-stretch for this to work. */}
            <div className={`shrink-0 bg-border flex items-center justify-center overflow-hidden relative
                ${larger
                    ? 'self-stretch w-16 rounded'
                    : 'rounded aspect-square w-10 h-10'
                }`}>
                {photographOnLeft && (
                    <img
                        src={imageSrc!}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={e => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (!img.dataset.retried) {
                                img.dataset.retried = 'true';
                                setTimeout(() => { img.src = photographOnLeft; }, 1500);
                            } else {
                                img.src = '/placeholder-thumbnail.svg';
                            }
                        }}
                    />
                )}
                <ImageCacheIndicatorDot src={imageSrc ?? ''} />
            </div>

            {/* Rows stacked */}
            <div className={`flex flex-col flex-1 min-w-0  ${larger ? 'gap-1' : ''}`}>

                {/* Top Row: main name (truncated) */}
                <div className="flex items-start gap-1 min-w-0">
                    <span className="truncate text-[15px] font-medium flex-1 text-left text-text leading-tight">{firstString}</span>
                </div>

                {/* Second Row: optional secondary string (e.g. content rating + creators) */}
                {secondString && (
                    <div className={`flex items-center gap-1 min-w-0 text-[11.5px] text-text/90 leading-tight${larger ? '' : ' -mt-1.5'}`}>
                        <span className="truncate text-left">{secondString}</span>
                    </div>
                )}

                {/* Third Row: only rendered in larger mode */}
                {larger && thirdString && (
                    <div className="flex items-center gap-1 min-w-0 text-[11.5px] text-text/90 leading-tight">
                        <span className="truncate text-left">{thirdString}</span>
                    </div>
                )}

            </div>

            {labelPill && (
                <div className="self-center shrink-0">{labelPill}</div>
            )}

            {onMenuClick && (
                // No infinite loop: ItemActionsButton builds its own preview from these display props,
                // rendering an inner RowItemContent without onMenuClick — so the chain stops there.
                <ItemActionsButton
                    onMenuClick={onMenuClick}
                    preview={preview}
                    firstString={firstString}
                    secondString={secondString}
                    thirdString={thirdString}
                    photographOnLeft={photographOnLeft}
                    useDirectUrl={useDirectUrl}
                    labelPill={labelPill}
                />
            )}

        </div>
    );
}

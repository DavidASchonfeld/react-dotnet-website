import AnimatedPage from "../components/AnimatedPage";
import FeaturedCollageCard from "../components/FeaturedCollageCard";
import { useGetFeaturedListsQuery } from "../services/apiSlice";

const COLLAGE_ROTATIONS = [-4, 2, -6, 3, 5, -2, 7, -3];

export default function HomePage() {

    const { data: featuredLists, isLoading, isError } = useGetFeaturedListsQuery();

    const homepageList = featuredLists?.find(l => l.name === "Home Page") ?? featuredLists?.[0];
    const featuredItems = homepageList?.listContent.slice(0, 8) ?? [];

    return (
        <AnimatedPage>
        <div className="page flex-col gap-8">

            <div className="text-center">
                <h1 className="h1-styling">Media Favorites</h1>
                <p className="text-text/70 mt-1">Browse movies, books, music, and more — then build your own lists.</p>
            </div>

            {isError && (
                <p className="text-center text-text/50">Couldn't load featured content.</p>
            )}

            {!isError && !isLoading && featuredItems.length === 0 && (
                <p className="text-center text-text/50">Check back soon — featured picks coming!</p>
            )}

            {(isLoading || featuredItems.length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-4 max-w-3xl mx-auto w-full">
                    {isLoading
                        ? COLLAGE_ROTATIONS.map((_, i) => (
                            <div
                                key={i}
                                className="aspect-[2/3] rounded-lg bg-border animate-pulse"
                                style={{ transform: `rotate(${COLLAGE_ROTATIONS[i]}deg)` }}
                            />
                        ))
                        : featuredItems.map((item, i) => (
                            <FeaturedCollageCard
                                key={item.id}
                                apiSourceName={item.apiSourceName}
                                externalId={item.externalId}
                                name={item.name}
                                creatorName={item.creatorName}
                                thumbnailUrl={item.thumbnailUrl}
                                rotation={COLLAGE_ROTATIONS[i] ?? 0}
                            />
                        ))
                    }
                </div>
            )}

        </div>
        </AnimatedPage>
    );
}

import AnimatedPage from "../components/AnimatedPage";
import FeaturedCollage from "../components/FeaturedCollage";
import { useGetFeaturedListsQuery } from "../services/apiSlice";
import { DEFAULT_COLLAGE_CONFIGS } from "../data/collageConfigs";

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

            <FeaturedCollage featuredItems={featuredItems} isLoading={isLoading} configs={DEFAULT_COLLAGE_CONFIGS} />

        </div>
        </AnimatedPage>
    );
}

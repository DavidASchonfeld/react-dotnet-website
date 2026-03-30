import AnimatedPage from "../components/AnimatedPage";
import FeaturedCollage from "../components/FeaturedCollage";
import { useGetFeaturedListsQuery } from "../services/apiSlice";
import { DEFAULT_COLLAGE_CONFIGS } from "../data/collageConfigs";

export default function HomePage() {

    // refetch lets the retry button manually re-trigger the query without a full page reload
    const { data: featuredLists, isLoading, isError, refetch } = useGetFeaturedListsQuery();

    const homepageList = featuredLists?.find(l => l.name === "Home Page") ?? featuredLists?.[0];
    const featuredItems = homepageList?.listContent.slice(0, 8) ?? [];

    return (
        <AnimatedPage>
        <div className="page flex-col gap-8">

            {/* Hero section: dot-grid texture adds depth without any images */}
            <div className="relative text-center py-4 px-2 rounded-xl overflow-hidden">
                {/* CSS-only dot-grid texture overlay — uses border color so it adapts to every theme */}
                <div
                    className="absolute inset-0 rounded-xl opacity-40 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, var(--color-border) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                />
                {/* Accent bar above the title: gradient from primary → transparent */}
                <div className="page-header-accent mx-auto w-24" />
                {/* Larger heading for stronger visual impact */}
                <h1 className="text-4xl font-bold tracking-tight relative">Media Favorites</h1>
                <p className="text-text/70 mt-2 text-base relative">Browse movies, video games, and more — then build your own lists and tags.</p>
            </div>

            {isError && (
                <div className="text-center flex flex-col items-center gap-2">
                    <p className="text-text/50">Couldn't load featured content.</p>
                    {/* Retry button: re-runs the RTK Query without a full page reload */}
                    <button onClick={refetch} className="btn-secondary text-sm">Try again</button>
                </div>
            )}

            {!isError && !isLoading && featuredItems.length === 0 && (
                <p className="text-center text-text/50">Check back soon — featured picks coming!</p>
            )}

            <FeaturedCollage featuredItems={featuredItems} isLoading={isLoading} configs={DEFAULT_COLLAGE_CONFIGS} />

        </div>
        </AnimatedPage>
    );
}

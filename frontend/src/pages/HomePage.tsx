import { useNavigate } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";



export default function HomePage() {

    // Import ability to navigate within this website
    const navigate = useNavigate();

    return (
        <AnimatedPage>
        <div className="page">
            <h1 className = "h1-styling">Media Favorites Website</h1>
            <p>WARNING: Backend Host (Render) takes 30-60s to turn on once it receives a HTTP Request.
            So once you use do a backend request, it will take 30-60 seconds to start up and then it will work fine.
            Then it will "spin out"/aka hibernate if it doesn't hear anything for next 15 minutes.
            </p>

            <p>This website is a place where you can browse submitted descriptions on Movies, Books and more, and create lists and favorites.</p>

            <div className="flex justify-center">
                <button
                    className="btn btn-secondary w-fit"
                    onClick={() => navigate("/about")}
                >About Page</button>
            </div>
        </div>
        </AnimatedPage>
    );
}
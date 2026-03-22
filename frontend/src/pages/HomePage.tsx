import { useNavigate } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";



export default function HomePage() {

    // Import ability to navigate within this website
    const navigate = useNavigate();

    return (
        <AnimatedPage>
        <div className="page flex-col">
            <h1 className = "h1-styling">Media Favorites Website</h1>
            <h2>WARNING: Backend Host (Render) spins out.</h2>
            <h2>Copy-Pasted from </h2>

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
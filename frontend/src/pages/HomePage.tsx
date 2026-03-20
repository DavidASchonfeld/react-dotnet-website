import { Link } from "react-router-dom";
import { ThemePicker } from "../components/ThemePicker";



export default function HomePage() {


    return (
        <div>
            <h1>Media Favorites Website</h1>
            This website is a place where you can browse submitted descriptions on Movies, Books and more, and create lists and favorites.
            <br />
            <br />
            <ThemePicker />
            <br />
            <br />
            <Link to = "/about">About Page</Link>
        </div>
        
    );
}
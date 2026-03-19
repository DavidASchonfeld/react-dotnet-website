import { Link } from "react-router-dom";



export default function HomePage() {


    return (
        <div>
            <h1>Media Favorites Website</h1>
            This website is a place where you can browse submitted descriptions on Movies, Books and more, and create lists and favorites.
            <Link to = "/about">About Page</Link>
        </div>
        
    );
}
import { Link } from "react-router-dom";

export default function About(){
    return (
        <div>
            <h1> About Page</h1>
            <p>This website is created by David Schonfeld.</p>
            <p>
                Tech Stack used
                    Front-End: React, Redux
                    Back-end: ASP.NET Core, EF Core, SQLite, JWT (Json Web Token), Tailwind
            </p>
            
            <Link to="https://github.com/DavidASchonfeld">My Github Webpage</Link>
            <Link to="https://github.com/DavidASchonfeld/react-dotnet-website">This Website's Code, Posted on Github</Link>
        </div>
    )
}
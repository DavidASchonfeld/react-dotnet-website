import AnimatedPage from "../components/AnimatedPage";

export default function About(){


    //  "_blank" <- This tells "window.open" to open a new tab
                        //                instead of just redirecting to a new page.
                        //  "noopener,noreferrer": Needed for security:
                        //     noopener: prevents hijacking, which is when,
                        //         while the user is looking at the new site,
                        //         the old (aka still-open) tab gets redirected
                        //         to a malicious look-alike and the user does not notice
                        //         That would be caused by a malicious webstie that I would be directing to.
                        //         Github.com is reputable, so it would never do that, but its still important to be safe
                        //     noreferrer: by default, websites tell the destination website where it came from
                        //         Using noreferrer prevents the destination website from seeing where your user came from.
    const goToExternalWebsite = (inURL: string): (Window | null) => {return  window.open(inURL, "_blank", "noopener,noreferrer");}

    return (
        <AnimatedPage>
        <div className="page">
            <h1 className="h1-styling">About Page</h1>
            <p>This website is created by David Schonfeld.</p>

            <div>
                <p className="font-semibold text-text">Tech Stack</p>
                <ul className="list-disc list-inside text-text-muted mt-1 space-y-1">
                    {/* Core framework, language, and build tooling */}
                    <li><span className="text-text">Front-End:</span> React 19, TypeScript, Vite</li>
                    {/* State management */}
                    <li><span className="text-text">State:</span> Redux Toolkit, redux-persist</li>
                    {/* Routing and styling */}
                    <li><span className="text-text">Routing & Styling:</span> React Router, Tailwind CSS</li>
                    {/* UI / interaction libraries */}
                    <li><span className="text-text">UI Libraries:</span> Framer Motion, Recharts, dnd-kit, Sonner, react-select</li>
                    {/* Backend framework, ORM, auth, and database */}
                    <li><span className="text-text">Back-End:</span> ASP.NET Core 10, EF Core, PostgreSQL, JWT</li>
                    {/* API documentation tool */}
                    <li><span className="text-text">API Docs:</span> Scalar</li>
                </ul>
            </div>

            <div className="flex gap-2 justify-center">
                <button
                    className="btn btn-secondary w-fit"
                    onClick={() =>
                        
                        goToExternalWebsite("https://github.com/DavidASchonfeld/")}
                >My Github Webpage</button>

                <button
                    className="btn btn-secondary w-fit"
                    onClick={() => goToExternalWebsite("https://github.com/DavidASchonfeld/react-dotnet-website")}
                >This Website's Code</button>
            </div>
        </div>
        </AnimatedPage>
    )
}
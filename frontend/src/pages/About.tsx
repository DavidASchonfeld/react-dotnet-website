import { ThemePicker } from "../components/ThemePicker";
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
                    <li><span className="text-text">Front-End:</span> React, Redux, Tailwind CSS</li>
                    <li><span className="text-text">Back-End:</span> ASP.NET Core, EF Core, SQLite, JWT</li>
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

            <div>
                <h2 className="text-lg font-semibold text-text mb-2">Color Theme Picker</h2>
                <ThemePicker />
            </div>
        </div>
        </AnimatedPage>
    )
}
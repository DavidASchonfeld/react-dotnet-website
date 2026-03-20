import { ThemePicker } from "../components/ThemePicker";

export default function About(){

    // Importing ability to Redirect
    

    return (
        <div className="flex-col gap-10">
            <h1> About Page</h1>
            <p>This website is created by David Schonfeld.</p>
            <p>
                Tech Stack used
                    Front-End: React, Redux
                    Back-end: ASP.NET Core, EF Core, SQLite, JWT (Json Web Token), Tailwind
            </p>
            
            
            <button onClick = {() =>
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
                window.open("https://github.com/DavidASchonfeld/","_blank", "noopener,noreferrer")}
            >My Github Webpage</button>

            <button onClick = {() => window.open("https://github.com/DavidASchonfeld/react-dotnet-website","_blank", "noopener,noreferrer")}
            >This Website's Code</button>
            <p>Color Theme Picker</p>
            <ThemePicker />

        </div>
    )
}
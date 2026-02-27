import { Link } from "react-router-dom";

export default function Navbar() {
    // export: So this function can be used in other files
    // default: The default function that is referenced when this file is imported. This is an optional tag
    return (
        <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
        </nav>
    )
}
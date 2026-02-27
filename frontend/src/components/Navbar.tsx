import { Link } from "react-router-dom";
import { useState } from 'react'

export default function Navbar() {
    // export: So this function can be used in other files
    // default: The default function that is referenced when this file is imported. This is an optional tag

    const [minimized, setMinimized] = useState(false)
    // useState lets React.js keep track of variables/functions
    // minimized: variable keeping track of if this bar is minimized or not
    // setMinimized: the function we are using to set the "minimized" variable.
    // This is needed to ensure that the variable is updated successfully
    // useState(false): means the default value will be set to false



    return (
        <nav>
            {!minimized && (
            <>
                {/* Only appears if varaible "minimized" = false */}
                <Link to="/" style = {{margin: '0 16px'}}>Home</Link>
                <Link to="/about" style = {{margin: '0 16px'}}>About</Link>
            </>
            )}
            <button onClick={() => setMinimized(!minimized)}>
                {minimized ? 'Expand' : 'Minimize'}
            </button>
        </nav>
    )
    // !minimized = opposite of the minimized value
    // This button will pass into the function the opposite of the current minimized value.
    //    The point is to toggle the minimized value to the opposite of what it currently is.

}
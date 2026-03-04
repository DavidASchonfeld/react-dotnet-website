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

    const [isTop, setIsTop] = useState(true)
    // useState(true) means that default value is true



    return (
        <nav style = {{
            display: 'flex',
            flexDirection: isTop ? 'row' : 'column',
            // row for Top, column for putting the bar on the left

            width: isTop ? '100%': '100px',
            // 100% for full width if nav is on the top
            // only a fixed width if its on the left


            height: isTop ? '60px' : '100vh',
            // fixed height if bar is on the top
            // full screen height if menu is on the left

            position: 'fixed',
            top: 0,
            left: 0,

            // Main Axis: Direction items are flowing
            //    (When bar is on the top, aka column mode, that's left to right)
            //    (When bar is on the left, aka row mode, that's top to bottom)
            // Cross Axis: Perpendicular Direction
            // Align all objects in the Navigation bar to the center to make everything look nice 

            alignItems: 'center',
            // Makes sure objects are centered with regard to the Cross Axis direction

            justifyContent: 'center',
            // Makes sure objects are centered with regard to the Main Axis direction

            gap: '8px 16px',
            // Instead of adding the following line inside each individual object below, 
            // we use the line above
            // style = {{margin: '8px 16px'}}
            // Example: <Link to="/" style = {{margin: '8px 16px'}}>Home</Link>

            backgroundColor: 'rgba(0, 0, 0, 0.6)',

            borderRadius: '12px',
            // Give the Navigation Bar rounded corners

            

        }}>
            {!minimized && (
            <>
                {/* Only appears if varaible "minimized" = false */}
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/login">Log In</Link>

                <button onClick={() => setIsTop(!isTop)} style = {{}}>
                    {isTop ? 'Set Menu to Left' : 'Set Menu to Top'}
                </button>
                {/* Here, setIsTop changes isTop to its opposite value. */}
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
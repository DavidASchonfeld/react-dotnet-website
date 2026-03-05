import { Link, useNavigate } from "react-router-dom";
import { useState } from 'react'

// Importing from My Files
import { useAuth } from "../hooks/useAuth";

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

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);


    const auth = useAuth();
    const navigate = useNavigate();  // set up useNavigate React.js to use it later (just like with useAuth()  ).


    const handleLogout = () => {
        auth?.logout();
        navigate('/login');
    }


    return (
        <nav style = {{
            display: 'flex',
            flexDirection: isTop ? 'row' : 'column',
            // row for Top, column for⤒ putting the bar on the left

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
                <button onClick={() => navigate("/")}>Home</button>
                <button onClick={() => navigate("/about")}>About</button>

                {!auth?.userName && 
                <button onClick={() => navigate("/login")}>Log In</button>
                }
                
                {auth?.userName && 
                <>
                    
                    <div className = "relative">
                        {/* Clicking Username will toggle (open/close) this User-Specific Menu. */}
                        {/* Potential Icons to Use for Opening/Closing Menus:
                        ⇤⤒⬇︎▼▲—|⬅︎⬆︎
                        */}
                        <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                            {auth?.userName} {isUserMenuOpen ? "▲" : "▼"}
                        </button>

                        {/* The Dropdown Menu */}
                        {isUserMenuOpen &&(
                            <div className = "absolute top-full right-0 bg-white shadow-lg rounded mt-1">
                                {/* absolute: removes eleemnt from normal page flow, puts it relative to the neatrest relative parent.
                                This is how we get this menu to float over other elements.
                                top-full:positions top of dropdown button on the bottom of parent button
                                mt-1: mt stands for "Margin-Top". Add just 1 to the top of this menu to add a tiny margin
                                between this menu and the button that opened it.
                                */}

                                <button onClick={() => navigate("/my-lists")}>My Lists</button>
                                <button onClick={handleLogout}>Log Out</button>
                            </div>
                        )}

                    </div>

                </>
                }



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
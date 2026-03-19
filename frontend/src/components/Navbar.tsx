import { useNavigate } from "react-router-dom";
import { useState } from 'react'
import { useSelector, useDispatch } from "react-redux";

// Importing from My Files
import type { RootState, AppDispatch } from "../store/store";
import { clearCredentials } from "../store/authSlice";



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


    // Pulling in ability to dispatch functions and get username:
    const { userName, roleLevel } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    

    // Importing ability to Redirect
    const navigate = useNavigate();  // set up useNavigate React.js to use it later (just like with useAuth()  ).


    const handleLogout = () => {

        // calling the logout function was refactored into clearCredentials() in frontend/src/store/authSlice.ts
        dispatch(clearCredentials());

        // The following line(s) only run if the clearCrednetials() line above is successful.
        // Navigate to the login page.
        navigate('/login');
    }

    // When isTop = true, put the navigation bar on the top of the screen
    // When isTop = false, put the navigation bar on the left of the screen
    return (
        <nav 
            className={
                `fixed top-0 left-0 flex items-center justify-center
                gap-y-2 gap-x-4 bg-black/60 rounded-xl
                ${isTop ? 'flex-row w-full h-[60px]' : 'flex-col w-[100px] h-screen'}
                `
            }
        >
            {!minimized && (
            <>
                {/* Only appears if variable "minimized" = false */}






                <button onClick={() => navigate("/")}>Home</button>

                {/* Only appears if logged in */}
                {userName && <button onClick={() => navigate("/mediaitems/explore")}>Explore: Media Items</button>}


                <button onClick={() => navigate("/about")}>About</button>
                

                

                {!userName && 
                <button onClick={() => navigate("/login")}>Log In</button>
                }
                
                {userName && 
                <>
                    
                    <div className = "relative">
                        {/* Clicking Username will toggle (open/close) this User-Specific Menu. */}
                        {/* Potential Icons to Use for Opening/Closing Menus:
                        ⇤⤒⬇︎▼▲—|⬅︎⬆︎
                        */}
                        <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                            {userName}
                            {/* If the user is a Moderator or an Administrator,
                            display a badge describing if he is a moderator or administrator
                            ml-1 means: Margin-Left add space 1
                            bg-amber-500 means set background to amber and use amber shade 500 (I could use any number between 50 and 950.)
                            
                            */}
                            {roleLevel === 'Moderator' && (
                                <span className="ml-1 text-xs bg-gray-400 text-white px-1 rounded">MOD</span>
                            )}
                            {roleLevel === 'Administrator' && (
                                <span className="ml-1 text-xs bg-amber-500 text-white px-1 rounded">ADMIN</span>
                            )}
                            {isUserMenuOpen ? "▲" : "▼"}
                        </button>

                        {/* The Dropdown Menu */}
                        {isUserMenuOpen &&(
                            <>
                                <div
                                className = "absolute top-full right-0 bg-white shadow-lg rounded mt-1"

                                // This onClick here, on the entire dropdown menu, means that no matter what you click in the dropdown menu itself,
                                // it will still close the dropdown menu, so the dropdown menu doesn't awkwardly stay open when you navigate to another page.
                                onClick={() => setIsUserMenuOpen(false)}
                                >
                                    {/* absolute: removes eleemnt from normal page flow, puts it relative to the neatrest relative parent.
                                    This is how we get this menu to float over other elements.
                                    top-full:positions top of dropdown button on the bottom of parent button
                                    mt-1: mt stands for "Margin-Top". Add just 1 to the top of this menu to add a tiny margin
                                    between this menu and the button that opened it.
                                    */}

                                    <button onClick={() => navigate("/my-medialists")}>My Lists</button>
                                    
                                    {/* These options only appear to users who are Administrators */}
                                    {roleLevel === 'Administrator' && (
                                        <button onClick={() => navigate("/admin/users")}>Manage Users</button>
                                    )}
                                    {roleLevel === 'Administrator' && (
                                        <button onClick={() => navigate("/admin/mediaitems")}>Manage Media Items</button>
                                    )}


                                    <button onClick={handleLogout}>Log Out</button>
                                </div>
                            </>

                            
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
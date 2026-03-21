// Import from Libraries
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import AnimatedPage from "../components/AnimatedPage";

// Import from My Files
import type { AppDispatch, RootState } from "../store/store";
import { loginThunk, registerThunk } from "../store/authSlice";


export default function LoginOrRegisterPage() {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");

    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");  // Only needed for registering users
    


    const navigate = useNavigate(); // Importing function to navigate between pages
    const dispatch = useDispatch<AppDispatch>();

    const authStatus = useSelector((state: RootState) => state.auth.status);
    const authError = useSelector((state: RootState) => state.auth.error);


    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {


        // Prevents the Default action (which would be, after submitting a form, refreshing a page)
        // Since we are using React.js, we don't need to refresh the page for submission
        e.preventDefault();


        if (isRegistering){
            try {

                // Old Version (Before Implementing Redux (and therefore Redux's thunks)):
                //    The line below is now in registerThunk in "authSlice.ts"
                //       const data = await registerUser(userName, email, password); // auth stores the useAuth(), so it calls the login function from useAuth (aka from the AuthContext.tsx file)

                //    The line below is now deleted since calling registerThunk saves these variables 
                //        auth?.login(data.token, userName); // Pull in the data (token, username) from the successful login into the local AuthContext file so all of React.js pages can access that information

                await dispatch(registerThunk({ userName, email, password})).unwrap();

                navigate("/");  // Navigate to home page (This is only reached if the login is successful)
            } catch {
                // Since now registering logic is stored in Redux (in authSlice.ts), the error message to be displayed is also managed there too.
            }
        } else {
            try {

                // Old Version (Before Implementing Redux (and therefore Redux's thunks)):
                //    The line below is now in loginThunk in "authSlice.ts"
                //       const data = await loginUser(userName, password); // auth stores the useAuth(), so it calls the login function from useAuth (aka from the AuthContext.tsx file)

                //    The line below is now deleted since calling loginThunk saves these variables 
                //        auth?.login(data.token, userName); // Pull in the data (token, username) from the successful login into the local AuthContext file so all of React.js pages can access that information

                
                await dispatch(loginThunk({ userName, password})).unwrap();

                navigate("/");  // Navigate to home page (This is only reached if the login is successful)
            } catch {
                // Since now logging in logic is stored in Redux (in authSlice.ts), the error message to be displayed is also managed there too.
            }
        }

        
        
    };

    return (

        <AnimatedPage>
            <form onSubmit={handleSubmit}>
            <div className="flex flex-col border-2 border-solid rounded-md shadow-xl m-10 gap-4">
                

                <div className="flex flex-row">
                    <button
                        type="button"
                        className={`px-4 py-2 w-full ${!isRegistering ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                        onClick={() => setIsRegistering(false)}>
                        Login
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 w-full ${isRegistering ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                        onClick={() => setIsRegistering(true)}>
                        Register
                    </button>
                </div>
                
                {authError && <h3>{authError}</h3>}
                
                <input
                    className = "px-4" /* Adds a little padding on left/right of this object */
                    value = {userName}  /* React.js controls the value */

                    /* every time input changes (aka after every keystroke),
                    then change the userName variable's value to that textbox's value */
                    onChange = {e => setUserName(e.target.value)} 
                    placeholder="Username"
                />
                {isRegistering && (
                    <>
                    
                    
                    <input
                        className = "px-4" /* Adds a little padding on left/right of this object */
                        value={email}
                        onChange= {e => setEmail(e.target.value)}
                        placeholder="Email"
                    />
                    
                    </>
                    
                )}


                

                
                <input
                    className = "px-4" /* Adds a little padding on left/right of this object */

                    /* Makes this input field the standard "password" field where 
                       where every character you type inside is represented by a generic filled circle character */
                    type = "password"

                    value = {password}  /* React.js controls the value */

                    onChange = {e => setPassword(e.target.value)} 
                    placeholder = "Password"
                />
                
                {/* disabled will be set to True when authStatus==='loading'
                For Tailwind, adding "disabled:" in front of certain characteristics
                means that those characteristics only activate
                when the object (in this case, a button) is disabled
                Here, I am using
                "disabled:opacity-50" and "disabled:cursor-not-allowed"
                */}

                <button
                type = "submit"
                disabled= {authStatus === 'loading'} 
                className="w-full bg-blue-500 text-gray-500 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRegistering ? "Register" : "Login"}
                </button>
                
                </div>
            
            </form>
        </AnimatedPage>
    )
    /* {errorString && <h3>{errorString}</h3>} means that this <h3> object
       is only shown when errorString is not null. That way, if errorString is null, we won't have an empty <h3> there */

}
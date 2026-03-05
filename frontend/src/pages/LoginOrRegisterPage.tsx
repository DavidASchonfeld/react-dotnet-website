// Import from Libraries
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// Import from My Files
import { loginUser, registerUser } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

export default function LoginOrRegisterPage() {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");

    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");  // Only needed for registering users


    // Initializes error variable to null (If there is a login error, it would be displayed/stored here)
    // This is not representing actual error codes
    // This is a string telling the user if there is an error logging in.
    const [errorString, setErrorString] = useState<string | null>(null);
    

    const navigate = useNavigate(); // Importing function to navigate between pages
    const auth = useAuth(); // Importing function to use AuthContext


    const handleSubmit = async (e: React.SyntheticEvent) => {

        // Prevents the Default action (which would be, after submitting a form, refreshing a page)
        // Since we are using React.js, we don't need to refresh the page for submission
        e.preventDefault();

        setErrorString(null);  // Clears any previous error message before trying to login again.

        if (isRegistering){
            // Register User Logic
            try {
                const data = await registerUser(userName, email, password); // auth stores the useAuth(), so it calls the login function from useAuth (aka from the AuthContext.tsx file)
                auth?.login(data.token, userName); // Pull in the data (token, username) from the successful login into the local AuthContext file so all of React.js pages can access that information
                navigate("/");  // Navigate to home page (This is only reached if the login is successful)
            } catch {
                setErrorString("User Registration Error: Invalid username or password"); // sets the string representing the login error to that value. We'll show this error string to the user
            }

        } else {
            // Login Logic
            try {
                const data = await loginUser(userName, password); // auth stores the useAuth(), so it calls the login function from useAuth (aka from the AuthContext.tsx file)
                auth?.login(data.token, userName); // Pull in the data (token, username) from the successful login into the local AuthContext file so all of React.js pages can access that information
                navigate("/");  // Navigate to home page (This is only reached if the login is successful)
            } catch {
                setErrorString("Login Error; Invalid username or password"); // sets the string representing the login error to that value. We'll show this error string to the user
            }
        }

        
    };

    return (
    
        <>
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
                
                {errorString && <h3>{errorString}</h3>}
                
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
                

                <button type = "submit" className="w-full bg-blue-500 text-gray-500 py-2 rounded hover:bg-blue-600">
                    {isRegistering ? "Register" : "Login"}
                </button>
                
                </div>
            
            </form>
            
       </>
    )
    /* {errorString && <h3>{errorString}</h3>} means that this <h3> object
       is only shown when errorString is not null. That way, if errorString is null, we won't have an empty <h3> there */

}
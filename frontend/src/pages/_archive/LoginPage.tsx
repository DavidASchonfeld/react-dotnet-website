// Import from Libraries
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// Import from My Files
import { loginUser } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");

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
        try {
            const data = await loginUser(userName, password); // auth stores the useAuth(), so it calls the login function from useAuth (aka from the AuthContext.tsx file)
            auth?.login(data.token, userName); // Pull in the data (token, username) from the successful login into the local AuthContext file so all of React.js pages can access that information
            navigate("/");  // Navigate to home page (This is only reached if the login is successful)
        } catch {
            setErrorString("Invalid username or password"); // sets the string representing the login error to that value. We'll show this error string to the user
        }
    };

    return (
    
        <>
            <form onSubmit={handleSubmit}>
                 
                {errorString && <h3>{errorString}</h3>}
                <input
                    value = {userName}  /* React.js controls the value */

                    /* every time input changes (aka after every keystroke),
                    then change the userName variable's value to that textbox's value */
                    onChange = {e => setUserName(e.target.value)} 
                />
                <br/>
                <input
                    /* Makes this input field the standard "password" field where 
                       where every character you type inside is represented by a generic filled circle character */
                    type = "password"

                    value = {password}  /* React.js controls the value */

                    onChange = {e => setPassword(e.target.value)} 
                />
                <br />
                <button type = "submit">Submit</button>
            </form>
       </>
    )
    /* {errorString && <h3>{errorString}</h3>} means that this <h3> object
       is only shown when errorString is not null. That way, if errorString is null, we won't have an empty <h3> there */

}
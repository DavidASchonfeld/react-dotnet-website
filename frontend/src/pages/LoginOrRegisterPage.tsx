// Import from Libraries
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import AnimatedPage from "../components/AnimatedPage";

// Import from My Files
import type { AppDispatch, RootState } from "../store/store";
import { loginThunk, registerThunk, clearAuthError } from "../store/authSlice";


export default function LoginOrRegisterPage() {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");

    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");  // Only needed for registering users



    const navigate = useNavigate(); // Importing function to navigate between pages
    const dispatch = useDispatch<AppDispatch>();

    const authStatus = useSelector((state: RootState) => state.auth.status);
    const authError = useSelector((state: RootState) => state.auth.error);

    // Clear any error persisted from a previous session when the page loads.
    useEffect(() => {
        dispatch(clearAuthError());
    }, [dispatch]);


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
            <form onSubmit={handleSubmit} aria-labelledby="auth-heading">
                {/* old Styling"flex flex-col border-2 border-solid rounded-md shadow-xl m-10 gap-4" */}
            <div className="page">

                {/* a11y: sr-only heading so screen readers announce whether this is a login or registration form */}
                <h1 id="auth-heading" className="sr-only">
                    {isRegistering ? 'Create an account' : 'Sign in to your account'}
                </h1>

                <div className="flex flex-row">
                    <button
                        type="button"
                        // a11y: aria-pressed indicates which tab (Login/Register) is currently active
                        aria-pressed={!isRegistering}
                        className={`px-4 py-2 w-full ${!isRegistering ? 'border-b-2 border-primary text-primary' : 'text-text-muted'}`}
                        onClick={() => { setIsRegistering(false); dispatch(clearAuthError()); }}>
                        Login
                    </button>
                    <button
                        type="button"
                        // a11y: aria-pressed indicates which tab (Login/Register) is currently active
                        aria-pressed={isRegistering}
                        className={`px-4 py-2 w-full ${isRegistering ? 'border-b-2 border-primary text-primary' : 'text-text-muted'}`}
                        onClick={() => { setIsRegistering(true); dispatch(clearAuthError()); }}>
                        Register
                    </button>
                </div>

                {/* a11y: role="alert" causes screen readers to announce errors automatically when they appear */}
                {authError && <p id="auth-error" role="alert" className="text-danger text-sm">{authError}</p>}

                {/* a11y: sr-only label associated via htmlFor so screen readers name this field even without a visible label */}
                <label htmlFor="login-username" className="sr-only">Username</label>
                <input
                    id="login-username"
                    className="form-input"
                    value = {userName}  /* React.js controls the value */

                    /* every time input changes (aka after every keystroke),
                    then change the userName variable's value to that textbox's value */
                    onChange = {e => setUserName(e.target.value)}
                    placeholder="Username"
                    // a11y: aria-required signals to screen readers that this field must be filled before submission
                    aria-required="true"
                    // a11y: aria-describedby links this field to the error message so it is read together on error
                    aria-describedby={authError ? 'auth-error' : undefined}
                />
                {isRegistering && (
                    <>

                    {/* a11y: sr-only label for email field, only rendered when registering */}
                    <label htmlFor="login-email" className="sr-only">Email</label>
                    <input
                        id="login-email"
                        className="form-input"
                        type="email"
                        value={email}
                        onChange= {e => setEmail(e.target.value)}
                        placeholder="Email"
                        // a11y: aria-required signals this field is mandatory for registration
                        aria-required="true"
                        aria-describedby={authError ? 'auth-error' : undefined}
                    />

                    </>

                )}




                {/* a11y: sr-only label for password field so screen readers announce "Password" instead of just the placeholder */}
                <label htmlFor="login-password" className="sr-only">Password</label>
                <input
                    id="login-password"
                    className="form-input"

                    /* Makes this input field the standard "password" field where
                       where every character you type inside is represented by a generic filled circle character */
                    type = "password"

                    value = {password}  /* React.js controls the value */

                    onChange = {e => setPassword(e.target.value)}
                    placeholder = "Password"
                    // a11y: aria-required signals to screen readers that this field must be filled
                    aria-required="true"
                    aria-describedby={authError ? 'auth-error' : undefined}
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
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                // a11y: aria-busy signals to screen readers that the form is currently submitting
                aria-busy={authStatus === 'loading'}
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

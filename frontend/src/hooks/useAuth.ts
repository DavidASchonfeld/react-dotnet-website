import { useContext } from "react";

// Imported from my created file
import { AuthContext } from "../context/AuthContext"




// Custom hook to make it easier to type to use AuthContext:
// Because this brand new function just does useContext(AuthContext);,
// then useAuth() and useContext(AuthContext); does the exact same thing
// This function will just make it shorter to type (and less prone to error
// to prevent me from misspelling AuthContext and causing issues in those other files
export function useAuth(){
    return useContext(AuthContext);
}

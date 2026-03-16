import {Navigate} from 'react-router-dom'
import type {ReactNode} from "react";
import { useSelector } from 'react-redux';

// Importing from my File
import type { RootState } from '../store/store';


// NOTE:
// This file "ProtectedRoute.tsx" checks if a user is logged in.
// If not, redirect away from pages that need the user logged in.
// This logic does not take care of access/privacy between different user's private information
// which would belong in the backend.

// Input: "children": ReactNode (aka Page component) to Navigate to.
//   (Only succesfully able to navigate there if the user is logged in.)
export default function ProtectedRoute({children} : {children: ReactNode}){

    // Before using Redux, used a file useAuth() (a webhook that went to a context file AuthContext
    // that stored/handled login/register logic.)
    // The lines of code were:
        // const auth = useAuth();
        // if (!auth?.token){  // If user is not logged in (aka user has no web token)
        //     return <Navigate to="/login" />;
        // }
        // return children;
    // Now isAuthenticated logic is stored inside the auth slice
    // (in frontend/src/store/authSlice.ts)


    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    if (!isAuthenticated){
        return <Navigate to="/login" />;
    }


    // aka go to the route that you originally meant to go to now that ProtectedRoute has checked to ensure that you are logged in
    return children;
}

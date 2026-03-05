import {Navigate} from 'react-router-dom'
import type {ReactNode} from "react";

// Importing from my File
import { useAuth } from '../hooks/useAuth'

// NOTE:
// This file "ProtectedRoute.tsx" checks if a user is logged in.
// If not, redirect away from pages that need the user logged in.
// This logic does not take care of access/privacy between different user's private information
// which would belong in the backend.


// Input: "children": ReactNode (aka Page component) to Navigate to.
//   (Only succesfully able to navigate there if the user is logged in.)
export default function ProtectedRoute({children} : {children: ReactNode}){
    const auth = useAuth();

    if (!auth?.token){  // If user is not logged in (aka user has no web token)
        return <Navigate to="/login" />;
    }
    return children;
}
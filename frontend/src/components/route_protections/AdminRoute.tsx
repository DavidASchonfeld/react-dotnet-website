import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";



import type { RootState } from "../../store/store";



export default function AdminRoute({children} : { children: ReactNode}) {
    const {isAuthenticated, roleLevel } = useSelector((state: RootState) => state.auth);

    // <Navigate to="/login" /> automatically redirects the user to the specified webpage

    if (!isAuthenticated) return <Navigate to="/login" />
    if (roleLevel !== 'Administrator') return <Navigate to="/" />


    // Shows/returns the webpage/components that this AdminRoute is blocking/protecting.
    return children;
}
import { useContext } from "react";

// Imported from my created file
import { AuthContext } from "../context/AuthContext"




// Custom hook to make it easier to type to use AuthContext:
// Because this brand new function just does useContext(AuthContext);,
// then useAuth() and useContext(AuthContext); does the exact same thing
// This function will just make it shorter to type (and less prone to error
// to prevent me from misspelling AuthContext and causing issues in those other files)
// Update: Now also checks to ensure it has AuthContext inside it, and throws an error if it doesn't.
// To use useAuth(), the component must be inside <AuthProvider> in main.tsx.
// Example structure from main.tsx:
// <StrictMode>
//   <BrowserRouter>
//     <AuthProvider>   <-- useAuth() works anywhere inside here
//       <App />
//     </AuthProvider>
//   </BrowserRouter>
// </StrictMode>
export function useAuth(){
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

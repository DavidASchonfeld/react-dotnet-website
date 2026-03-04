import { createContext, useState } from "react";
import type {ReactNode } from "react";

// React Hooks:
// -- Different "Sticky notes" with information stored inside, making it easier for different parts of React to access/change certain variable CSSFontFeatureValuesRule
// -- 2 Types We Are Using Here:
// ---- useState: Variables only shared in the Specific React.js Component,
//                Variables persist between Renders
//                (unlike other variables not in useState or certain other React hooks.)
// ---- useContext: Variables Shared Globally Throughout the React.js App
// In AuthContext.tsx, useState stores the token, useContext shares the token


// Create Custom Type called AuthContextType
type AuthContextType = {
    token: string | null;  // The variable token can have a string or null as its value
    // NOT using "string?" because in TypeScript (not in .NET),
    // string? (in TypeScrpt) means: string | undefined
    // (which means it would allow that variable to NOT exist at all.
    // We still want the variable to exist, even if its value is null.
    // (In C#/.NET, yes string? would mean that the variable stil needs to exist, and means (string | null)) 

    userName: string | null;

    // A variable storing a function. We are describing its input parameters,
    //   and its output (it outputs nothing, so we write that by saying it outputs void (aka nothing))
    login: (token: string, userName: string) => void;


    logout: () => void;
}







const AuthContext = createContext<AuthContextType | null>(null);
// <AuthContextType | null>: Valuse can be AuthContextType or null
// (null): The default value will be set to Null before we fill it with information

// To make AuthContext able to be accesssed by other parts of React.js outside of rthis file:
export {AuthContext};

// Note: I created a hook (aka a globally-accessible (in the React.js app) function) that calls AuthContext, in the "hooks/useAuth.ts" file





export function AuthProvider({children}: {children: ReactNode}) {

    // const [token, setToken] = useState<string | null>(null);
    // This is a simpler version of the initialzation for below.
    // It means: Type can be "string" or "null"
    // (null) <-=In the parentheses is the default value. In this simplified version, that initial value is null
    // In the more complicated version I use below, I am instead intializing the value
    // by pulling the from localStorage

    const [token, setToken] = useState<string | null>(
        localStorage.getItem("token")
        // If localStorage has the value, it loads in
        // If it doesn't, it returns a null, which already fits with our (string | null) type perfectly

        // localStorage: stores data in browser permanently until manually cleared
        //       Never sent to server
        //       Only accessible via JavaScript
        //       No expiry date
    );
    const [userName, setUserName] = useState<string | null>(
        localStorage.getItem("userName")
    );

    const login = (token: string, userName: string) => {
        // This method's parameters (including names and capitalization) 
        // must match the function variable called "login" in the AuthContextType above 

        setToken(token);
        setUserName(userName);
        localStorage.setItem("token", token);
        localStorage.setItem("userName", userName);
    };

    const logout = () => {
        // This method's parameters (including names and capitalization) 
        // must match the function variable called "logout" in the AuthContextType above 

        setToken(null);
        setUserName(null);
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
    };

    return (
        <AuthContext.Provider value={{ token, userName, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
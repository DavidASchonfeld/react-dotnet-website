import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {loginUser, registerUser} from '../services/authService';

// This file replaces my AuthContext.tsx for storing/taking care of cookies for being logged in.

// What is a slice?
//
// A self-contained piece of my Redux state
// each slice bundles 3 things together:
// -- the shape of that piece of state
//    type AuthState = {
//        token: string | null, 
//        userName: string | null,
//        isAuthenticated: boolean
//    }
// -- the initial value of that state
// -- the reducers (functions that update that state)
//
// From RTK (Redux Toolkit) Before RTK,
// those 3 things lived in separate files
// and were wired togeher manually.
// createSlice packages them together.



// State Shape:
//   Copies what AuthContext.tsx stores
//   and also adds isAuthenticated so PRotectedRoute
//   does not need to check token !== null itself.

type AuthState = {
    token: string | null,
    userName: string | null,
    isAuthenticated: boolean,
    status: 'idle' | 'loading' | 'succeeded' | 'failed',  // <- standard RTK (Redux Toolkit) async lifecycle
    error: string | null
};

// About "isAuthenticated:
//   Before this, in my older code, checking if a user
//   was logged in was only "if token !== null",
// Now, it is a separate variable because this is best practices
// because authentication in more complicated websites has
// authentication be more complciated than checking if the token variable is null



// Initialization of State:
// Will be initalized as null and false
// redux-persistent will overwrite these from localSTorage
// when the page loads
// this redux-persist replaces my homemade localStorage.getItem()
// from the original AuthContext.tsx
const initialState: AuthState = {
    token: null,
    userName: null,
    isAuthenticated: false,
    status: 'idle',
    error: null
};



// Async Thunks:
// createAsyncThunk
// -- makes it easier to manage async function calls.
// -- has "idle", "pending", "succeeed" and "failed" states

// createAsyncThunk parameters:
// -- string Name for this action. (used in Redux DevTools, must be unique)
// -- async function that does the work

// async function receives the parameters you pass in through when you call dispatch(loginThunk(...))
// If the async function throws an error, Redux catches the error and runs the rejected case.




export const loginThunk = createAsyncThunk(
    'auth/login',
    async({userName, password}: {userName: string; password: string}) => {
        

        // Run the api call to "/api/auth/login/" and returns the token
        // Runs the loginUser() method from frontend/src/services/authService.ts
        const data = await loginUser(userName, password);

        return {token: data.token as string, userName};

    }
);

export const registerThunk = createAsyncThunk(
    'auth/register',
    async({userName, email, password}: {userName: string; email: string; password: string}) => {

        // Runs the registerUser() method from frontend/src/services/authService.ts
        const data = await registerUser(userName, email, password);
        return {token: data.token as string, userName};

    }
);



// Slices
// createSlice bundles together: initial state, reducers (sync actions) and a general reducer function.

// reducers: 
// a function that takes in {state, action} and returns {new state}.

// extraReducers: for reacting to async thunk results.


const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        
        // Replaces the login() function for putting the received credentials into being stored locally.
        // PayloadAction <- Tells TypeScript what shape that
        // action.payload will have when it is inputted here as a parameter

        
        setCredentials: (state, action: PayloadAction<{token: string; userName: string}>)  => {

            // RTK (Reducer Toolkit Library) runs my reducer code
            // through a library called Immer, which intercepts code
            // so I can type the updating characteristic code below
            // as if I'm updating the specific variable's value
            // when, in actuality, the immer library is created a new cimmmutable opy of
            // the input value with the new values
            state.token = action.payload.token;
            state.userName = action.payload.userName;
            state.isAuthenticated = true;
        },

        // Replaces the logout() function
        // redux-persistent will also clear the persisted localStorage entry when this 
        // fires because state becomes null and the persist will sync that.
        clearCredentials: (state) => {
            state.token = null;
            state.userName = null;
            state.isAuthenticated = false;

            // If a user logs out after, way beforehand, he had had an error hwen logging in much earlier,
            // let's clear the error and the status just in case.
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        
        // builder.addCase lets us add methods that get called, depending on the thunk (aka action)'s state.
        // Think of this like a more complicated try/catch block
        // theThunk.pending: fired immediately right after dispatch(theThunk(...)) is called
        // theThunk.fulfilled: fired when the async function returns successfully
        // theThunk.rejected: fired when the async function throws an error

        


        builder.addCase(loginThunk.fulfilled, (state, action) => {
            state.token = action.payload.token;
            state.userName = action.payload.userName;
            state.isAuthenticated = true;
            state.status = 'succeeded';
            state.error = null;
        });
        
        builder.addCase(loginThunk.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });

        builder.addCase(loginThunk.rejected, (state, action) => {
            state.status = 'failed';

            // If the message == null, return the string "Login failed"
            state.error = action.error.message ?? 'Login failed';
        });



        builder.addCase(registerThunk.fulfilled, (state, action) => {
            state.token = action.payload.token;
            state.userName = action.payload.userName;
            state.isAuthenticated = true;
        });

        // Just copy-pasted from loginThunk, but for registerThunk
        builder.addCase(registerThunk.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });

        // Just copy-pasted from loginThunk, but for registerThunk
        builder.addCase(registerThunk.rejected, (state, action) => {
            state.status = 'failed';

            // If the message == null, return the string "Login failed"
            state.error = action.error.message ?? 'Register failed';
        });
    }
});

// Export the synchronous functions so components can import and dispatch them.
// Dispatch: Call this authSlice.ts to run the dispatched functionm
// To Dispatch:     dispatch(clearCredentials())
export const { setCredentials, clearCredentials } = authSlice.actions;


// Export the reducer.
export default authSlice.reducer;
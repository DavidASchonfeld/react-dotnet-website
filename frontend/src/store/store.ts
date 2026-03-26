import { configureStore, combineReducers  } from "@reduxjs/toolkit";
import {persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
// "storage" from redux-persist:
// -- by default, uses localStorage (in the browser)
// -- it is a thin wrapper that redux-persist uses to read/write

import authReducer from './authSlice'
import themeReducer from './themeSlice';
import adminSettingsReducer from './adminSettingsSlice';
import { apiSlice } from '../services/apiSlice';
import { listenerMiddleware } from './listenerMiddleware';



// Combine all reducers in my front-end into 1 reducer

const rootReducer = combineReducers({
    auth: authReducer,
    theme: themeReducer,
    adminSettings: adminSettingsReducer,
    // For the "key" (aka lefthand value) name,
    // import the name inside apiSlice.ts 's object apiSlice's attribute reducerPath's value.
    [apiSlice.reducerPath]: apiSlice.reducer,
})

// ---- Persist config -----
//
// key: the key item (for key/value pairs) in localStorage, which you can see in your browser's dev tools.
//     The value must be unique. The convention is to use the word "root" for this value.
// storage: Where to store Redux's values. The default (if I pass nothing in) is localStorage,
//     Here, I'll use localStorage as a great option for a web app,
//     since it persists even after the browser is closed.
// whitelist: which reducers to persist (aka which reducer's saved variable
//        to keep/store without needing to re-call those values every time a page refreshes)
//        Here, refresh means when the user manually refresh the page,
//        which is unrelated to when React re-renders a component
//        Here, I am only persisting the auth (login) and theme,
//        not the RTK Query cache (api slice) which should always be fresh.

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth', 'theme', 'adminSettings']
};

const persistedReducer = persistReducer(persistConfig, rootReducer);


// ---- Store ----

// configureStore = Get Store from "Redux" (General Redux)
export const store = configureStore({
    reducer: persistedReducer,

    // passes in a variable (that can be named anything,
    // but the conventional name is "getDefaultMiddleWare").
    // Then, in the next line, we use that variable "getDefaultMiddleware"
    // and specify about "serializableCheck".
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({

            serializableCheck: {

                // When checking if values contain non-serializable values.
                // Ignore the actions:
                // -- persist/PERSIST
                // -- persist/REHYDRATE
                // since those actions contain non-serializable values.
                // If I did not do this, Redux DevTools would show a warning
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
            }

            // This line appends "RTK Query"(Redux Toolkit Query) 's middleware
            // so Redux on my computer can use RTK Query's api library
            // listenerMiddleware runs before reducers (prepend), so it sees the action before state updates.
        }).prepend(listenerMiddleware.middleware).concat(apiSlice.middleware)
});

// persist is the object to pass into <PersistGate> in maint.tsx
// It controls weh nthe app renders (aka it waits until localStorage is loaded into Redux)
export const persistor = persistStore(store);


// ---- Types ----

// RootState = the TypeScript type of the entire Redux state tree
// Is needed when typing useSelector.
//    useSelector((state: RootState) => state.auth)
// rootReducer is defined at the top of this document as combining all of the other reducers together.
export type RootState = ReturnType<typeof rootReducer>;



// AppDispatch = the type of the dispatch function
// Use this when typing useDispatch:
//    useDispatch<AppDispatch>()
// This is important because plain useDispatch does not know about thunks
// and using AppDispatch lets TypeSCript know that using dispatch(loginThunk(...)) is valid.
export type AppDispatch = typeof store.dispatch;

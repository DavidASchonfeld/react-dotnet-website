import { createListenerMiddleware } from '@reduxjs/toolkit'
import { setCurrentTheme } from './themeSlice'
import { apiSlice } from '../services/apiSlice'

// RTK listener middleware: intercepts actions before they hit reducers.
// Used here to side-effect theme changes into a backend PATCH call.
export const listenerMiddleware = createListenerMiddleware()

// When the user manually changes theme AND is logged in, persist it to the server.
// Uses setCurrentTheme (not loadThemeFromServer) so server-loaded themes don't re-trigger this.
listenerMiddleware.startListening({
    actionCreator: setCurrentTheme,
    effect: (action, listenerApi) => {
        const state = listenerApi.getState() as { auth: { isAuthenticated: boolean } }
        // Skip API call for unauthenticated users — theme stays in localStorage only.
        if (!state.auth.isAuthenticated) return
        listenerApi.dispatch(
            apiSlice.endpoints.updateUserTheme.initiate(action.payload)
        )
    },
})

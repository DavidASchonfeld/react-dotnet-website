import '@fontsource-variable/inter'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// My Additional Imports
import { BrowserRouter} from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

// Import from My Files
import { store, persistor } from './store/store.ts'

// import { AuthProvider } from './context/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>

    <Provider store={store}>

      <PersistGate loading={null} persistor={persistor}>

        <BrowserRouter>
            <App />
        </BrowserRouter>

      </PersistGate>

    </Provider>

  </StrictMode>,
  // <StrictMode>: Development-Only tool, deliberately runs every component twice to help find side effects/bugs that only occur on re-renders. Also warns about deprecated React features and unsafe patterns.

  // <Provider>: Makes the Reux store acccessible to every component in the tree. It replaces the older <AuthProvider> of making auth state globally accessible, except now it also includes more local varaibles to store/become accessible throughout the whole front-end, and includes functions to deal with those variables (Beforehand, I had created useCallback to put functions to call the service functions for calling the API pull/read/edit requests on the MyMediaLists.psx page itself).
  // <Provider> is from library "react-redux" (3rd party library)
  // "store" and "persistor" are both from my file "frontend/src/store/store.ts"

  // <PersistGate>: Delays rendering until redux-persist is finished
  //    reading from localStorage and loading it into the store object.
  //    Otherwise, the ProtectedRoute.tsx logic (which prevents not-logged-in users)
  //    to be redirected away from only-logged-in-users-can-access
  //    would redirect the user away, before the frontend could load in from storage
  //    that the frontend is actually logged in already.
  //   loading = {null} tells PersistGate to show a blank screen while it is loading.
  //      Instead, I could pass in a Spinner component.
  // Note: Our <ProtectedRoute> is used in the frontend/src/App.tsx, and defined in frontend/src/components/ProtectedRoute.tsx
  // <PersistGate> is from "redux-persist/integration/react" (3rd-party library)

  // <BrowserRouter>: Enables Routing between Different URLs
)

import './App.css'

// My Additional Imports
//// React Router (External Library)
import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'

// My Code:
/// Component
import ProtectedRoute from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import FallbackToaster from './components/FallbackToaster'

/// All Pages
import About from './pages/About'
import Navbar from './components/Navbar'
import LoginOrRegisterPage from './pages/LoginOrRegisterPage'
import MyMediaListsPage from './pages/MyMediaListsPage'
import MediaListDetailPage from './pages/MediaListDetailPage'
import AdminManageAllUsersPage from './pages/AdminManageAllUsersPage'

// Other of My Code
import type { AppDispatch, RootState } from './store/store'
import { useGetAllApprovedMediaTypesQuery } from './services/apiSlice'
import AdminRoute from './components/AdminRoute'
import MediaApiRefDetailPage from './pages/MediaApiRefDetailPage'
import MyCustomTagsPage from './pages/MyCustomTagsPage'
import ExploreByTagPage from './pages/ExploreByTagPage'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import { DAY_NIGHT_MAP, setCurrentTheme, type DayNightTheme, type Theme } from './store/themeSlice'
import { useState } from 'react'



function App() {

  const location = useLocation()
  const [isTop, setIsTop] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  const { currentTheme } = useSelector((state: RootState) => state.theme);

// When Website loads, pull in all MediaType details
  // into a frontend store in Redux
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  // Pre-load all media types when the user is logged in.
  // RTK Query fires the request automatically; skip=true suppresses it when there is no token.
  useGetAllApprovedMediaTypesQuery(undefined, { skip: !token });


  // Handling Color Themes:
  function resolveTheme(theme: Theme | null): string | null {
    if (theme && theme in DAY_NIGHT_MAP){
      const hour = new Date().getHours();
      const { dayTheme, nightTheme } = DAY_NIGHT_MAP[theme as DayNightTheme];

      // If the selected theme is a day/night theme (for example ocean-dayNight)
      // Between 7am and 20 (aka 8pm), it is day, so return ocean-light
      // otherwise, return ocean-dark.
      return ((hour >= 7) && (hour < 20)) ? dayTheme : nightTheme;
    }
    return theme;
  }

  useEffect(() => {

    // Process the theme, if needed
    // Note: Right now, as you see above, resolveTheme only is needed for day/night themes.
    const resolvedTheme = resolveTheme(currentTheme);

    // Load in the theme into the DOM
    if (resolvedTheme === null){
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    }

    // If using a day/night theme:
    // Re-check at the next hour boundary
    // Yes, passing in currentTheme since that is the DayNightTheme
    // (if I am using that theme as the main theme right now.)
    if (currentTheme && currentTheme in DAY_NIGHT_MAP){
      const now = new Date();
      const msUntilNextHour = (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1000;
      const timer = setTimeout(() => {

        // Re-trigger by setting currentTheme = to the same theme,
        // this will cause the resolveTheme() to start again,
        // causing another time check to potentially
        // change the theme from day to night or vice versa,
        // or keep it since it is still day or night
        dispatch(setCurrentTheme(currentTheme));

      }, msUntilNextHour)

      // Cleans up timer when App.tsx is closed.
      // Also prevents multiple different timers stacking up over
      // time every time a currentTheme changes before the hour fires.
      return () => clearTimeout(timer);
    }

  }, [currentTheme, dispatch])  // runs on load, and whenever its dependency: "theme" changes


  // The entire Website Structure
  return (
    <>
      {/* Navbar's isTop variable is pulled into here App.tsx
          because App.tsx manages the whole webpage,
          so it needs to know whether navbar is
          on the top or left of the page,
          so it can pad the page's contents
          aka move the page contents so the navbar
          is not blocking them.
          As a reminder, "--navbar-top-height"

          onMinimizedChange: Navbar calls this whenever effectiveMinimized changes.
          That tells App.tsx whether to use the normal or minimized padding variable,
          so <main> always offsets by the navbar's actual current size.
          */}
      <Navbar isTop={isTop} setIsTop={setIsTop} onMinimizedChange={setIsMinimized} />
      <main style={isTop
        ? { paddingTop: isMinimized ? 'var(--navbar-top-minimized-height)' : 'var(--navbar-top-height)' }
        : { paddingLeft: isMinimized ? 'var(--navbar-left-minimized-width)' : 'var(--navbar-left-width)' }
      }>
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path = "/" element = {<HomePage />} />
        <Route path = "/about" element = {<About />} />
        <Route path = "/login" element = {<LoginOrRegisterPage />} />
        <Route path = "/my-medialists" element = {
          <ProtectedRoute>
              <MyMediaListsPage />
          </ProtectedRoute>
        } />

        {/* The ":id means that you can pass any variable there,
        and React will catch the value into the variable "id". */}
        <Route path = "/medialist/:id" element = {
          <ProtectedRoute>
              <MediaListDetailPage />
          </ProtectedRoute>
        } />



        <Route path = "/mediaapiref/:id" element = {
          <ProtectedRoute>
            <MediaApiRefDetailPage />
          </ProtectedRoute>
        } />

        <Route path = "/my-tags" element = {
          <ProtectedRoute>
            <MyCustomTagsPage />
          </ProtectedRoute>
        } />

        <Route path = "/tags/:tagId/items" element = {
          <ProtectedRoute>
            <ExploreByTagPage />
          </ProtectedRoute>
        } />

        <Route path = "/search" element = {
          <ProtectedRoute>
            <SearchResultsPage />
          </ProtectedRoute>
        } />


        {/* Admin-Only Pages */}
        <Route path = "/admin/users" element = {
          <AdminRoute>
            <AdminManageAllUsersPage />
          </AdminRoute>
        } />


      </Routes>
      </AnimatePresence>
      </main>
      <ErrorBoundary label="Toaster" fallback={null}>
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{ classNames: { toast: 'toast-base' } }}
        />
      </ErrorBoundary>
      <FallbackToaster />
    </>
  )
  
}

export default App

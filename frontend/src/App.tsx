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
import ProtectedRoute from './components/route_protections/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import FallbackToaster from './components/FallbackToaster'

/// All Pages
import About from './pages/About'
import Navbar from './components/navbar_related/Navbar'
import LoginOrRegisterPage from './pages/LoginOrRegisterPage'
import MediaListDetailPage from './pages/MediaListDetailPage'
import AdminManageAllUsersPage from './pages/AdminManageAllUsersPage'
import AdminApiUsagePage from './pages/AdminApiUsagePage'
import AdminEditFeaturedPage from './pages/AdminEditFeaturedPage'

// Other of My Code
import { routePaths } from './utils/routes'
import type { AppDispatch, RootState } from './store/store'
import { useGetAllApprovedMediaTypesQuery, useGetAppearanceDefaultsQuery } from './services/apiSlice'
import AdminRoute from './components/route_protections/AdminRoute'
import MediaApiRefDetailPage from './pages/MediaApiRefDetailPage'
import TagDetailPage from './pages/TagDetailPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import MySettingsPage from './pages/MySettingsPage'
import { DAY_NIGHT_MAP, setCurrentTheme, setCurrentModifier, type DayNightTheme, type Theme, type ThemeModifier } from './store/themeSlice'
import { useState } from 'react'



function App() {

  const location = useLocation()
  const [isMinimized, setIsMinimized] = useState(false)

  const { currentTheme, currentModifier } = useSelector((state: RootState) => state.theme);

// When Website loads, pull in all MediaType details
  // into a frontend store in Redux
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  // Pre-load all media types when the user is logged in.
  // RTK Query fires the request automatically; skip=true suppresses it when there is no token.
  useGetAllApprovedMediaTypesQuery(undefined, { skip: !token });

  // Fetch the app-wide default appearance values (public endpoint, always runs).
  const { data: appearanceDefaults } = useGetAppearanceDefaultsQuery();

  // On first visit (no persisted theme), apply the app defaults from the backend.
  // setCurrentTheme/setCurrentModifier will auto-sync to the backend if the user is logged in.
  useEffect(() => {
    if (currentTheme === null && appearanceDefaults) {
      dispatch(setCurrentTheme(appearanceDefaults.theme as Theme));
      dispatch(setCurrentModifier(appearanceDefaults.modifier as ThemeModifier));
    }
  }, [appearanceDefaults]);  // re-runs only when defaults load; null check prevents overwriting a real saved theme


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

  // Apply or remove the style modifier attribute — independent of theme/day-night logic
  useEffect(() => {
    if (currentModifier) {
      document.documentElement.setAttribute('data-modifier', currentModifier);
    } else {
      document.documentElement.removeAttribute('data-modifier');
    }
  }, [currentModifier])


  // The entire Website Structure
  return (
    <>
      {/* a11y: skip-link — lets keyboard/screen-reader users jump past the navbar directly to page content */}
      <a href="#main-content" className="skip-link">Skip to content</a>
      {/* onMinimizedChange: Navbar calls this whenever its minimized state changes so <main> padding stays in sync */}
      <Navbar onMinimizedChange={setIsMinimized} />
      {/* a11y: id + tabIndex={-1} so the skip-link href="#main-content" can move focus here programmatically */}
      <main id="main-content" tabIndex={-1} style={{ paddingTop: isMinimized ? 'var(--navbar-top-minimized-height)' : 'var(--navbar-top-height)' }}>
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path = "/" element = {<HomePage />} />
        <Route path = "/about" element = {<About />} />
        <Route path = "/login" element = {<LoginOrRegisterPage />} />
        {/* The ":id means that you can pass any variable there,
        and React will catch the value into the variable "id". */}
        <Route path={routePaths.mediaList} element={<MediaListDetailPage />} />



        <Route path={routePaths.mediaApiRef} element={<MediaApiRefDetailPage />} />

        <Route path={routePaths.tag} element={<TagDetailPage />} />

        <Route path = "/search" element = {<SearchPage />} />


        <Route path="/my-settings" element={
          <ProtectedRoute>
            <MySettingsPage />
          </ProtectedRoute>
        } />

        {/* Admin-Only Pages */}
        <Route path = "/admin/users" element = {
          <AdminRoute>
            <AdminManageAllUsersPage />
          </AdminRoute>
        } />

        <Route path = "/admin/api-usage" element = {
          <AdminRoute>
            <AdminApiUsagePage />
          </AdminRoute>
        } />

        <Route path = "/admin/edit-featured" element = {
          <AdminRoute>
            <AdminEditFeaturedPage />
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

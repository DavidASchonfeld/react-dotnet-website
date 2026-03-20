import './App.css'

// My Additional Imports
//// React Router (External Library)
import {Routes, Route} from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

// My Code:
/// Component
import ProtectedRoute from './components/ProtectedRoute'

/// All Pages
import About from './pages/About'
import Navbar from './components/Navbar'
import LoginOrRegisterPage from './pages/LoginOrRegisterPage'
import MyMediaListsPage from './pages/MyMediaListsPage'
import MediaListDetailPage from './pages/MediaListDetailPage'
import AdminManageAllUsersPage from './pages/AdminManageAllUsersPage'

// Other of My Code
import { fetchAllApprovedMediaTypes } from './store/mediaTypesSlice'
import type { AppDispatch, RootState } from './store/store'
import AdminRoute from './components/AdminRoute'
import ExploreMediaItemsPage from './pages/ExploreMediaItemsPage'
import MediaItemDetailPage from './pages/MediaItemDetailPage'
import AdminAllMediaItemsPage from './pages/AdminAllMediaItemsPage'
import HomePage from './pages/HomePage'



function App() {

  const { currentTheme } = useSelector((state: RootState) => state.theme);

  // When Website loads, pull in all MediaType details
  // into a frontend store in Redux
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (token) dispatch(fetchAllApprovedMediaTypes(token));
  }, [token, dispatch]);

  useEffect(() => {
    if (currentTheme === null){
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
  }, [currentTheme])  // runs on load, and whenever its dependency: "theme" changes


  // The entire Website Structure
  return (
    <> 
      <Navbar />
      <Routes>
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

        <Route path = "/mediaitems/explore" element = {
          <ProtectedRoute>
            <ExploreMediaItemsPage />
          </ProtectedRoute>
        } />

        {/* The ":id means that you can pass any variable there,
        and React will catch the value into the variable "id". */}
        <Route path = "/mediaitem/:id" element = {
          <ProtectedRoute>
            <MediaItemDetailPage />
          </ProtectedRoute>
        } />





        {/* Admin-Only Pages */}
        <Route path = "/admin/mediaitems" element = {
          <AdminRoute>
            <AdminAllMediaItemsPage />
          </AdminRoute>
        } />


        <Route path = "/admin/users" element = {
          <AdminRoute>
            <AdminManageAllUsersPage />
          </AdminRoute>
        } />


      </Routes>
    </>
  )
  
}

export default App

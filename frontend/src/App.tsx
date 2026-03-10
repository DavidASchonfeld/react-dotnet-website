import './App.css'

// My Additional Imports
//// React Router (External Library)
import {Routes, Route} from 'react-router-dom'

// My Code:
/// Component
import ProtectedRoute from './components/ProtectedRoute'

/// All Pages
import About from './pages/About'
import Navbar from './components/Navbar'
import LoginOrRegisterPage from './pages/LoginOrRegisterPage'
import MyMediaListsPage from './pages/MyMediaListsPage'
import MediaListDetailPage from './pages/MediaListDetailPage'

function App() {

  return (
    <> 
      <Navbar />
      <Routes>
        <Route path = "/" element = {<div>Home Page</div>} />
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
      </Routes>
    </>
  )
  
}

export default App

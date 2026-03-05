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
import MyListsPage from './pages/MyListsPage'

function App() {

  return (
    <> 
      <Navbar />
      <Routes>
        <Route path = "/" element = {<div>Home Page</div>} />
        <Route path = "/about" element = {<About />} />
        <Route path = "/login" element = {<LoginOrRegisterPage />} />
        <Route path = "/my-lists" element = {
          <ProtectedRoute>
              <MyListsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
  
}

export default App

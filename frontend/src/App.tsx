import './App.css'

// My Additional Imports
import {Routes, Route} from 'react-router-dom'
import About from './pages/About'
import Navbar from './components/Navbar'
import LoginPage from './pages/_archive/LoginPage'

function App() {

  return (
    <> 
      <Navbar />
      <Routes>
        <Route path = "/" element = {<div>Home Page</div>} />
        <Route path = "/about" element = {<About />} />
        <Route path = "/login" element = {<LoginPage />} />
      </Routes>
    </>
  )
  
}

export default App

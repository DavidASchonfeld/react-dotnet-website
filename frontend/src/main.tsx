import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// My Additional Imports
import { BrowserRouter} from 'react-router-dom'

// Import from My Files
import { AuthProvider } from './context/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
  // <StrictMode>: Development-Only tool, deliberately runs every component twice to help find side effects/bugs that only occur on re-renders. Also warns about deprecated React features and unsafe patterns.
  // <BrowserRouter>: Enables Routing between Different URLs
  // <AuthProvider>: Wraps <App /> so every component in my app can access the AuthContext (which stores the token, userName, login function, logout function).
)

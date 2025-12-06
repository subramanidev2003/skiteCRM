import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
// In src/main.jsx
import { AppContextProvider } from "./context/AppContext.jsx"; 
// 🚨 FIX: Import the UserProvider component from its file


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* 🚨 FIX: UserProvider is now defined and wrapped around the app */}
      
        <AppContextProvider>
          <App />
        </AppContextProvider>
      
    </BrowserRouter>
  </StrictMode>
  
);
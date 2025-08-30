import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './AppImproved.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

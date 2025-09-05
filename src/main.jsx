import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.complete.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
import './styles/iphone-optimizations.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { PricingComparison } from './components/PricingComparison.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <PricingComparison />
    </div>
  </React.StrictMode>
)
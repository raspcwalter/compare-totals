import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ThirdwebProvider } from "thirdweb/react";

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <ThirdwebProvider>
      <App />
    </ThirdwebProvider>
/*     
  <StrictMode>
    <App />
  </StrictMode>,
 */
)

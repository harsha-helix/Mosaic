import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/600-italic.css'
import '@fontsource/fraunces/700.css'
import '@fontsource/karla/400.css'
import '@fontsource/karla/400-italic.css'
import '@fontsource/karla/500.css'
// Onboarding welcome-step wordmark only (docs/15 follow-up) — a literary,
// higher-contrast serif reserved for the "✦ Mosaic" brand moment. Every
// other heading in the app stays on font-display (Fraunces); this is a
// scoped second display face, not a replacement.
import '@fontsource/cormorant-garamond/600.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

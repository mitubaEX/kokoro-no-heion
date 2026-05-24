import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import AudioGate from './components/AudioGate'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AudioGate>
        <App />
      </AudioGate>
    </HashRouter>
  </React.StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Service Worker for PWA & Real-Time Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('PWA Service Worker registered:', reg.scope);
    }).catch((err) => {
      console.warn('PWA Service Worker registration failed:', err);
    });
  });
}

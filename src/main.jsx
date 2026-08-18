import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global fetch middleware to catch and display API errors
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    if (!response.ok) {
      if (response.status === 400 || response.status === 403) {
        try {
          const clone = response.clone();
          const errorText = await clone.text();
          showErrorToast(`API Error (${response.status}): ${errorText.substring(0, 200)}`);
        } catch (e) {
          showErrorToast(`API Error (${response.status}): ${response.statusText}`);
        }
      }
    }
    return response;
  } catch (error) {
    showErrorToast(`Network Error: ${error.message}`);
    throw error;
  }
};

function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = '#ef4444';
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  toast.style.zIndex = '9999';
  toast.style.maxWidth = '400px';
  toast.style.wordWrap = 'break-word';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

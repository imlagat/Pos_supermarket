import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Clear token on first run after npm run dev (using sessionStorage flag)
if (!sessionStorage.getItem('hasStarted')) {
    localStorage.removeItem('token');
    sessionStorage.setItem('hasStarted', 'true');
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

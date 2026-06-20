import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/themes.css';
import './styles/main.css';
import './styles/search-modal.css';
import './styles/unrecognized-drawer.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

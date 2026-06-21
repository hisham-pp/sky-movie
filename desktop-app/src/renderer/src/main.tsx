import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router } from './router';
import './styles/themes.css';
import './styles/base.css';
import './styles/button.css';
import './styles/modal.css';
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/library.css';
import './styles/detail.css';
import './styles/dialog.css';
import './styles/player.css';
import './styles/scan.css';
import './styles/settings.css';
import './styles/responsive.css';
import './styles/search-modal.css';
import './styles/unrecognized-drawer.css';
import './styles/playlist.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);

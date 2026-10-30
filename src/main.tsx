import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// SPEC-045 AC-13: Schrift liegt bei uns (App offline, keine Anfrage an Google)
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-ext-700.css';
import { isNativeApp } from './lib/app/platform';
import { initNativeShell, hideSplashWhenReady } from './lib/app/nativeShell';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// SPEC-045: Handy-Funktionen nur in der App; im Browser passiert hier nichts
if (isNativeApp()) {
  initNativeShell();
  requestAnimationFrame(() => hideSplashWhenReady());
}

// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

import { WalletSelectorContextProvider } from "./contexts/WalletSelectorContext";
import { selector, modal } from "./wallets/web3modal";

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <WalletSelectorContextProvider selector={selector} modal={modal}>
      <App />
    </WalletSelectorContextProvider>
  </React.StrictMode>
);
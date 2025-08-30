// src/main.jsx

import { Buffer } from "buffer";
import process from "process";

if (typeof global === "undefined") {
  window.global = window;
}
window.Buffer = Buffer;
window.process = process;


import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { WalletSelectorContextProvider } from "./contexts/WalletSelectorContext.jsx";
import { ChakraProvider } from '@chakra-ui/react';

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <WalletSelectorContextProvider>
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </WalletSelectorContextProvider>
  </React.StrictMode>
);
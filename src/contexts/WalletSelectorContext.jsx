// src/contexts/WalletSelectorContext.jsx
import React, { useContext, useEffect, useState } from "react";
import { setupSelector, setupSelectorModal } from "../wallets.js";

const WalletSelectorContext = React.createContext(null);

export const WalletSelectorContextProvider = ({ children }) => {
  const [selector, setSelector] = useState(null);
  const [modal, setModal] = useState(null);
  const [accountId, setAccountId] = useState(null);

  useEffect(() => {
    // Fungsi async untuk menginisialisasi semuanya
    const initialize = async () => {
      const selectorInstance = await setupSelector();
      const modalInstance = setupSelectorModal(selectorInstance);
      setSelector(selectorInstance);
      setModal(modalInstance);
    };
    
    initialize();
  }, []);

  useEffect(() => {
    if (!selector) return;

    const subscription = selector.store.observable
      .subscribe((state) => {
        const activeAccount = state.accounts.find((a) => a.active);
        setAccountId(activeAccount ? activeAccount.accountId : null);
      });

    return () => subscription.unsubscribe();
  }, [selector]);

  if (!selector || !modal) {
    return null; // Tampilkan halaman kosong selagi loading
  }

  const value = { selector, modal, accountId };

  return (
    <WalletSelectorContext.Provider value={value}>
      {children}
    </WalletSelectorContext.Provider>
  );
};

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext);
  if (!context) {
    throw new Error("useWalletSelector must be used within a WalletSelectorContextProvider");
  }
  return context;
}
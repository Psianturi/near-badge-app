// src/contexts/WalletSelectorContext.jsx
import React, { useCallback, useContext, useEffect, useState } from "react";
import { distinctUntilChanged, map } from "rxjs";

const WalletSelectorContext = React.createContext(null);

export const WalletSelectorContextProvider = ({
  selector,
  modal,
  children,
}) => {
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);

  const getAccounts = useCallback(() => {
    return selector.store.getState().accounts;
  }, [selector]);

  useEffect(() => {
    const subscription = selector.store.observable
      .pipe(
        map((state) => state.accounts),
        distinctUntilChanged()
      )
      .subscribe((nextAccounts) => {
        setAccounts(nextAccounts);
        const nextActiveAccountId =
          nextAccounts.find((a) => a.active)?.accountId || null;
        setActiveAccountId(nextActiveAccountId);
      });

    return () => subscription.unsubscribe();
  }, [selector]);

  const value = {
    selector,
    modal,
    accounts,
    accountId: activeAccountId,
  };

  return (
    <WalletSelectorContext.Provider value={value}>
      {children}
    </WalletSelectorContext.Provider>
  );
};

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext);
  if (!context) {
    throw new Error(
      "useWalletSelector must be used within a WalletSelectorContextProvider"
    );
  }
  return context;
}
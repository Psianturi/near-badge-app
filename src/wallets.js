// src/wallets.js

import "@near-wallet-selector/modal-ui/styles.css";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupLedger } from "@near-wallet-selector/ledger";
import { ContractName, NetworkId } from "./config";

// Fungsi untuk setup selector
export const setupSelector = () => {
  return setupWalletSelector({
    network: {
      networkId: "testnet",
      nodeUrl: "https://rpc.testnet.lava.build", // Menggunakan RPC publik alternatif
      helperUrl: "https://helper.testnet.near.org",
      explorerUrl: "https://explorer.testnet.near.org",
    },
    modules: [
      setupMyNearWallet(),
      setupSender(),
      setupLedger(),
      setupMeteorWallet(),
    ],
  });
};

// Fungsi untuk setup modal
export const setupSelectorModal = (selector) => {
  return setupModal(selector, {
    contractId: ContractName,
  });
};
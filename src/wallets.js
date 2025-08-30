// src/wallets.js

import "@near-wallet-selector/modal-ui/styles.css";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupWalletSelector } from "@near-wallet-selector/core";
// ... (import wallet modules lainnya) ...
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { ContractName, NetworkId } from "./config";

// 1. Ambil API Key dari environment variable Next.js
const fastNearApiKey = process.env.NEXT_PUBLIC_FASTNEAR_API_KEY;

// 2. Buat URL RPC FastNear
const fastNearNodeUrl = `https://rpc.testnet.fastnear.com/?apiKey=${fastNearApiKey}`;

// Fungsi untuk setup selector
export const setupSelector = () => {
  return setupWalletSelector({
    network: {
      networkId: "testnet",
      nodeUrl: fastNearNodeUrl, // <-- Gunakan URL FastNear
      helperUrl: "https://helper.testnet.near.org",
      explorerUrl: "https://explorer.testnet.near.org",
    },
    modules: [
      setupMyNearWallet(),
      // ... (tambahkan wallet lain yang Anda inginkan di sini) ...
    ],
  });
};

// Fungsi untuk setup modal
export const setupSelectorModal = (selector) => {
  return setupModal(selector, {
    contractId: ContractName,
  });
};
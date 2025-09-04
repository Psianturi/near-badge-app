
import "@near-wallet-selector/modal-ui/styles.css";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupWalletSelector } from "@near-wallet-selector/core";

import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { ContractName, NetworkId } from "./config";

// 1. API Key from environment variable Next.js
const fastNearApiKey = process.env.NEXT_PUBLIC_FASTNEAR_API_KEY;
// const rpcNodeUrl = import.meta.env.VITE_FASTNEAR_RPC_URL;

// 2. URL RPC FastNear
const fastNearNodeUrl = `https://rpc.testnet.fastnear.com/?apiKey=${fastNearApiKey}`;
// if (!rpcNodeUrl) {
//   console.warn("VITE_FASTNEAR_RPC_URL is not set in .env file. Using public RPC as fallback.");
// }


export const setupSelector = () => {
  return setupWalletSelector({
    network: {
      networkId: "testnet",
      nodeUrl: fastNearNodeUrl,
      //  nodeUrl: rpcNodeUrl || "https://rpc.testnet.near.org",
      helperUrl: "https://helper.testnet.near.org",
      explorerUrl: "https://explorer.testnet.near.org",
    },
    modules: [
      setupMyNearWallet(),

    ],
  });
};

export const setupSelectorModal = (selector) => {
  return setupModal(selector, {
    contractId: ContractName,
  });
};
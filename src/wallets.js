// src/wallets/wallet.js

import "@near-wallet-selector/modal-ui/styles.css";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";

import { ContractName, NetworkId } from "./config";



const fastNearApiKey = process.env.NEXT_PUBLIC_FASTNEAR_API_KEY;

let nodeUrl;
if (NetworkId === 'mainnet') {
  nodeUrl = `https://rpc.mainnet.fastnear.com/?apiKey=${fastNearApiKey}`;
} else {
  // Default to testnet
  nodeUrl = `https://rpc.testnet.fastnear.com/?apiKey=${fastNearApiKey}`;
}

const fallbackNodeUrl = NetworkId === 'mainnet' 
  ? "https://rpc.mainnet.near.org"
  : "https://rpc.testnet.near.org";


// --- SETUP WALLET SELECTOR ---

export const setupSelector = () => {
  return setupWalletSelector({
    network: {
      networkId: NetworkId,
      nodeUrl: fastNearApiKey ? nodeUrl : fallbackNodeUrl,
      helperUrl: `https://helper.${NetworkId}.near.org`,
      explorerUrl: `https://explorer.${NetworkId}.near.org`,
    },
    modules: [
      setupMyNearWallet(),
      
      setupMeteorWallet(),
  
    ],
  });
};

export const setupSelectorModal = (selector) => {
  return setupModal(selector, {
    contractId: ContractName,
  });
};
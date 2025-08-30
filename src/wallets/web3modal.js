
import "@near-wallet-selector/modal-ui/styles.css";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupLedger } from "@near-wallet-selector/ledger"; 
import { ContractName, NetworkId } from "../config";

const selector = await setupWalletSelector({
  network: NetworkId,
  modules: [
    setupMyNearWallet(),
    setupSender(),     
    setupLedger(),      
  ],
});

const modal = setupModal(selector, {
  contractId: ContractName,
});

export { selector, modal };
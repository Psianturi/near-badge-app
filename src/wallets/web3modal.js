
import "@near-wallet-selector/modal-ui/styles.css";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { ContractName, NetworkId } from "../config";

const selector = await setupWalletSelector({
  network: NetworkId,
  modules: [
    setupMyNearWallet(),
    setupSender(),     
    setupMeteorWallet()
      
  ],
});

const modal = setupModal(selector, {
  contractId: ContractName,
});

export { selector, modal };
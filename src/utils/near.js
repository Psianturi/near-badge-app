import { makeRateLimited, makeCached } from './rateLimit';
import { NetworkId, ContractName } from '../config';

async function callViewWithFallback(selector, contractId, method, args = {}) {
  try {
    if (selector && selector.isSignedIn()) {
      const wallet = await selector.wallet();
      if (wallet && typeof wallet.viewMethod === "function") {
        console.log(`[RPC] Using wallet.viewMethod for: ${method}`);
        return await wallet.viewMethod({ contractId, method, args });
      }
    }
  } catch (e) {
    console.warn("Falling back to direct RPC call due to wallet.viewMethod error:", e);
  }
  
  try {
    const fastNearApiKey = import.meta.env.VITE_FASTNEAR_API_KEY;
    const rpcUrl = fastNearApiKey
      ? `https://rpc.${NetworkId}.fastnear.com/?apiKey=${fastNearApiKey}`
      : `https://rpc.${NetworkId}.near.org`;

    console.log(`[RPC] Using direct RPC node: ${rpcUrl}`);

    const resp = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "optimistic",
          account_id: contractId,
          method_name: method,
          // DIUBAH: Perbaiki kesalahan ketik dari args_base_64 menjadi args_base64
          args_base64: btoa(JSON.stringify(args)),
        },
      }),
    });
    const json = await resp.json();
    if (json.error) throw new Error(JSON.stringify(json.error));
    const bytes = json.result?.result;
    if (!bytes) return null;
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bytes)));
  } catch (e) {
    console.error(`RPC fallback failed for method: ${method}`, e);
    throw e;
  }
}

export async function sendTransaction(selector, accountId, actions) {
  if (!selector || !accountId) throw new Error("Wallet not ready or not signed in");
  const wallet = await selector.wallet();
  return wallet.signAndSendTransaction({ signerId: accountId, receiverId: ContractName, actions });
}

export const callView = makeCached(makeRateLimited(callViewWithFallback));

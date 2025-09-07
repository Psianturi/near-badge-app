// src/utils/callViewWithFallback.js
export async function callViewWithFallback(selector, contractId, method, args = {}) {

  const network = selector.options?.network;
  const rpcUrl = network?.nodeUrl || "https://rpc.testnet.near.org";

  // Build body query NEAR RPC
  const body = {
    jsonrpc: "2.0",
    id: "dontcare",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    },
  };

  // Request to RPC
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

  if (res.error) {
    throw new Error(res.error.data || res.error.message);
  }

  const resultStr = Buffer.from(res.result.result).toString();
  return JSON.parse(resultStr);
}

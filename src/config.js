// src/config.js

// export const NetworkId = process.env.NEXT_PUBLIC_NETWORK_ID || 'testnet';
// export const ContractName = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'coba-admin.testnet';



export const NetworkId = import.meta.env.VITE_NETWORK_ID || 'testnet';
export const ContractName = import.meta.env.VITE_CONTRACT_NAME || 'coba-admin.testnet';
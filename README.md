# NEAR Badge - Frontend Application

This is the official frontend for the NEAR Badge (POAP) project. It's a React-based web application built with a clean Vite setup that allows users and organizers to interact with the NEAR Badge smart contract.

## Core Features
- **Wallet Connection:** Connects to the NEAR Testnet using the official `@near-wallet-selector`.
- **Event Creation:** Allows authorized organizers to create new events directly on-chain.

## Technology Stack
- **Framework:** React (with Vite)
- **Wallet Integration:** `@near-wallet-selector`
- **Styling:** Chakra UI & Bootstrap

## Smart Contract
This frontend connects to the smart contract located at the following repository:

➡️ **[near-badge-contract](https://github.com/Psianturi/near-badge-contract)**

- **Current Testnet Address:** `v4.poap-badge.testnet` 

## Running Locally
To run this project on your local machine:
1. Clone the repository.
2. Navigate to the directory: `cd near-badge-app`
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`
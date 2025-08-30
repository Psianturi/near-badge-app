# NEAR Badge - Frontend Application

This is the official frontend for the NEAR Badge (POAP) project. It's a React-based web application built with a clean Vite setup that allows users and organizers to interact with the NEAR Badge smart contract.

## Core Features
- **Wallet Connection:** Connects to the NEAR Testnet using the official `@near-wallet-selector`.
- **Organizer Role Detection:** If your wallet is whitelisted as an organizer, you will see extra tools (e.g., Create Event).
- **Event Creation:** Allows authorized organizers to create new events directly on-chain.
- **Event Listing:** Displays available events fetched from the contract.
- **Claim Badge Flow:** Users can claim their badge (via event name or magic link).
- **Responsive UI:** Simple and intuitive design built with Chakra UI & Bootstrap.

## Technology Stack
- **Framework:** React (with Vite)
- **Wallet Integration:** `@near-wallet-selector`
- **Styling:** Chakra UI & Bootstrap

## Smart Contract
This frontend connects to the smart contract located at the following repository:

➡️ **[near-badge-contract](https://github.com/Psianturi/near-badge-contract)**

- **Current Testnet Address:** `posma-badge.testnet` (custom deployment)

## Running Locally
To run this project on your local machine:
1. Clone the repository.
2. Navigate to the directory: `cd near-badge-app`
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

## Screenshots
Here’s a preview of the current frontend:

![NEAR Badge Frontend Screenshot](![alt text](image-2.png))
![NEAR Badge Frontend Screenshot](![alt text](image-3.png))
![NEAR Badge Frontend Screenshot](![alt text](image-4.png))

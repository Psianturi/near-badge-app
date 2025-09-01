# NEAR Badge - Frontend Application

![Status: Active](https://img.shields.io/badge/status-active-success.svg)

Web application for the NEAR Badge (POAP) project. Built with React and Vite, this application provides a complete, multi-page interface for users and event organizers to interact with the NEAR Badge smart contract.

## Core Features

-   **Multi-Page Experience**: Uses React Router for seamless navigation between the main dashboard and event management pages.
-   **Role-Based UI**: The interface dynamically adapts based on the user's role. Special tools, like the "Create Event" and "Manage" buttons, are only visible to authorized `ADMIN` or `ORGANIZER` accounts.
-   **Full Whitelist Management**: A dedicated page for organizers to:
    -   **Upload Attendee Lists via CSV**: Parses CSV files (e.g., from Luma) and adds attendees to the whitelist in batches.
    -   **Add Attendees Manually**: Quickly add single attendees who might have registered late.
    -   **View Current Whitelist**: Displays the real-time list of all whitelisted accounts.
-   **Magic Link Generation**: Organizers can instantly copy a shareable "magic link" for any event.
-   **Interactive Transaction Toasts**: Provides users with direct links to the NEAR Explorer to view their successful transactions.
-   **NFT Badge Claiming**: Enables whitelisted attendees to easily claim their unique NFT badge for an event.
-   **Responsive Design**: A clean and modern interface built entirely with **Chakra UI**.

## Technology Stack

-   **Framework**: React (using Vite)
-   **UI Library**: Chakra UI
-   **Routing**: React Router
-   **CSV Parsing**: Papa Parse
-   **Blockchain Integration**: `@near-wallet-selector`

## Smart Contract

This frontend connects to the smart contract located at the following repository:

➡️ **[github.com/Psianturi/near-badge-contract](https://github.com/Psianturi/near-badge-contract)**

-   **Current Testnet Address:** `near-badge.testnet`

## Getting Started

Follow these steps to run the project on your local machine.

### Prerequisites

Ensure you have the following installed:
-   Node.js (v16 or later)
-   npm or yarn

### Installation & Running

1.  **Clone this repository:**
    ```bash
    git clone [YOUR_FRONTEND_REPO_URL]
    ```

2.  **Navigate into the project directory:**
    ```bash
    cd [YOUR_FOLDER_NAME]
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```


## Screenshots

**Attendee View**
![alt text](01.png)

**Admin/Organizer View**
![alt text](02.png)
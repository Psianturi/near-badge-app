
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useWalletSelector } from './contexts/WalletSelectorContext';
import { ContractName } from './config';

function App() {
  const { selector, modal, accountId } = useWalletSelector();
  
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);
  const [transaction, setTransaction] = useState(null);

  const handleCreateEvent = async () => {
    if (!eventName || !eventDescription) {
      alert("Please fill in both event name and description.");
      return;
    }
    
    setShowSpinner(true);
    
    try {
      const wallet = await selector.wallet();
      const result = await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: ContractName,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "create_event",
              args: { name: eventName, description: eventDescription },
              gas: "30000000000000",
              deposit: "0",
            },
          },
        ],
      });
      
      const txUrl = `https://explorer.testnet.near.org/transactions/${result.transaction_outcome.id}`;
      setTransaction(txUrl);
      alert(`Event "${eventName}" created successfully!`);

    } catch (e) {
      alert("Sorry, something went wrong. Please try again.");
      console.error("Error creating event:", e);
    } finally {
      setShowSpinner(false);
    }
  };

  const handleSignIn = () => {
    modal.show();
  };

  const handleSignOut = async () => {
    const wallet = await selector.wallet();
    wallet.signOut();
  };

  return (
    
    <div className="container">
      <header className="d-flex justify-content-end my-4">
        {accountId ? (
          <button className="btn btn-secondary" onClick={handleSignOut}>Log out {accountId}</button>
        ) : (
          <button className="btn btn-primary" onClick={handleSignIn}>Log in</button>
        )}
      </header>
      <main>
        <h1>NEAR Badge / POAP Manager</h1>
        <p>Create and manage your community events on the NEAR blockchain.</p>
        
        {accountId && (
          <div className="card my-4">
            <div className="card-header">
              Create a New Event (Contract: {ContractName})
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="eventName" className="form-label">Event Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="eventName" 
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="eventDescription" className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  id="eventDescription" 
                  rows="3"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                ></textarea>
              </div>
              <button className="btn btn-success" onClick={handleCreateEvent} disabled={showSpinner}>
                {showSpinner && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                Create Event
              </button>
            </div>
          </div>
        )}

        {!accountId && <p>Please log in to create an event.</p>}

        {transaction && (
          <div className="alert alert-info mt-4">
            <p>Transaction successful!</p>
            <a href={transaction} target="_blank" rel="noopener noreferrer">View Transaction on Explorer</a>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
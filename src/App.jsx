// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom';
import { useWalletSelector } from "./contexts/WalletSelectorContext.jsx";
import { ContractName, NetworkId } from "./config.js";
import {
  Box, Button, Container, Flex, Spacer, Badge, HStack, Image, Heading, Text, useToast, Link
} from "@chakra-ui/react";
import AdminPage from "./pages/AdminPage.jsx";
import ManagerPage from "./pages/ManagerPage.jsx";
import NearLogo from "./assets/near_logo.svg";
import DashboardPage from "./pages/DashboardPage.jsx";
import WhitelistManagerPage from "./pages/WhitelistManagerPage.jsx";
import { makeRateLimited, makeCached } from './utils/rateLimit'; 
import { DEFAULT_BADGE_IMAGES } from "./assets/default-images.js";
import MyBadgesPage from "./pages/MyBadgesPage.jsx";

// helper & constanta
const ExplorerLink = ({ txId }) => (
  <Link href={`https://explorer.testnet.near.org/transactions/${txId}`} isExternal color="cyan.200" textDecoration="underline" mt={2} display="block">
    View Transaction on Explorer
  </Link>
);

async function callViewWithFallback(selector, contractId, method, args = {}) {
  try {
    if (selector && selector.isSignedIn()) {
      const wallet = await selector.wallet();
      if (wallet && typeof wallet.viewMethod === "function") {
        return await wallet.viewMethod({ contractId, method, args });
      }
    }
  } catch (e) {
    console.warn("Falling back to RPC due to wallet.viewMethod error:", e);
  }
  try {
    const rpcUrl = NetworkId === "testnet" ? "https://rpc.testnet.near.org" : "https://rpc.mainnet.near.org";
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
    console.error("RPC fallback failed:", e);
    throw e;
  }
}
const callView =  makeCached(makeRateLimited(callViewWithFallback));
const GAS = "30000000000000";
const NO_DEPOSIT = "0";
const DEPOSIT_FOR_BADGE = "120000000000000000000000";

export default function App() {
  const { selector, modal, accountId } = useWalletSelector();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isManager, setIsManager] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [claimEventName, setClaimEventName] = useState("");
  const [creating, setCreating] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!selector) return;
      setLoadingEvents(true);
      try {
        // const evsPromise = callViewWithFallback(selector, ContractName, "get_all_events", {});
        const evsPromise = callView(selector, ContractName, "get_all_events", {}, 60);
        
        let rolesPromise = Promise.resolve([false, false, false]);
        if (accountId) {
          rolesPromise = Promise.all([
            callView(selector, ContractName, "is_owner", { account_id: accountId }, 300),
            callView(selector, ContractName, "is_organizer", { account_id: accountId },320),
            callView(selector, ContractName, "is_manager", { account_id: accountId }, 300)
          ]);
        }

        const [evs, [ownerCheck, orgCheck, managerCheck]] = await Promise.all([evsPromise, rolesPromise]);
        setEvents(Array.isArray(evs) ? evs : []);
        setIsOwner(Boolean(ownerCheck));
        setIsOrganizer(Boolean(orgCheck));
        setIsManager(Boolean(managerCheck));
      } catch (e) {
        toast({ title: "Failed to load data", description: String(e), status: "error" });
      } finally {
        setLoadingEvents(false);
      }
    };
    load();
  }, [selector, accountId]);

  async function sendTransaction(actions) {
    if (!selector || !accountId) throw new Error("Wallet not ready or not signed in");
    const wallet = await selector.wallet();
    return wallet.signAndSendTransaction({ signerId: accountId, receiverId: ContractName, actions });
  }


  const handleCreate = async () => {
    if (!name || !description) return toast({ status: "warning", title: "Fill name & description" });
    setCreating(true);

    const randomIndex = Math.floor(Math.random() * DEFAULT_BADGE_IMAGES.length);
    const randomMediaUrl = DEFAULT_BADGE_IMAGES[randomIndex];

    try {
      const result = await sendTransaction([
        {
          type: "FunctionCall",
          params: {
            methodName: "create_event",
            // Random  URL
            args: { name, description, media: randomMediaUrl },
            gas: GAS,
            deposit: NO_DEPOSIT
          }
        }
      ]);
      const txId = result.transaction_outcome?.id || result.transaction?.hash;
      toast({
        duration: 9000,
        isClosable: true,
        render: () => (
          <Box color="white" p={4} bg="green.500" borderRadius="md" boxShadow="lg">
            <Text fontWeight="bold">Event Created Successfully!</Text>
            {txId && <ExplorerLink txId={txId} />}
          </Box>
        )
      });
  
      const evs = await callView(selector, ContractName, "get_all_events", {}, 5);
      setEvents(Array.isArray(evs) ? evs : []);
      setName(""); setDescription("");
    } catch (e) {
      toast({ title: "Error creating event", description: (e?.message) || String(e), status: "error" });
    } finally {
      setCreating(false);
    }
  };



  const handleClaim = async () => {
    if (!claimEventName) return toast({ status: "warning", title: "Fill event name" });
    setClaiming(true);
    try {
      const result = await sendTransaction([
        { type: "FunctionCall", params: { methodName: "claim_badge", args: { event_name: claimEventName }, gas: GAS, deposit: DEPOSIT_FOR_BADGE } }
      ]);
      const txId = result.transaction_outcome?.id || result.transaction?.hash;
      toast({
        duration: 9000,
        isClosable: true,
        render: () => (
          <Box color="white" p={4} bg="teal.500" borderRadius="md" boxShadow="lg">
            <Text fontWeight="bold">Claim Request Successful!</Text>
            {txId && <ExplorerLink txId={txId} />}
          </Box>
        )
      });
      setClaimEventName("");
    } catch (e) {
      toast({ title: "Error claiming badge", description: (e?.message) || String(e), status: "error" });
    } finally {
      setClaiming(false);
    }
  };

  const handleDeleteEvent = async (eventName) => {
    if (!window.confirm(`Are you sure you want to delete the event "${eventName}"? This cannot be undone.`)) {
      return;
    }
    try {
      const result = await sendTransaction([
        { type: "FunctionCall", params: { methodName: "delete_event", args: { event_name: eventName }, gas: GAS, deposit: NO_DEPOSIT } }
      ]);
      toast({ title: "Event deleted successfully!", status: "success" });
      const evs = await callView(selector, ContractName, "get_all_events", {}, 0);
      setEvents(Array.isArray(evs) ? evs : []);
    } catch (e) {
      toast({ title: "Error deleting event", description: String(e), status: "error" });
    }
  };

  const handleSignIn = () => modal.show();
  const handleSignOut = async () => {
    const wallet = await selector.wallet();
    wallet.signOut();
  };

  return (
    <Router>
      <Box bg="gray.50" minH="100vh" py={[4, 8, 12]}>
        <Container maxW="container.md">
          {/* Header */}
          <Flex mb={6} align="center">
            <HStack as={RouterLink} to="/" spacing={4} _hover={{ textDecoration: 'none' }}>
              <Image src={NearLogo} boxSize="40px" alt="NEAR Logo" />
              <Box>
                <Heading as="h1" size="lg">NEAR Badge Manager</Heading>
                <Text color="gray.500">Contract: {ContractName}</Text>
              </Box>
            </HStack>
            <Spacer />
            <HStack spacing={3}>
              {accountId && (
                <Badge colorScheme={isOwner ? "green" : isManager ? "blue" : isOrganizer ? "yellow" : "pink"}>
                  {isOwner ? "ADMIN" : isManager ? "MANAGER" : isOrganizer ? "ORGANIZER" : "ATTENDEE"}
                </Badge>
              )}
              
              {/* "My Badges" */}
              {accountId && (
                <Button as={RouterLink} to="/my-badges" colorScheme="teal" size="sm">
                  My Badges
                </Button>
              )}

              {isOwner && (
                <Button as={RouterLink} to="/admin" colorScheme="purple" size="sm">
                  Admin Panel
                </Button>
              )}
              
              {isManager && !isOwner && (
                <Button as={RouterLink} to="/manager" colorScheme="blue" size="sm">
                  Manager Panel
                </Button>
              )}
              
              {accountId ? (
                <Button onClick={handleSignOut}>Log out ({accountId.substring(0,6)}...)</Button>
              ) : (
                <Button colorScheme="blue" onClick={handleSignIn}>Log in</Button>
              )}
            </HStack>
          </Flex>

          {/* Routes */}
          <Routes>
            <Route path="/" element={
              <DashboardPage
                events={events}
                loadingEvents={loadingEvents}
                isOwner={isOwner}
                isOrganizer={isOrganizer}
                handleCreate={handleCreate}
                creating={creating}
                name={name}
                setName={setName}
                description={description}
                setDescription={setDescription}
                handleClaim={handleClaim}
                claiming={claiming}
                claimEventName={claimEventName}
                setClaimEventName={setClaimEventName}
                accountId={accountId}
                handleDeleteEvent={handleDeleteEvent}
                sendTransaction={sendTransaction}
              />
            } />

            {/* Route  /my-badges */}
            <Route path="/my-badges" element={<MyBadgesPage />} />

            <Route path="/event/:eventName" element={
              <WhitelistManagerPage
                callViewWithFallback={callViewWithFallback}
                sendTransaction={sendTransaction}
                selector={selector}
                contractId={ContractName}
              />
            } />
            <Route path="/admin" element={
              <AdminPage
                callViewWithFallback={callViewWithFallback}
                sendTransaction={sendTransaction}
                selector={selector}
                contractId={ContractName}
              />
            } />
            <Route path="/manager" element={
              <ManagerPage
                callViewWithFallback={callViewWithFallback}
                sendTransaction={sendTransaction}
                selector={selector}
                contractId={ContractName}
              />
            } />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}
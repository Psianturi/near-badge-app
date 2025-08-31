// src/App.jsx
import React, { useEffect, useState } from "react";
import { useWalletSelector } from "./contexts/WalletSelectorContext.jsx";
import { ContractName, NetworkId } from "./config.js";

// 1. Tambahkan 'Image' dari Chakra UI
import {
  Box, Button, Container, FormControl, FormLabel, Heading, Input, Text, Textarea, VStack, Link,
  Alert, Flex, Spacer, Badge, HStack, Divider, List, ListItem, ListIcon, useToast, Image
} from "@chakra-ui/react";
import { InfoIcon, CheckCircleIcon } from "@chakra-ui/icons";

// 2. Import file logo dari folder assets
import NearLogo from "./assets/near_logo.svg";

/**
 * Gas / deposit helpers
 */
const GAS = "30000000000000"; // 30 TGas
const NO_DEPOSIT = "0";
const DEPOSIT_FOR_BADGE = "100000000000000000000000"; // 0.1 NEAR

/**
 * Helper: generic view call
 */
async function callViewWithFallback(selector, contractId, method, args = {}) {
  // ... (Fungsi ini tidak berubah, sudah optimal)
  try {
    if (selector && selector.isSignedIn()) {
      const wallet = await selector.wallet();
      if (wallet && typeof wallet.viewMethod === "function") {
        return await wallet.viewMethod({ contractId, method, args });
      }
    }
  } catch (e) { console.warn("Falling back to RPC due to wallet.viewMethod error:", e); }
  try {
    const rpcUrl = NetworkId === "testnet" ? "https://rpc.testnet.near.org" : "https://rpc.mainnet.near.org";
    const resp = await fetch(rpcUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: "dontcare", method: "query",
        params: {
          request_type: "call_function", finality: "optimistic", account_id: contractId,
          method_name: method, args_base64: btoa(JSON.stringify(args)),
        },
      }),
    });
    const json = await resp.json();
    if (json.error) throw new Error(JSON.stringify(json.error));
    const bytes = json.result?.result;
    if (!bytes) return null;
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bytes)));
  } catch (e) { console.error("RPC fallback failed:", e); throw e; }
}

/**
 * Komponen kecil untuk menampilkan link explorer di dalam notifikasi toast.
 * Ini membuat kode lebih bersih.
 */
const ExplorerLink = ({ txId }) => (
  <Link
    href={`https://explorer.testnet.near.org/transactions/${txId}`}
    isExternal
    color="cyan.200"
    textDecoration="underline"
    mt={2}
    display="block"
  >
    View Transaction on Explorer
  </Link>
);


export default function App() {
  const { selector, modal, accountId } = useWalletSelector();
  const toast = useToast();

  const [mode, setMode] = useState("claim");
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [claimEventName, setClaimEventName] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    const load = async () => {
      // ... (useEffect tidak berubah, sudah optimal)
      if (!selector) return;
      setLoadingEvents(true);
      try {
        const evsPromise = callViewWithFallback(selector, ContractName, "get_all_events", {});
        let rolesPromise = Promise.resolve([false, false]);
        if (accountId) {
          rolesPromise = Promise.all([
            callViewWithFallback(selector, ContractName, "is_owner", { account_id: accountId }),
            callViewWithFallback(selector, ContractName, "is_organizer", { account_id: accountId })
          ]);
        }
        const [evs, [ownerCheck, orgCheck]] = await Promise.all([evsPromise, rolesPromise]);
        setEvents(Array.isArray(evs) ? evs : []);
        setIsOwner(Boolean(ownerCheck));
        setIsOrganizer(Boolean(orgCheck));
      } catch (e) {
        console.error("Failed to fetch events/roles:", e);
        toast({ title: "Failed to load data", description: String(e), status: "error" });
        setEvents([]); setIsOwner(false); setIsOrganizer(false);
      } finally { setLoadingEvents(false); }
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
    try {
      const result = await sendTransaction([{
        type: "FunctionCall",
        params: { methodName: "create_event", args: { name, description }, gas: GAS, deposit: NO_DEPOSIT },
      }]);
      
      const txId = result.transaction_outcome?.id || result.transaction?.hash;

      toast({
        duration: 9000, isClosable: true,
        render: () => (
          <Box color="white" p={4} bg="green.500" borderRadius="md" boxShadow="lg">
            <Text fontWeight="bold">Event Created Successfully!</Text>
            {txId && <ExplorerLink txId={txId} />}
          </Box>
        ),
      });

      const evs = await callViewWithFallback(selector, ContractName, "get_all_events", {});
      setEvents(Array.isArray(evs) ? evs : []);
      setName(""); setDescription("");
    } catch (e) {
      toast({ title: "Error creating event", description: (e?.message) || String(e), status: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleClaim = async () => {
    if (!claimEventName) return toast({ status: "warning", title: "Fill event name or paste magic link" });
    setClaiming(true);
    try {
      const result = await sendTransaction([{
        type: "FunctionCall",
        params: { methodName: "claim_badge", args: { event_name: claimEventName }, gas: GAS, deposit: DEPOSIT_FOR_BADGE, },
      }]);
      
      const txId = result.transaction_outcome?.id || result.transaction?.hash;

      toast({
        duration: 9000, isClosable: true,
        render: () => (
          <Box color="white" p={4} bg="teal.500" borderRadius="md" boxShadow="lg">
            <Text fontWeight="bold">Claim Request Successful!</Text>
            {txId && <ExplorerLink txId={txId} />}
          </Box>
        ),
      });
      setClaimEventName("");
    } catch (e) {
      toast({ title: "Error claiming badge", description: (e?.message) || String(e), status: "error" });
    } finally {
      setClaiming(false);
    }
  };

  const handleSignIn = () => modal.show();
  const handleSignOut = async () => {
    const wallet = await selector.wallet();
    wallet.signOut();
  };

  return (
    <Box bg="gray.50" minH="100vh" py={[4, 8, 12]}>
      <Container maxW="container.md">
        <Flex mb={6} align="center">
          {/* 3. Header diperbarui dengan Logo dan Judul di dalam HStack */}
          <HStack spacing={4}>
            <Image src={NearLogo} boxSize="40px" alt="NEAR Protocol Logo" />
            <Box>
              <Heading as="h1" size="lg">NEAR Badge Manager</Heading>
              <Text color="gray.500">Contract: <Text as="span" fontWeight="600">{ContractName}</Text> <Text as="span" color="gray.400">({NetworkId})</Text></Text>
            </Box>
          </HStack>
          <Spacer />
          <HStack spacing={3}>
            {accountId && (
              <Badge colorScheme={isOwner ? "green" : isOrganizer ? "yellow" : "gray"}>
                {isOwner ? "ADMIN" : isOrganizer ? "ORGANIZER" : "ATTENDEE"}
              </Badge>
            )}
            <Box>
              {accountId ? (
                <Button onClick={handleSignOut}>Log out ({accountId.substring(0, 10)}...)</Button>
              ) : (
                <Button colorScheme="blue" onClick={handleSignIn}>Log in</Button>
              )}
            </Box>
          </HStack>
        </Flex>

        <HStack mb={6}>
          <Button variant={mode === "claim" ? "solid" : "outline"} colorScheme="teal" onClick={() => setMode("claim")}>Claim Badge</Button>
          <Button variant={mode === "create" ? "solid" : "outline"} colorScheme="green" onClick={() => setMode("create")} isDisabled={!accountId || (!isOwner && !isOrganizer)}>Create Event</Button>
        </HStack>

        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="md">
          {mode === "create" ? (
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md">Create a New Event</Heading>
              <FormControl isRequired>
                <FormLabel>Event Name</FormLabel>
                <Input placeholder="e.g., NEAR Dev Community Meetup" value={name} onChange={(e) => setName(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea placeholder="A short description of the event." value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormControl>
              <Button colorScheme="green" onClick={handleCreate} isLoading={creating}>Create Event</Button>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md">Claim a Badge</Heading>
              <FormControl>
                <FormLabel>Event name or magic link</FormLabel>
                <Input placeholder="Enter event name or paste magic link" value={claimEventName} onChange={(e) => setClaimEventName(e.target.value)} />
              </FormControl>
              <Button colorScheme="teal" onClick={handleClaim} isLoading={claiming}>Claim Badge</Button>
            </VStack>
          )}

          <Divider my={6} />

          <Heading as="h3" size="md" mb={3}>Available Events</Heading>
          {loadingEvents ? (
            <Text>Loading events...</Text>
          ) : events.length > 0 ? (
            <List spacing={2}>
              {events.map(([eventName, ev]) => (
                <ListItem key={eventName} p={3} borderRadius="md" _hover={{ bg: "gray.50" }}>
                  <HStack align="start">
                    <ListIcon as={CheckCircleIcon} color="green.500" mt={1} />
                    <Box>
                      <Text fontWeight="bold">{eventName}</Text>
                      <Text as="span" color="gray.600" fontSize="sm">{ev.description}</Text>
                    </Box>
                  </HStack>
                </ListItem>
              ))}
            </List>
          ) : (
            <Text color="gray.500">No events found. Create one to get started!</Text>
          )}
        </Box>
      </Container>
    </Box>
  );
}

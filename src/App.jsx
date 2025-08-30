// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useWalletSelector } from "./contexts/WalletSelectorContext.jsx";
import { ContractName, NetworkId } from "./config.js";
import {
  Box, Button, Flex, Spacer, VStack, Heading, Text, Alert, Link,
  FormControl, FormLabel, Input, Textarea, Divider, List, ListItem, ListIcon,
  HStack, useToast, Badge
} from "@chakra-ui/react";
import { InfoIcon, CheckCircleIcon } from "@chakra-ui/icons";

const GAS = "30000000000000"; // 30 TGas

// ---- tiny RPC helper for view calls (no near-api-js needed) ----
const getNodeUrl = (networkId) =>
  networkId === "testnet"
    ? "https://rpc.testnet.near.org"
    : networkId === "mainnet"
    ? "https://rpc.mainnet.near.org"
    : "http://localhost:3030";

async function viewFunction({ networkId, contractId, method, args = {} }) {
  const nodeUrl = getNodeUrl(networkId);
  const res = await fetch(nodeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "dontcare",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: contractId,
        method_name: method,
        args_base64: btoa(JSON.stringify(args)),
        finality: "optimistic",
      },
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.data || json.error.message);
  const resultBytes = json.result.result;
  const text = new TextDecoder().decode(Uint8Array.from(resultBytes));
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function App() {
  const toast = useToast();
  const { selector, modal, accountId } = useWalletSelector();

  // UI mode: "claim" (default) or "create"
  const [mode, setMode] = useState("claim");

  // form states
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [claimEvent, setClaimEvent] = useState("");

  // owner/admin
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [newOrganizer, setNewOrganizer] = useState("");

  // lists / loading
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [busy, setBusy] = useState(false);

  // read ?event=... for magic-link style prefill
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromLink = params.get("event");
    if (fromLink) {
      setClaimEvent(fromLink);
      setMode("claim");
    }
  }, []);

  // role detection + events load
  useEffect(() => {
    if (!selector) return;

    const boot = async () => {
      setLoadingEvents(true);
      try {
        // role (organizer)
        if (accountId) {
          try {
            const org = await viewFunction({
              networkId: NetworkId,
              contractId: ContractName,
              method: "is_organizer",
              args: { account_id: accountId },
            });
            setIsOrganizer(!!org);
          } catch {
            setIsOrganizer(false);
          }

          // owner check — only if contract exposes `get_owner`
          try {
            const owner = await viewFunction({
              networkId: NetworkId,
              contractId: ContractName,
              method: "get_owner",
              args: {},
            });
            setIsOwner(owner === accountId);
          } catch {
            // contract belum expose get_owner: sembunyikan panel owner
            setIsOwner(false);
          }
        } else {
          setIsOrganizer(false);
          setIsOwner(false);
        }

        // load events
        try {
          const list = await viewFunction({
            networkId: NetworkId,
            contractId: ContractName,
            method: "get_all_events",
          });
          setEvents(Array.isArray(list) ? list : []);
        } catch (e) {
          console.error("get_all_events failed", e);
          setEvents([]);
        }
      } finally {
        setLoadingEvents(false);
      }
    };

    boot();
  }, [selector, accountId]);

  // default mode: organizer starts on "create", others on "claim"
  useEffect(() => {
    if (accountId) {
      setMode(isOrganizer ? "create" : "claim");
    } else {
      setMode("claim");
    }
  }, [accountId, isOrganizer]);

  const handleSignIn = () => modal.show();
  const handleSignOut = async () => {
    const wallet = await selector.wallet();
    await wallet.signOut();
  };

  const refreshEvents = async () => {
    try {
      const list = await viewFunction({
        networkId: NetworkId,
        contractId: ContractName,
        method: "get_all_events",
      });
      setEvents(Array.isArray(list) ? list : []);
    } catch {
      setEvents([]);
    }
  };

  const notify = (title, status = "success") =>
    toast({ title, status, isClosable: true, duration: 3000 });

  const createEvent = async () => {
    if (!eventName.trim() || !eventDescription.trim()) {
      notify("Please fill in both name and description.", "warning");
      return;
    }
    setBusy(true);
    try {
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: ContractName,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "create_event",
              args: { name: eventName.trim(), description: eventDescription.trim() },
              gas: GAS,
              deposit: "0",
            },
          },
        ],
      });
      notify(`Event "${eventName}" created!`);
      setEventName("");
      setEventDescription("");
      await refreshEvents();
    } catch (e) {
      console.error(e);
      notify(e.message || "Failed to create event", "error");
    } finally {
      setBusy(false);
    }
  };

  const claimBadge = async () => {
    if (!claimEvent.trim()) {
      notify("Please input an event name (or open via magic link).", "warning");
      return;
    }
    setBusy(true);
    try {
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: ContractName,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "claim_badge",
              args: { event_name: claimEvent.trim() },
              gas: GAS,
              // contract kamu tidak mensyaratkan deposit; set 0.
              deposit: "0",
            },
          },
        ],
      });
      notify(`Badge claimed for "${claimEvent}"!`);
      setClaimEvent("");
    } catch (e) {
      console.error(e);
      notify(e.message || "Failed to claim badge", "error");
    } finally {
      setBusy(false);
    }
  };

  const addOrganizer = async () => {
    if (!newOrganizer.trim()) {
      notify("Please enter the organizer account ID.", "warning");
      return;
    }
    setBusy(true);
    try {
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: ContractName,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "add_organizer",
              args: { account_id: newOrganizer.trim() },
              gas: GAS,
              deposit: "0",
            },
          },
        ],
      });
      notify(`Added organizer: ${newOrganizer}`);
      setNewOrganizer("");
      // optional: re-check role if you just added yourself in another contract
      if (newOrganizer.trim() === accountId) setIsOrganizer(true);
    } catch (e) {
      console.error(e);
      notify(e.message || "Failed to add organizer", "error");
    } finally {
      setBusy(false);
    }
  };

  const headerRight = useMemo(
    () => (
      <Box>
        {accountId ? (
          <HStack spacing={2}>
            {isOwner && <Badge colorScheme="purple">Owner</Badge>}
            {isOrganizer && <Badge colorScheme="green">Organizer</Badge>}
            <Button size="sm" onClick={handleSignOut}>
              Log out ({accountId.substring(0, 10)}…)
            </Button>
          </HStack>
        ) : (
          <Button colorScheme="blue" onClick={handleSignIn}>
            Log in
          </Button>
        )}
      </Box>
    ),
    [accountId, isOwner, isOrganizer]
  );

  return (
    <Flex as="main" align="center" justify="center" minH="100vh" bg="gray.50" p={4}>
      <Box w="full" maxW="container.lg" bg="white" p={8} borderWidth="1px" borderRadius="xl" boxShadow="lg">
        <Flex mb={8} align="center">
          <Box>
            <Heading as="h1" size="lg">NEAR Badge Manager</Heading>
            <Text color="gray.500">
              Contract: <b>{ContractName}</b> ({NetworkId})
            </Text>
          </Box>
          <Spacer />
          {headerRight}
        </Flex>

        {/* Mode switch */}
        <HStack spacing={3} mb={6}>
          <Button
            variant={mode === "claim" ? "solid" : "outline"}
            colorScheme="teal"
            onClick={() => setMode("claim")}
          >
            Claim Badge
          </Button>
          <Button
            variant={mode === "create" ? "solid" : "outline"}
            colorScheme="green"
            onClick={() => setMode("create")}
            isDisabled={!isOrganizer}
            title={!isOrganizer ? "Only organizers can create events" : ""}
          >
            Create Event
          </Button>
        </HStack>

        {!accountId && (
          <Alert status="info" borderRadius="md" mb={6}>
            <InfoIcon mr={3} />
            Please log in to interact with the contract.
          </Alert>
        )}

        {/* Claim Badge */}
        <VStack spacing={4} align="stretch" hidden={mode !== "claim"}>
          <Heading as="h2" size="md">Claim your badge</Heading>
          <FormControl isRequired>
            <FormLabel>Event Name (or from magic link)</FormLabel>
            <Input
              placeholder="e.g., NEAR Dev Community Meetup"
              value={claimEvent}
              onChange={(e) => setClaimEvent(e.target.value)}
              isDisabled={busy || !accountId}
            />
          </FormControl>
          <Button colorScheme="teal" onClick={claimBadge} isLoading={busy} isDisabled={!accountId}>
            Claim Badge
          </Button>
        </VStack>

        {/* Create Event (organizers) */}
        <VStack spacing={4} align="stretch" hidden={mode !== "create"} mt={mode === "create" ? 0 : -9999}>
          <Heading as="h2" size="md">Create a New Event</Heading>
          <FormControl isRequired>
            <FormLabel>Event Name</FormLabel>
            <Input
              placeholder="e.g., NEAR Dev Community Meetup"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              isDisabled={busy || !isOrganizer}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Textarea
              placeholder="A short description of the event."
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              isDisabled={busy || !isOrganizer}
            />
          </FormControl>
          <Button colorScheme="green" onClick={createEvent} isLoading={busy} isDisabled={!isOrganizer}>
            Create Event
          </Button>
        </VStack>

        {/* Owner panel */}
        {isOwner && (
          <>
            <Divider my={8} />
            <VStack spacing={4} align="stretch">
              <Heading as="h3" size="sm">Owner Tools</Heading>
              <FormControl>
                <FormLabel>Add Organizer (account ID)</FormLabel>
                <HStack>
                  <Input
                    placeholder="example.testnet"
                    value={newOrganizer}
                    onChange={(e) => setNewOrganizer(e.target.value)}
                    isDisabled={busy}
                  />
                  <Button onClick={addOrganizer} isLoading={busy}>
                    Add
                  </Button>
                </HStack>
              </FormControl>
            </VStack>
          </>
        )}

        <Divider my={8} />

        {/* Events list */}
        <VStack spacing={4} align="stretch">
          <Heading as="h3" size="md">Available Events</Heading>
          {loadingEvents ? (
            <Text>Loading events from the blockchain...</Text>
          ) : events?.length > 0 ? (
            <List spacing={3}>
              {events.map(([name, details]) => (
                <ListItem key={name} p={2} _hover={{ bg: "gray.50" }} borderRadius="md">
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  <strong>{name}</strong>{" "}
                  <Text as="span" color="gray.600">— {details?.description}</Text>
                </ListItem>
              ))}
            </List>
          ) : (
            <Text color="gray.500">No events found. Create one to get started!</Text>
          )}
        </VStack>

        {/* (optional) tx success banner could live here if you store explorer URL */}
      </Box>
    </Flex>
  );
}

export default App;

// src/App.jsx

import React, { useState } from 'react';
import { useWalletSelector } from './contexts/WalletSelectorContext.jsx';
import { ContractName } from './config.js';
import {
  Box, Button, Container, FormControl, FormLabel, Heading, Input,
  Text, Textarea, VStack, Link, Alert, Flex, Spacer
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

const GAS = "30000000000000"; // 30 TGas
// const DEPOSIT = "100000000000000000000000"; // 0.1 NEAR | 

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
              // Pastikan Anda menyertakan 'deposit' jika method contract membutuhkannya
              args: { name: eventName, description: eventDescription },
              gas: GAS,
              deposit: "0", // Atau DEPOSIT jika diperlukan
            },
          },
        ],
      });

      const txId = result.transaction_outcome?.id || result.transaction?.hash;
      const txUrl = `https://explorer.testnet.near.org/transactions/${txId}`;
      setTransaction(txUrl);

      alert(`Event "${eventName}" created successfully!`);

      setEventName('');
      setEventDescription('');
    } catch (e) {
      const errorMessage = e?.kind?.ExecutionError || e.message || "Unknown error";
      alert(`Error creating event: ${errorMessage}`);
      console.error("Error creating event:", e);
    } finally {
      setShowSpinner(false);
    }
  };

  const handleSignIn = () => modal.show();
  const handleSignOut = async () => {
    const wallet = await selector.wallet();
    wallet.signOut();
  };

  return (
    // 1. Flex container utama untuk menengahkan konten
    <Flex
      as="main"
      align="center"
      justify="center"
      minH="100vh" // Tinggi minimal sebesar layar
      bg="gray.50" // Warna latar belakang halaman
      p={4}
    >
      {/* 2. Box yang berfungsi sebagai "kartu" konten */}
      <Box
        w="full"
        maxW="container.md" // Lebar maksimum konten
        bg="white"
        p={8}
        borderWidth="1px"
        borderRadius="xl" // Sudut lebih tumpul
        boxShadow="lg" // Efek bayangan
      >
        <Flex mb={8} align="center">
          <Box>
            <Heading as="h1" size="lg">NEAR Badge Manager</Heading>
            <Text color="gray.500">Create and manage your community events on NEAR.</Text>
          </Box>
          <Spacer />
          <Box>
            {accountId ? (
              <Button colorScheme="gray" onClick={handleSignOut}>
                Log out ({accountId.substring(0, 10)}...)
              </Button>
            ) : (
              <Button colorScheme="blue" onClick={handleSignIn}>
                Log in
              </Button>
            )}
          </Box>
        </Flex>

        <main>
          {accountId ? (
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md">Create a New Event</Heading>
              <Text fontSize="sm" color="gray.600">Contract: <strong>{ContractName}</strong></Text>

              <FormControl isRequired>
                <FormLabel>Event Name</FormLabel>
                <Input
                  placeholder="e.g., NEAR Dev Community Meetup"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  isDisabled={showSpinner}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="A short description of the event."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  isDisabled={showSpinner}
                />
              </FormControl>

              <Button
                colorScheme="green"
                onClick={handleCreateEvent}
                isLoading={showSpinner}
                loadingText="Creating..."
              >
                Create Event
              </Button>
            </VStack>
          ) : (
            <Alert status="info" borderRadius="md">
              <InfoIcon mr={3} />
              Please log in to create an event.
            </Alert>
          )}

          {transaction && (
            <Alert status="success" mt={4} borderRadius="md">
              <InfoIcon mr={3} />
              <Box>
                <Text>Transaction successful!</Text>
                <Link href={transaction} isExternal color="teal.500">
                  View Transaction on Explorer
                </Link>
              </Box>
            </Alert>
          )}
        </main>
      </Box>
    </Flex>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import Papa from 'papaparse';
import {
  Box, Button, Heading, VStack, HStack, Input, Text, useToast,
  List, ListItem, ListIcon, Progress, Alert, AlertIcon, Code
} from "@chakra-ui/react";
import { ArrowBackIcon, CheckCircleIcon } from '@chakra-ui/icons';

// Kita akan meneruskan fungsi-fungsi ini dari App.jsx
export default function WhitelistManagerPage({ callViewWithFallback, sendTransaction, selector, contractId }) {
  const { eventName } = useParams(); // Mengambil nama event dari URL
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [whitelist, setWhitelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualAddress, setManualAddress] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchWhitelist = async () => {
    try {
      setLoading(true);
      const result = await callViewWithFallback(selector, contractId, 'get_whitelist', { event_name: eventName });
      setWhitelist(Array.isArray(result) ? result : []);
    } catch (e) {
      toast({ title: "Error fetching whitelist", description: e.message, status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
  }, [eventName]);

  const handleAddManual = async () => {
    if (!manualAddress || (!manualAddress.endsWith('.near') && !manualAddress.endsWith('.testnet'))) {
      return toast({ title: "Invalid NEAR address", status: "warning" });
    }
    setIsAdding(true);
    try {
      await sendTransaction([{
        type: "FunctionCall",
        params: {
          methodName: 'add_to_whitelist',
          args: { event_name: eventName, account_ids: [manualAddress] },
          gas: "30000000000000",
          deposit: "0",
        }
      }]);
      toast({ title: "Address added successfully!", status: "success" });
      setManualAddress("");
      fetchWhitelist(); // Refresh list
    } catch (e) {
      toast({ title: "Error adding address", description: e.message, status: "error" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const walletColumnKey = Object.keys(results.data[0]).find(key => key.toLowerCase().includes('near wallet'));
        if (!walletColumnKey) {
          return toast({ title: "CSV Error", description: "Could not find a column with 'NEAR Wallet' in the header.", status: "error" });
        }

        const addresses = results.data
          .map(row => row[walletColumnKey]?.trim())
          .filter(addr => addr && (addr.endsWith('.near') || addr.endsWith('.testnet')));

        if (addresses.length === 0) {
          return toast({ title: "No valid addresses found in CSV", status: "warning" });
        }
        
        batchUpload(addresses);
      },
    });
  };

  const batchUpload = async (addresses) => {
    const batchSize = 50; // Kirim 50 alamat per transaksi
    const numBatches = Math.ceil(addresses.length / batchSize);
    setUploadProgress(1);

    for (let i = 0; i < numBatches; i++) {
      const batch = addresses.slice(i * batchSize, (i + 1) * batchSize);
      try {
        await sendTransaction([{
          type: "FunctionCall",
          params: {
            methodName: 'add_to_whitelist',
            args: { event_name: eventName, account_ids: batch },
            gas: "300000000000000", // Gas lebih tinggi untuk batch besar
            deposit: "0",
          }
        }]);
        setUploadProgress(((i + 1) / numBatches) * 100);
      } catch (e) {
        toast({ title: `Error uploading batch ${i + 1}`, description: e.message, status: "error" });
        setUploadProgress(0);
        return;
      }
    }

    toast({ title: "CSV upload complete!", description: `${addresses.length} addresses added.`, status: "success" });
    setTimeout(() => {
        fetchWhitelist(); // Refresh list
        setUploadProgress(0);
    }, 1000);
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="md">
      <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="link" mb={4}>Back to Dashboard</Button>
      <Heading size="lg" mb={4}>Manage Attendees</Heading>
      <Text mb={6}>For event: <Code>{eventName}</Code></Text>
      
      <VStack spacing={6} align="stretch">
        {/* Manual Add Section */}
        <Box>
          <Heading size="md" mb={2}>Add Manually</Heading>
          <HStack>
            <Input placeholder="late-attendee.testnet" value={manualAddress} onChange={e => setManualAddress(e.target.value)} />
            <Button onClick={handleAddManual} isLoading={isAdding} colorScheme="blue">Add Attendee</Button>
          </HStack>
        </Box>

        {/* CSV Upload Section */}
        <Box>
          <Heading size="md" mb={2}>Upload from Luma CSV</Heading>
          <Alert status="info" mb={3} borderRadius="md">
            <AlertIcon />
            Ensure your Luma CSV has a column with the header "What is your NEAR Wallet ID?".
          </Alert>
          <Input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          <Button onClick={() => fileInputRef.current.click()} colorScheme="purple" w="100%">Upload CSV</Button>
          {uploadProgress > 0 && <Progress value={uploadProgress} size="sm" mt={2} colorScheme="purple" />}
        </Box>
        
        {/* Whitelist Display Section */}
        <Box>
          <Heading size="md" mb={2}>Current Whitelist ({whitelist.length})</Heading>
          {loading ? <Text>Loading...</Text> : (
            <List spacing={2} maxHeight="300px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md">
              {whitelist.map(addr => <ListItem key={addr}><ListIcon as={CheckCircleIcon} color="green.500" />{addr}</ListItem>)}
            </List>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

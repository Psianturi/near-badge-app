import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Heading, VStack, HStack, Input, Text, useToast,
  List, ListItem, ListIcon, Code, Spinner
} from "@chakra-ui/react";
import { ArrowBackIcon, CheckCircleIcon } from '@chakra-ui/icons';

export default function ManagerPage({ callViewWithFallback, sendTransaction, selector, contractId }) {
  const toast = useToast();
  
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrganizer, setNewOrganizer] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Fungsi untuk mengambil daftar organizer dari kontrak
  const fetchOrganizers = async () => {
    setLoading(true);
    try {
      const orgs = await callViewWithFallback(selector, contractId, "get_organizers");
      setOrganizers(Array.isArray(orgs) ? orgs : []);
    } catch (e) {
      toast({ title: "Failed to load organizers", description: String(e), status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

 
  const handleAddOrganizer = async () => {
    if (!newOrganizer) {
      return toast({ title: "Please enter an account ID", status: "warning" });
    }
    setIsAdding(true);
    try {
      await sendTransaction([{
        type: "FunctionCall",
        params: {
          methodName: "add_organizer",
          args: { account_id: newOrganizer },
          gas: "30000000000000",
          deposit: "0",
        }
      }]);
      toast({ title: "Organizer added successfully!", status: "success" });
      setNewOrganizer("");
      await fetchOrganizers();
    } catch (e) {
      toast({ title: "Error adding organizer", description: String(e), status: "error" });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="md">
      <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="link" mb={4}>
        Back to Dashboard
      </Button>
      <Heading size="lg" mb={6}>Manager Panel</Heading>
      
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md" mb={2}>Add New Organizer</Heading>
          <HStack>
            <Input 
              placeholder="new-organizer.testnet" 
              value={newOrganizer} 
              onChange={e => setNewOrganizer(e.target.value)} 
            />
            <Button onClick={handleAddOrganizer} isLoading={isAdding} colorScheme="blue">
              Add Organizer
            </Button>
          </HStack>
        </Box>
        
        <Box>
          <Heading size="md" mb={2}>Current Organizers ({organizers.length})</Heading>
          {loading ? <Spinner /> : (
            <List spacing={2} p={2} borderWidth="1px" borderRadius="md" minH="100px">
              {organizers.length > 0 ? (
                organizers.map(addr => <ListItem key={addr}><ListIcon as={CheckCircleIcon} color="green.500" />{addr}</ListItem>)
              ) : (
                <Text color="gray.500" p={2}>No organizers found.</Text>
              )}
            </List>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
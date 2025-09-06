// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Heading, VStack, HStack, Input, Text, useToast,
  List, ListItem, ListIcon, Code, Spinner
} from "@chakra-ui/react";
import { ArrowBackIcon, CheckCircleIcon } from '@chakra-ui/icons';

export default function AdminPage({ callViewWithFallback, sendTransaction, selector, contractId }) {
  const toast = useToast();
  
  const [organizers, setOrganizers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrganizer, setNewOrganizer] = useState("");
  const [newManager, setNewManager] = useState("");
  const [isAddingOrganizer, setIsAddingOrganizer] = useState(false);
  const [isAddingManager, setIsAddingManager] = useState(false);

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

  // Fungsi untuk mengambil daftar manager dari kontrak
  const fetchManagers = async () => {
    setLoading(true);
    try {
      const mgrs = await callViewWithFallback(selector, contractId, "get_managers");
      setManagers(Array.isArray(mgrs) ? mgrs : []);
    } catch (e) {
      toast({ title: "Failed to load managers", description: String(e), status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
    fetchManagers();
  }, []);

  // ✅ Add Organizer
  const handleAddOrganizer = async () => {
    if (!newOrganizer) {
      return toast({ title: "Please enter an account ID", status: "warning" });
    }
    setIsAddingOrganizer(true);
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
      setIsAddingOrganizer(false);
    }
  };

  // ✅ Add Manager (hanya bisa dipanggil oleh owner)
  const handleAddManager = async () => {
    if (!newManager) {
      return toast({ title: "Please enter an account ID", status: "warning" });
    }
    setIsAddingManager(true);
    try {
      await sendTransaction([{
        type: "FunctionCall",
        params: {
          methodName: "add_manager",
          args: { account_id: newManager },
          gas: "30000000000000",
          deposit: "0",
        }
      }]);
      toast({ title: "Manager added successfully!", status: "success" });
      setNewManager("");
      await fetchManagers();
    } catch (e) {
      toast({ title: "Error adding manager", description: String(e), status: "error" });
    } finally {
      setIsAddingManager(false);
    }
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="md">
      <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="link" mb={4}>
        Back to Dashboard
      </Button>
      <Heading size="lg" mb={6}>Admin Panel</Heading>
      
      <VStack spacing={8} align="stretch">
        {/* Add Organizer */}
        <Box>
          <Heading size="md" mb={2}>Add New Organizer</Heading>
          <HStack>
            <Input 
              placeholder="new-organizer.testnet" 
              value={newOrganizer} 
              onChange={e => setNewOrganizer(e.target.value)} 
            />
            <Button onClick={handleAddOrganizer} isLoading={isAddingOrganizer} colorScheme="blue">
              Add Organizer
            </Button>
          </HStack>
        </Box>

        {/* Current Organizers */}
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

        {/* Add Manager */}
        <Box>
          <Heading size="md" mb={2}>Add New Manager</Heading>
          <HStack>
            <Input 
              placeholder="new-manager.testnet" 
              value={newManager} 
              onChange={e => setNewManager(e.target.value)} 
            />
            <Button onClick={handleAddManager} isLoading={isAddingManager} colorScheme="purple">
              Add Manager
            </Button>
          </HStack>
        </Box>

        {/* Current Managers */}
        <Box>
          <Heading size="md" mb={2}>Current Managers ({managers.length})</Heading>
          {loading ? <Spinner /> : (
            <List spacing={2} p={2} borderWidth="1px" borderRadius="md" minH="100px">
              {managers.length > 0 ? (
                managers.map(addr => <ListItem key={addr}><ListIcon as={CheckCircleIcon} color="blue.500" />{addr}</ListItem>)
              ) : (
                <Text color="gray.500" p={2}>No managers found.</Text>
              )}
            </List>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
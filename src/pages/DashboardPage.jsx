import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Heading, Input, Textarea, VStack,
  HStack, Divider, useToast,
} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import { EventList } from "../components/EventList.jsx";

const ClaimView = ({ handleClaim, claiming, claimEventName, setClaimEventName }) => (
  <VStack spacing={4} align="stretch">
    <Heading as="h2" size="md">Claim a Badge</Heading>
    <FormControl>
      <FormLabel>Event name or magic link</FormLabel>
      <Input
        placeholder="Enter event name or paste magic link"
        value={claimEventName}
        onChange={(e) => setClaimEventName(e.target.value)}
      />
    </FormControl>
    <Button colorScheme="teal" onClick={handleClaim} isLoading={claiming}>
      Claim Badge
    </Button>
  </VStack>
);

const CreateEventView = ({ handleCreate, creating, name, setName, description, setDescription }) => (
  <VStack spacing={4} align="stretch">
    <Heading as="h2" size="md">Create a New Event</Heading>
    <FormControl isRequired>
      <FormLabel>Event Name</FormLabel>
      <Input
        placeholder="e.g., NEAR Dev Community Meetup"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </FormControl>
    <FormControl isRequired>
      <FormLabel>Description</FormLabel>
      <Textarea
        placeholder="A short description of the event."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </FormControl>
    <Button colorScheme="green" onClick={handleCreate} isLoading={creating}>
      Create Event
    </Button>
  </VStack>
);

export default function DashboardPage({
  events,
  loadingEvents,
  isOwner,
  isOrganizer,
  isAdmin,
  handleCreate,
  creating,
  name,
  setName,
  description,
  setDescription,
  handleClaim,
  claiming,
  claimEventName,
  setClaimEventName,
  accountId,
  handleDeleteEvent,
  sendTransaction,
}) {
  const [mode, setMode] = useState("claim");
  const navigate = useNavigate();
  const toast = useToast();

  const onManageWhitelist = (eventName) => {
    navigate(`/event/${eventName}`);
  };

  // ✅ Fungsi: Tambah Admin (hanya bisa dipanggil oleh owner via tombol)
  const handleAddAdmin = async () => {
    const newAdminId = prompt("Enter the account ID to make admin:");
    if (!newAdminId || !newAdminId.endsWith(".testnet")) {
      toast({
        title: "Invalid account ID",
        description: "Please enter a valid .testnet account",
        status: "warning",
      });
      return;
    }

    try {
      await sendTransaction([
        {
          type: "FunctionCall",
          params: {
            methodName: "add_admin",
            args: { account_id: newAdminId },
            gas: "30000000000000",
            deposit: "0",
          },
        },
      ]);

      toast({
        title: "Admin added successfully!",
        description: `${newAdminId} is now an admin.`,
        status: "success",
      });
    } catch (e) {
      toast({
        title: "Failed to add admin",
        description: e.message || "Transaction failed",
        status: "error",
      });
    }
  };

  // ✅ Fungsi: Tambah Organizer (bisa dipanggil oleh owner dan admin)
  const handleAddOrganizer = async () => {
    const organizerId = prompt("Enter the account ID to make organizer:");
    if (!organizerId || !organizerId.endsWith(".testnet")) {
      toast({
        title: "Invalid account ID",
        description: "Please enter a valid .testnet account",
        status: "warning",
      });
      return;
    }

    try {
      await sendTransaction([
        {
          type: "FunctionCall",
          params: {
            methodName: "add_organizer",
            args: { account_id: organizerId },
            gas: "30000000000000",
            deposit: "0",
          },
        },
      ]);

      toast({
        title: "Organizer added successfully!",
        description: `${organizerId} is now an organizer.`,
        status: "success",
      });
    } catch (e) {
      toast({
        title: "Failed to add organizer",
        description: e.message || "Transaction failed",
        status: "error",
      });
    }
  };

  return (
    <>
      {/* Mode Toggle: Claim or Create */}
      <HStack mb={6}>
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
          isDisabled={!isOwner && !isOrganizer}
        >
          Create Event
        </Button>

        {/* Only Owner can add Admin */}
        {isOwner && (
          <Button colorScheme="purple" size="sm" onClick={handleAddAdmin}>
            Add Admin
          </Button>
        )}

        {/* Owner and Admin can add Organizer */}
        {(isOwner || isAdmin) && (
          <Button colorScheme="orange" size="sm" onClick={handleAddOrganizer}>
            Add Organizer
          </Button>
        )}
      </HStack>

      {/* Main Content */}
      <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="md">
        {mode === 'create' ? (
          <CreateEventView
            handleCreate={handleCreate}
            creating={creating}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
          />
        ) : (
          <ClaimView
            handleClaim={handleClaim}
            claiming={claiming}
            claimEventName={claimEventName}
            setClaimEventName={setClaimEventName}
          />
        )}

        <Divider my={6} />

        <Heading as="h3" size="md" mb={3}>Available Events</Heading>
        <EventList
          events={events}
          isLoading={loadingEvents}
          isOwner={isOwner}
          isOrganizer={isOrganizer}
          accountId={accountId}
          onManageWhitelist={onManageWhitelist}
          onDeleteEvent={handleDeleteEvent}
        />
      </Box>
    </>
  );
}
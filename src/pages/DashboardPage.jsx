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
      <Input placeholder="Enter event name or paste magic link" value={claimEventName} onChange={(e) => setClaimEventName(e.target.value)} />
    </FormControl>
    <Button colorScheme="teal" onClick={handleClaim} isLoading={claiming}>Claim Badge</Button>
  </VStack>
);

const CreateEventView = ({ handleCreate, creating, name, setName, description, setDescription }) => (
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
);

export default function DashboardPage({
  events, loadingEvents, isOwner, isOrganizer,
  handleCreate, creating, name, setName, description, setDescription,
  handleClaim, claiming, claimEventName, setClaimEventName, accountId, wallet, CONTRACT_ID 
}) {
  const [mode, setMode] = useState("claim");
  const navigate = useNavigate();
  const toast = useToast();
  const onManageWhitelist = (eventName) => {
    
    navigate(`/event/${eventName}`);
  };

  const onDeleteEvent = async (eventName) => {
    try {
      await wallet.signAndSendTransaction({
        receiverId: CONTRACT_ID,
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "delete_event",
            args: { event_name: eventName },
            gas: "30000000000000",
            deposit: "0"
          }
        }]
      });
      toast({
        title: "Event deleted",
        description: `${eventName} has been removed.`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      // optionally refresh list
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e.message,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <HStack mb={6}>
        <Button variant={mode === "claim" ? "solid" : "outline"} colorScheme="teal" onClick={() => setMode("claim")}>Claim Badge</Button>
        <Button variant={mode === "create" ? "solid" : "outline"} colorScheme="green" onClick={() => setMode("create")} isDisabled={!isOwner && !isOrganizer}>Create Event</Button>
      </HStack>

      <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="md">
        {mode === 'create' ? (
          <CreateEventView {...{ handleCreate, creating, name, setName, description, setDescription }} />
        ) : (
          <ClaimView {...{ handleClaim, claiming, claimEventName, setClaimEventName }} />
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
          onDeleteEvent={onDeleteEvent}    // <--- pass handler
        />
      </Box>
    </>
  );
}

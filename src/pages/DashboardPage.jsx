import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  VStack,
  HStack,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { EventList } from "../components/EventList.jsx";
import { normalizeEventName } from "../utils/normalizeEventName";


const ClaimView = ({ handleClaim, claiming, claimEventName, setClaimEventName }) => (
  <VStack spacing={4} align="stretch">
    <Heading as="h2" size="md">
      Claim a Badge
    </Heading>
    <FormControl>
      <FormLabel>Event name</FormLabel>
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

const CreateEventView = ({
  handleCreate,
  creating,
  name,
  setName,
  description,
  setDescription,
}) => (
  <VStack spacing={4} align="stretch">
    <Heading as="h2" size="md">
      Create a New Event
    </Heading>
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

//
  const wrappedHandleClaim = async () => {
    if (!claimEventName) {
      toast({ status: "warning", title: "Please enter event name" });
      return;
    }
    const clean = normalizeEventName(claimEventName);
    setClaimEventName(clean);
    await handleClaim(clean);
  };

  const onManageWhitelist = (eventName) => {
    navigate(`/event/${eventName}`);
  };

  return (
    <>
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
      </HStack>

      <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="md">
        {mode === "create" ? (
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
            handleClaim={wrappedHandleClaim}
            claiming={claiming}
            claimEventName={claimEventName}
            setClaimEventName={setClaimEventName}
          />
        )}
        <Divider my={6} />
        <Heading as="h3" size="md" mb={3}>
          Available Events
        </Heading>
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

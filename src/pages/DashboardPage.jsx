"use client"

import { useState } from "react"
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
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  useColorMode,
} from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { EventList } from "../components/EventList.jsx"
import { normalizeEventName } from "../utils/normalizeEventName"
import { CalendarIcon, StarIcon, UsersIcon } from "@chakra-ui/icons"

const ClaimView = ({ handleClaim, claiming, claimEventName, setClaimEventName }) => (
  <Box className="glass-card animate-fade-in-up" p={8} borderRadius="2xl">
    <VStack spacing={6} align="stretch">
      <Heading size="lg" textAlign="center" bgGradient="linear(to-r, teal.400, green.400)" bgClip="text">
        Claim Your Badge
      </Heading>

      <FormControl>
        <FormLabel fontWeight="semibold">Event Name</FormLabel>
        <Input
          placeholder="Enter the exact event name"
          value={claimEventName}
          onChange={(e) => setClaimEventName(e.target.value)}
          size="lg"
          borderRadius="xl"
          _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px teal.400" }}
        />
      </FormControl>

      <Button
        onClick={handleClaim}
        isLoading={claiming}
        loadingText="Claiming..."
        className="gradient-btn"
        size="lg"
        borderRadius="xl"
        _hover={{ transform: "translateY(-2px)" }}
      >
        Claim Badge
      </Button>
    </VStack>
  </Box>
)

const CreateEventView = ({ handleCreate, creating, name, setName, description, setDescription }) => (
  <Box className="glass-card animate-fade-in-up" p={8} borderRadius="2xl">
    <VStack spacing={6} align="stretch">
      <Heading size="lg" textAlign="center" bgGradient="linear(to-r, purple.400, pink.400)" bgClip="text">
        Create New Event
      </Heading>

      <FormControl>
        <FormLabel fontWeight="semibold">Event Name</FormLabel>
        <Input
          placeholder="Enter event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="lg"
          borderRadius="xl"
          _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px purple.400" }}
        />
      </FormControl>

      <FormControl>
        <FormLabel fontWeight="semibold">Description</FormLabel>
        <Textarea
          placeholder="Describe your event"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          size="lg"
          borderRadius="xl"
          rows={4}
          _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px purple.400" }}
        />
      </FormControl>

      <Button
        onClick={handleCreate}
        isLoading={creating}
        loadingText="Creating..."
        className="gradient-btn"
        size="lg"
        borderRadius="xl"
        bg="linear-gradient(135deg, #9f7aea 0%, #ed64a6 100%)"
        _hover={{ transform: "translateY(-2px)" }}
      >
        Create Event
      </Button>
    </VStack>
  </Box>
)

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
  totalClaims,
}) {
  const [mode, setMode] = useState("claim")
  const navigate = useNavigate()
  const toast = useToast()
  const { colorMode } = useColorMode()

  const wrappedHandleClaim = async () => {
    if (!claimEventName) {
      toast({ status: "warning", title: "Please enter event name" })
      return
    }
    const clean = normalizeEventName(claimEventName)
    setClaimEventName(clean)
    await handleClaim(clean)
  }

  const onManageWhitelist = (eventName) => {
    navigate(`/event/${eventName}`)
  }

  const totalEvents = events.length
  const totalClaimed = totalClaims || events.reduce((acc, [, ev]) => acc + (ev.claimed?.length || 0), 0)
  const myEvents = events.filter(([, ev]) => ev.organizer === accountId).length

  return (
    <VStack spacing={8} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} className="animate-fade-in-up">
        <Box className="glass-card" p={6} borderRadius="2xl">
          <Stat>
            <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
              Total Events
            </StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold" color="teal.500">
              {totalEvents}
            </StatNumber>
            <StatHelpText>
              <Icon as={CalendarIcon} mr={1} />
              Active events
            </StatHelpText>
          </Stat>
        </Box>

        <Box className="glass-card" p={6} borderRadius="2xl">
          <Stat>
            <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
              Total Claims
            </StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold" color="purple.500">
              {totalClaimed}
            </StatNumber>
            <StatHelpText>
              <Icon as={StarIcon} mr={1} />
              Badges claimed
            </StatHelpText>
          </Stat>
        </Box>

        <Box className="glass-card" p={6} borderRadius="2xl">
          <Stat>
            <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
              My Events
            </StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold" color="green.500">
              {myEvents}
            </StatNumber>
            <StatHelpText>
              <Icon as={UsersIcon} mr={1} />
              Events created
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      <HStack justify="center" spacing={4} className="animate-fade-in-up">
        <Button
          onClick={() => setMode("claim")}
          variant={mode === "claim" ? "solid" : "outline"}
          className={mode === "claim" ? "gradient-btn" : "glass-card"}
          size="lg"
          borderRadius="xl"
          px={8}
          _hover={{ transform: "translateY(-1px)" }}
        >
          Claim Badge
        </Button>
        <Button
          onClick={() => setMode("create")}
          isDisabled={!isOwner && !isOrganizer}
          variant={mode === "create" ? "solid" : "outline"}
          className={mode === "create" ? "gradient-btn" : "glass-card"}
          size="lg"
          borderRadius="xl"
          px={8}
          bg={mode === "create" ? "linear-gradient(135deg, #9f7aea 0%, #ed64a6 100%)" : undefined}
          _hover={{ transform: "translateY(-1px)" }}
        >
          Create Event
        </Button>
      </HStack>

      <Box className="animate-fade-in-up">
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
      </Box>

      <Divider />

      <Box className="animate-fade-in-up">
        <Heading size="lg" mb={6} textAlign="center" bgGradient="linear(to-r, teal.400, green.400)" bgClip="text">
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
    </VStack>
  )
}

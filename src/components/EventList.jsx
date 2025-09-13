"use client"
import { useNavigate } from "react-router-dom"
import { Box, Text, VStack, HStack, IconButton, useToast, Button, SimpleGrid, Badge } from "@chakra-ui/react"
import { LinkIcon } from "@chakra-ui/icons"
import { Trash } from "lucide-react"

export function EventList({ events, isLoading, isOwner, isOrganizer, accountId, onManageWhitelist, onDeleteEvent }) {
  const toast = useToast()
  const navigate = useNavigate()

  const handleShare = (eventName) => {
    const url = `${window.location.origin}?event=${encodeURIComponent(eventName)}`
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Magic Link Copied!",
        description: "You can now share this link with attendees.",
        status: "success",
        duration: 5000,
        isClosable: true,
      })
    })
  }

  const handleManage = (eventName) => {
    navigate(`/event/${eventName}`)
  }

  if (isLoading) {
    return (
      <Box textAlign="center" py={12}>
        <Box className="animate-pulse">
          <Text fontSize="lg" color="gray.500">
            Loading events...
          </Text>
        </Box>
      </Box>
    )
  }

  if (events.length === 0) {
    return (
      <Box textAlign="center" py={12} className="glass-card" borderRadius="2xl">
        <Text fontSize="lg" color="gray.500" mb={4}>
          No events found
        </Text>
        <Text color="gray.400">Create your first event to get started!</Text>
      </Box>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {events.map(([eventName, ev]) => (
        <Box
          key={eventName}
          className="glass-card animate-fade-in-up"
          p={6}
          borderRadius="2xl"
          _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
          transition="all 0.3s ease"
        >
          <VStack align="stretch" spacing={4}>
            <Box
              h="120px"
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
              overflow="hidden"
            >
              <Text color="white" fontWeight="bold" fontSize="lg" textAlign="center" px={4}>
                {eventName}
              </Text>
              <Badge position="absolute" top={2} right={2} colorScheme="green" borderRadius="full" px={2}>
                Active
              </Badge>
            </Box>

            <VStack align="stretch" spacing={2}>
              <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                {eventName}
              </Text>
              <Text color="gray.600" fontSize="sm" noOfLines={2}>
                {ev.description}
              </Text>

              <HStack justify="space-between" fontSize="xs" color="gray.500">
                <Text>Claims: {ev.claimed?.length || 0}</Text>
                <Text>Organizer: {ev.organizer?.substring(0, 8)}...</Text>
              </HStack>
            </VStack>

            {(isOwner || isOrganizer) && (
              <HStack spacing={2}>
                <IconButton
                  icon={<LinkIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="teal"
                  onClick={() => handleShare(eventName)}
                  borderRadius="lg"
                  _hover={{ bg: "teal.50" }}
                />

                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => onManageWhitelist(eventName)}
                  borderRadius="lg"
                  flex={1}
                  _hover={{ bg: "blue.50" }}
                >
                  Manage
                </Button>

                {(isOwner || (isOrganizer && accountId === ev.organizer)) && (
                  <IconButton
                    icon={<Trash size={16} />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => onDeleteEvent(eventName)}
                    borderRadius="lg"
                    _hover={{ bg: "red.50" }}
                  />
                )}
              </HStack>
            )}
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  )
}

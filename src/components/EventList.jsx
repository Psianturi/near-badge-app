import React from 'react';
import {
  Box, Text, List, ListItem, ListIcon, HStack, Spacer, IconButton, useToast, Flex 
} from "@chakra-ui/react";
import { CheckCircleIcon, LinkIcon } from "@chakra-ui/icons";

export function EventList({ events, isLoading, isOwner, isOrganizer }) {
  const toast = useToast();

  const handleShare = (eventName) => {
    // URL
    const url = `${window.location.origin}?event=${encodeURIComponent(eventName)}`;
    
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Magic Link Copied!",
        description: "You can now share this link with attendees.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    });
  };

  if (isLoading) {
    return <Text>Loading events...</Text>;
  }

  if (events.length === 0) {
    return <Text color="gray.500">No events found. Create one to get started!</Text>;
  }

  return (
    <List spacing={2}>
      {events.map(([eventName, ev]) => (
        <ListItem key={eventName} p={3} borderRadius="md" _hover={{ bg: "gray.50" }}>
          <Flex align="center">
            <HStack align="start">
              <ListIcon as={CheckCircleIcon} color="green.500" mt={1} />
              <Box>
                <Text fontWeight="bold">{eventName}</Text>
                <Text as="span" color="gray.600" fontSize="sm">{ev.description}</Text>
              </Box>
            </HStack>
            <Spacer />
            {(isOwner || isOrganizer) && (
              <IconButton
                aria-label="Get magic link"
                icon={<LinkIcon />}
                size="sm"
                variant="ghost"
                colorScheme="teal"
                onClick={() => handleShare(eventName)}
              />
            )}
          </Flex>
        </ListItem>
      ))}
    </List>
  );
}

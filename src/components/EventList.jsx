import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Text, List, ListItem, ListIcon, HStack, Spacer, IconButton, useToast, Flex, Button, Td, Tr
} from "@chakra-ui/react";
import { CheckCircleIcon, LinkIcon } from "@chakra-ui/icons";
import { Trash } from "lucide-react";


export function EventList({ events, isLoading, isOwner, isOrganizer, onManageWhitelist }) {
  const toast = useToast();
  const navigate = useNavigate();

  const handleShare = (eventName) => {
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

   const handleManage = (eventName) => {
    navigate(`/event/${eventName}`);
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
             <HStack>
                    <IconButton
                      aria-label="Get magic link"
                      icon={<LinkIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="teal"
                      onClick={() => handleShare(eventName)}
                    />
                    <Button size="sm" onClick={() => onManageWhitelist(eventName)}>
                      Manage
                    </Button>
                    
                    {/* Hanya muncul jika pengguna adalah owner atau organizer event ini */}
                    {(isOwner || (isOrganizer && accountId === ev.organizer)) && (
                      <IconButton
                        aria-label="Delete event"
                        icon={<Trash size={16} />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteEvent(eventName)}
                      />
                    )}
                  </HStack>
            )}
          </Flex>
        </ListItem>
      ))}
    </List>
  );
}


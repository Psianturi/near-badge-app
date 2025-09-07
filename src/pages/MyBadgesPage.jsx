// src/pages/MyBadgesPage.jsx

import React, { useEffect, useState } from 'react';
import { useWalletSelector } from '../contexts/WalletSelectorContext.jsx';
import { ContractName } from '../config.js';
import { Box, Heading, Text, SimpleGrid, Image, Spinner, Center, Link, Tag } from '@chakra-ui/react';
import { callViewWithFallback } from '../utils/callViewWithFallback.js';



const ExplorerLink = ({ txId }) => (
  <Link href={`https://explorer.testnet.near.org/transactions/${txId}`} isExternal color="cyan.500">
    View on Explorer
  </Link>
);


// async function callViewWithFallback(selector, contractId, method, args = {}) {
   
// }


export default function MyBadgesPage() {
  const { selector, accountId } = useWalletSelector();
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    //  Data badges funtion from contract
    const fetchBadges = async () => {
      if (!selector || !accountId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Memanggil fungsi `nft_tokens_for_owner` yang sudah ada di kontrak Anda
        const ownedBadges = await callViewWithFallback(selector, ContractName, "nft_tokens_for_owner", {
          account_id: accountId,
        });
        console.log("Owned badges:", ownedBadges);

        setBadges(ownedBadges || []);
      } catch (error) {
        console.error("Failed to fetch badges:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, [selector, accountId]);

  if (isLoading) {
    return (
      <Center p={10}>
        <Spinner size="xl" />
        <Text ml={4}>Loading your badges...</Text>
      </Center>
    );
  }

  if (!accountId) {
    return (
      <Center p={10}>
        <Text>Please log in to see your badges.</Text>
      </Center>
    )
  }

  return (
    <Box>
      <Heading mb={6}>My Badges ({badges.length})</Heading>
      {badges.length === 0 ? (
        <Text>You haven't claimed any badges yet.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
          {badges.map((badge) => (
            <Box key={badge.token_id} p={5} shadow="md" borderWidth="1px" borderRadius="lg">
              <Image src={badge.metadata.media} alt={badge.metadata.title} borderRadius="md" mb={4} />
              <Heading fontSize="xl">{badge.metadata.title}</Heading>
              <Text mt={2} color="gray.600">{badge.metadata.description}</Text>
              <Tag mt={4} size="sm" variant="solid" colorScheme="teal">
                Token ID: {badge.token_id}
              </Tag>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
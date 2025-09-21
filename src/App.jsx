"use client"

import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from "react-router-dom"
import { useWalletSelector } from "./contexts/WalletSelectorContext.jsx"
import { ContractName, NetworkId } from "./config.js"
import {
  Box,
  Button,
  Container,
  Flex,
  Badge,
  HStack,
  Image,
  Heading,
  Text,
  useToast,
  Link,
  useColorMode,
  IconButton,
} from "@chakra-ui/react"
import { MoonIcon, SunIcon } from "@chakra-ui/icons"
import AdminPage from "./pages/AdminPage.jsx"
import ManagerPage from "./pages/ManagerPage.jsx"
import NearLogo from "./assets/near_logo.svg"
import DashboardPage from "./pages/DashboardPage.jsx"
import WhitelistManagerPage from "./pages/WhitelistManagerPage.jsx"
import { makeRateLimited, makeCached } from "./utils/rateLimit"
import { DEFAULT_BADGE_IMAGES } from "./assets/default-images.js"
import MyBadgesPage from "./pages/MyBadgesPage.jsx"

const ExplorerLink = ({ txId }) => {
  const explorerUrl =
    NetworkId === "mainnet"
      ? `https://explorer.near.org/transactions/${txId}`
      : `https://explorer.testnet.near.org/transactions/${txId}`

  return (
    <Link href={explorerUrl} isExternal color="cyan.200" textDecoration="underline" mt={2} display="block">
      View Transaction on Explorer
    </Link>
  )
}

async function callViewWithFallback(selector, contractId, method, args = {}) {
  try {
    if (selector && selector.isSignedIn()) {
      const wallet = await selector.wallet()
      if (wallet && typeof wallet.viewMethod === "function") {
        return await wallet.viewMethod({ contractId, method, args })
      }
    }
  } catch (e) {
    console.warn("Falling back to RPC due to wallet.viewMethod error:", e)
  }
  try {
    const rpcUrl = NetworkId === "testnet" ? "https://rpc.testnet.near.org" : "https://rpc.mainnet.near.org"
    const resp = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "optimistic",
          account_id: contractId,
          method_name: method,
          args_base64: btoa(JSON.stringify(args)),
        },
      }),
    })
    const json = await resp.json()
    if (json.error) throw new Error(JSON.stringify(json.error))
    const bytes = json.result?.result
    if (!bytes) return null
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bytes)))
  } catch (e) {
    console.error("RPC fallback failed:", e)
    throw e
  }
}
const callView = makeCached(makeRateLimited(callViewWithFallback))
const GAS = "30000000000000"
const NO_DEPOSIT = "0"
const DEPOSIT_FOR_BADGE = "12000000000000000000000"

async function getTotalClaimsFromAPI(contractId) {
  try {
    const response = await fetch(`https://api.nearblocks.io/v1/account/${contractId}/txns?method=claim_badge&page=1&per_page=1`);
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    return data.total || 0;
  } catch (e) {
    console.warn('Failed to fetch total claims from API:', e);
    return 0;
  }
}

export default function App() {
  const { selector, modal, accountId } = useWalletSelector()
  const toast = useToast()
  const { colorMode, toggleColorMode } = useColorMode()

  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [totalClaims, setTotalClaims] = useState(0)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [claimEventName, setClaimEventName] = useState("")
  const [creating, setCreating] = useState(false)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!selector) return
      setLoadingEvents(true)
      try {
        const evsPromise = callView(selector, ContractName, "get_all_events", {}, 60)

        let rolesPromise = Promise.resolve([false, false, false])
        if (accountId) {
          rolesPromise = Promise.all([
            callView(selector, ContractName, "is_owner", { account_id: accountId }, 300),
            callView(selector, ContractName, "is_organizer", { account_id: accountId }, 320),
            callView(selector, ContractName, "is_manager", { account_id: accountId }, 300),
          ])
        }

        const totalClaimsPromise = getTotalClaimsFromAPI(ContractName)

        const [evs, [ownerCheck, orgCheck, managerCheck], totalClaimsCount] = await Promise.all([
          evsPromise,
          rolesPromise,
          totalClaimsPromise,
        ])

        setEvents(Array.isArray(evs) ? evs : [])
        setIsOwner(Boolean(ownerCheck))
        setIsOrganizer(Boolean(orgCheck))
        setIsManager(Boolean(managerCheck))
        setTotalClaims(totalClaimsCount)
      } catch (e) {
        toast({ title: "Failed to load data", description: String(e), status: "error" })
      } finally {
        setLoadingEvents(false)
      }
    }
    load()
  }, [selector, accountId])

  async function sendTransaction(actions) {
    if (!selector || !accountId) throw new Error("Wallet not ready or not signed in")
    const wallet = await selector.wallet()
    return wallet.signAndSendTransaction({ signerId: accountId, receiverId: ContractName, actions })
  }

  const handleCreate = async () => {
    if (!name || !description) return toast({ status: "warning", title: "Fill name & description" })
    setCreating(true)

    const randomIndex = Math.floor(Math.random() * DEFAULT_BADGE_IMAGES.length)
    const randomMediaUrl = DEFAULT_BADGE_IMAGES[randomIndex]

    try {
      const result = await sendTransaction([
        {
          type: "FunctionCall",
          params: {
            methodName: "create_event",
            args: { name, description, media: randomMediaUrl },
            gas: GAS,
            deposit: NO_DEPOSIT,
          },
        },
      ])
      const txId = result.transaction_outcome?.id || result.transaction?.hash
      toast({
        duration: 9000,
        isClosable: true,
        render: () => (
          <Box color="white" p={4} bg="green.500" borderRadius="md" boxShadow="lg">
            <Text fontWeight="bold">Event Created Successfully!</Text>
            {txId && <ExplorerLink txId={txId} />}
          </Box>
        ),
      })

      const evs = await callView(selector, ContractName, "get_all_events", {}, 5)
      setEvents(Array.isArray(evs) ? evs : [])
      setName("")
      setDescription("")
    } catch (e) {
      toast({ title: "Error creating event", description: e?.message || String(e), status: "error" })
    } finally {
      setCreating(false)
    }
  }

  const handleClaim = async () => {
    if (!claimEventName) return toast({ status: "warning", title: "Fill event name" })
    setClaiming(true)
    try {
      const result = await sendTransaction([
        {
          type: "FunctionCall",
          params: {
            methodName: "claim_badge",
            args: { event_name: claimEventName },
            gas: GAS,
            deposit: DEPOSIT_FOR_BADGE,
          },
        },
      ])
      const txId = result.transaction_outcome?.id || result.transaction?.hash
      toast({
        duration: 9000,
        isClosable: true,
        render: () => (
          <Box color="white" p={4} bg="teal.500" borderRadius="md" boxShadow="lg">
            <Text fontWeight="bold">Claim Request Successful!</Text>
            {txId && <ExplorerLink txId={txId} />}
          </Box>
        ),
      })

      // Reload events to update claimed counts
      const evs = await callView(selector, ContractName, "get_all_events", {}, 5)
      setEvents(Array.isArray(evs) ? evs : [])

      // Increment total claims
      setTotalClaims(prev => prev + 1)

      setClaimEventName("")
    } catch (e) {
      toast({ title: "Error claiming badge", description: e?.message || String(e), status: "error" })
    } finally {
      setClaiming(false)
    }
  }

  const handleDeleteEvent = async (eventName) => {
    if (!window.confirm(`Are you sure you want to delete the event "${eventName}"? This cannot be undone.`)) {
      return
    }
    try {
      const result = await sendTransaction([
        {
          type: "FunctionCall",
          params: { methodName: "delete_event", args: { event_name: eventName }, gas: GAS, deposit: NO_DEPOSIT },
        },
      ])
      toast({ title: "Event deleted successfully!", status: "success" })
      const evs = await callView(selector, ContractName, "get_all_events", {}, 0)
      setEvents(Array.isArray(evs) ? evs : [])
    } catch (e) {
      toast({ title: "Error deleting event", description: String(e), status: "error" })
    }
  }

  const handleSignIn = () => modal.show()
  const handleSignOut = async () => {
    const wallet = await selector.wallet()
    wallet.signOut()
  }

  return (
    <Router>
      <Box
        minH="100vh"
        bg={
          colorMode === "light"
            ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)"
            : "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)"
        }
      >
        {/* Header with improved styling but original functionality */}
        <Box
          className="glass-effect animate-fade-in-up"
          position="sticky"
          top={0}
          zIndex={1000}
          borderRadius="0 0 24px 24px"
          mx={4}
          mt={4}
        >
          <Container maxW="7xl" py={4}>
            <Flex align="center" justify="space-between">
              <HStack as={RouterLink} to="/" spacing={4} _hover={{ textDecoration: "none" }}>
                <Image src={NearLogo || "/placeholder.svg"} boxSize="40px" alt="NEAR Logo" />
                <Box>
                  <Heading size="lg" bgGradient="linear(to-r, teal.400, green.400)" bgClip="text" fontWeight="bold">
                    NEAR Badge Manager
                  </Heading>
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">
                    Contract: {ContractName}
                  </Text>
                </Box>
              </HStack>

              <HStack spacing={3}>
                <IconButton
                  aria-label="Toggle color mode"
                  icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                  onClick={toggleColorMode}
                  variant="ghost"
                  size="sm"
                />

                {accountId && (
                  <Badge
                    className="glass-card"
                    px={3}
                    py={1}
                    borderRadius="full"
                    colorScheme={isOwner ? "purple" : isManager ? "blue" : isOrganizer ? "green" : "gray"}
                    fontWeight="bold"
                  >
                    {isOwner ? "ADMIN" : isManager ? "MANAGER" : isOrganizer ? "ORGANIZER" : "ATTENDEE"}
                  </Badge>
                )}

                {accountId && (
                  <Button
                    as={RouterLink}
                    to="/my-badges"
                    size="sm"
                    className="glass-card"
                    _hover={{ transform: "translateY(-1px)" }}
                  >
                    My Badges
                  </Button>
                )}

                {isOwner && (
                  <Button
                    as={RouterLink}
                    to="/admin"
                    size="sm"
                    className="glass-card"
                    colorScheme="purple"
                    _hover={{ transform: "translateY(-1px)" }}
                  >
                    Admin Panel
                  </Button>
                )}

                {isManager && !isOwner && (
                  <Button
                    as={RouterLink}
                    to="/manager"
                    size="sm"
                    className="glass-card"
                    colorScheme="blue"
                    _hover={{ transform: "translateY(-1px)" }}
                  >
                    Manager Panel
                  </Button>
                )}

                {accountId ? (
                  <Button
                    onClick={handleSignOut}
                    size="sm"
                    bg="emerald.600"
                    color="black"
                    _hover={{ bg: "emerald.700", transform: "translateY(-1px)" }}
                    border="0"
                    shadow="md"
                  >
                    Log out ({accountId.substring(0, 6)}...)
                  </Button>
                ) : (
                  <Button
                    onClick={handleSignIn}
                    size="sm"
                    bg="emerald.600"
                    color="black"
                    _hover={{ bg: "emerald.700", transform: "translateY(-1px)" }}
                    border="0"
                    shadow="md"
                  >
                    Connect Wallet
                  </Button>
                )}
              </HStack>
            </Flex>
          </Container>
        </Box>

        <Container maxW="7xl" py={8}>
          {/* Routes with restored original props */}
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  events={events}
                  loadingEvents={loadingEvents}
                  isOwner={isOwner}
                  isOrganizer={isOrganizer}
                  handleCreate={handleCreate}
                  creating={creating}
                  name={name}
                  setName={setName}
                  description={description}
                  setDescription={setDescription}
                  handleClaim={handleClaim}
                  claiming={claiming}
                  claimEventName={claimEventName}
                  setClaimEventName={setClaimEventName}
                  accountId={accountId}
                  handleDeleteEvent={handleDeleteEvent}
                  sendTransaction={sendTransaction}
                  totalClaims={totalClaims}
                />
              }
            />

            <Route path="/my-badges" element={<MyBadgesPage />} />

            <Route
              path="/event/:eventName"
              element={
                <WhitelistManagerPage
                  callViewWithFallback={callViewWithFallback}
                  sendTransaction={sendTransaction}
                  selector={selector}
                  contractId={ContractName}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminPage
                  callViewWithFallback={callViewWithFallback}
                  sendTransaction={sendTransaction}
                  selector={selector}
                  contractId={ContractName}
                />
              }
            />
            <Route
              path="/manager"
              element={
                <ManagerPage
                  callViewWithFallback={callViewWithFallback}
                  sendTransaction={sendTransaction}
                  selector={selector}
                  contractId={ContractName}
                />
              }
            />
          </Routes>
        </Container>

        {/* Footer with improved styling */}
        <Box as="footer" className="glass-effect" mt={16} mx={4} mb={4} borderRadius="24px 24px 0 0">
          <Container maxW="7xl" py={6}>
            <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between">
              <Text color="gray.600" fontSize="sm">
                © 2024 NEAR Badge Manager. Built on NEAR Protocol.
              </Text>
              <HStack spacing={4} mt={{ base: 4, md: 0 }}>
                <Link href="https://near.org" isExternal color="teal.500" fontSize="sm">
                  NEAR Protocol
                </Link>
                <Link href="https://github.com/Psianturi/near-badge-app" isExternal color="teal.500" fontSize="sm">
                  GitHub
                </Link>
              </HStack>
            </Flex>
          </Container>
        </Box>
      </Box>
    </Router>
  )
}

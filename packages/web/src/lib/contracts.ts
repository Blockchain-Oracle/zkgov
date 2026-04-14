/**
 * Contract configuration for the frontend.
 * Imports from @zkgov/shared (single source of truth).
 */
import { CONTRACTS, HASHKEY_TESTNET, ZK_VOTING_ABI } from "@zkgov/shared"

export const ZK_VOTING_ADDRESS = CONTRACTS.zkVoting as `0x${string}`
export const SEMAPHORE_ADDRESS = CONTRACTS.semaphore as `0x${string}`
export const EXPLORER_URL = HASHKEY_TESTNET.explorerUrl

export { ZK_VOTING_ABI }

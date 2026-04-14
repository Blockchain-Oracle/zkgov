/**
 * Contract configuration for the frontend.
 * ABI imported from @zkgov/shared (single source of truth).
 * Addresses re-exported from shared constants.
 */
import { CONTRACTS, HASHKEY_TESTNET, ZK_VOTING_ABI as ABI } from "@zkgov/shared"

export const ZK_VOTING_ADDRESS = CONTRACTS.zkVoting as `0x${string}`
export const SEMAPHORE_ADDRESS = CONTRACTS.semaphore as `0x${string}`
export const EXPLORER_URL = HASHKEY_TESTNET.explorerUrl

export const ZK_VOTING_ABI = ABI

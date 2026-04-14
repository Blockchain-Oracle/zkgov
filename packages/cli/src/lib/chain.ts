/**
 * Viem client for reading from ZKVoting contract on HashKey Chain.
 */
import { createPublicClient, http, defineChain } from "viem";

export const chain = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet.hsk.xyz"] } },
});

export const publicClient = createPublicClient({
  chain,
  transport: http(),
});

export const ZK_VOTING = "0xEa625841E031758786141c8b13dD1b1137C9776C" as `0x${string}`;
export const SEMAPHORE = "0x1f7cbB9947087b01fCd7963F296A76E0dA41AA6f" as `0x${string}`;
export const EXPLORER_URL = "https://testnet-explorer.hsk.xyz";
export const DEPLOYMENT_BLOCK = 26266477;

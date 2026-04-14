/**
 * Wallet management for CLI/MCP write operations.
 *
 * Stores a private key at ~/.zkgov/config.json (mode 0o600).
 * The same private key is used for:
 *   - Signing EVM transactions (viem account)
 *   - Deriving the Semaphore identity (for voting)
 *
 * This mirrors the web app's useSemaphoreIdentity hook but uses
 * the key directly instead of a wallet signature.
 *
 * Env override: ZKGOV_PRIVATE_KEY
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { Identity } from "@semaphore-protocol/identity";
import { chain } from "./chain.js";

const CONFIG_DIR = join(homedir(), ".zkgov");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface WalletConfig {
  privateKey: `0x${string}`;
  address: `0x${string}`;
  createdAt: string;
}

export function loadOrCreateWallet(): WalletConfig {
  // Env override takes precedence
  const envKey = process.env.ZKGOV_PRIVATE_KEY;
  if (envKey) {
    const pk = (envKey.startsWith("0x") ? envKey : `0x${envKey}`) as `0x${string}`;
    const account = privateKeyToAccount(pk);
    return {
      privateKey: pk,
      address: account.address,
      createdAt: new Date().toISOString(),
    };
  }

  // Load from disk if exists
  if (existsSync(CONFIG_FILE)) {
    const raw = readFileSync(CONFIG_FILE, "utf8");
    return JSON.parse(raw) as WalletConfig;
  }

  // First-run: generate and persist
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const config: WalletConfig = {
    privateKey,
    address: account.address,
    createdAt: new Date().toISOString(),
  };

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  chmodSync(CONFIG_FILE, 0o600);

  return config;
}

export function getAccount(config?: WalletConfig) {
  const cfg = config || loadOrCreateWallet();
  return privateKeyToAccount(cfg.privateKey);
}

export function getWalletClient(config?: WalletConfig) {
  const account = getAccount(config);
  return createWalletClient({ account, chain, transport: http() });
}

/**
 * Derive the Semaphore identity from the wallet private key.
 * Deterministic — same key always produces the same identity.
 */
export function getIdentity(config?: WalletConfig): Identity {
  const cfg = config || loadOrCreateWallet();
  return new Identity(cfg.privateKey);
}

export function configPath(): string {
  return CONFIG_FILE;
}

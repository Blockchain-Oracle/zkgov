<p align="center">
  <img src="https://raw.githubusercontent.com/Blockchain-Oracle/zkgov/main/assets/zkgov-header.svg" alt="ZKGov — Anonymous Governance on HashKey Chain" width="100%"/>
</p>

<p align="center">
  <a href="https://zkgov.app"><strong>zkgov.app</strong></a> ·
  <a href="https://testnet-explorer.hsk.xyz/address/0xEa625841E031758786141c8b13dD1b1137C9776C">Contract on HashKey Testnet</a> ·
  <a href="https://www.npmjs.com/package/@zkgov/cli"><img src="https://img.shields.io/npm/v/@zkgov/cli?label=%40zkgov%2Fcli&logo=npm" alt="@zkgov/cli on npm"/></a>
  <a href="https://www.npmjs.com/package/@zkgov/mcp"><img src="https://img.shields.io/npm/v/@zkgov/mcp?label=%40zkgov%2Fmcp&logo=npm" alt="@zkgov/mcp on npm"/></a>
</p>

---

Zero-knowledge governance platform built for the [On-Chain Horizon Hackathon](https://hashkey.com) (ZKID track). Voters cast anonymous, Groth16-verified votes on governance proposals — your vote is mathematically unlinkable to your identity.

## Walkthrough

<p align="center">
  <img src="https://raw.githubusercontent.com/Blockchain-Oracle/zkgov/main/assets/quickstart-wide.gif" alt="ZKGov quickstart — register, browse proposals, cast an anonymous ZK vote" width="100%"/>
</p>

## How It Works

1. **Register once** — Your wallet is checked for a KYC SBT, then your Semaphore identity commitment is added to the on-chain group
2. **Browse proposals** — Created on-chain with title, description, quorum, and voting period
3. **Vote anonymously** — A Groth16 ZK proof is generated locally (3–5s) proving group membership without revealing who you are. A nullifier prevents double-voting per proposal
4. **Finalize** — Anyone can finalize a proposal after the voting period ends, recording the outcome on-chain

**Chain:** HashKey Chain Testnet (ID: 133) · **Contract:** [`0xEa625841E031758786141c8b13dD1b1137C9776C`](https://testnet-explorer.hsk.xyz/address/0xEa625841E031758786141c8b13dD1b1137C9776C)

## Packages

```
packages/
├── contracts/       Solidity — ZKGovernance, KycGate, AgentRegistry
├── backend/         Fastify API + relayer + server-side ZK proof generation
├── web/             Next.js 15 web UI + Telegram Mini App
├── telegram-bot/    grammY bot — proposals in group chats, "Vote Now" button
├── discord-bot/     discord.js — slash commands, ephemeral voting
├── mcp/             MCP server — AI agents vote via Claude Code, Cursor, etc.
├── cli/             CLI + MCP dual entry point (`zkgov` command)
└── shared/          Types, ABIs, contract addresses
```

## Quick Start

### CLI / MCP (no backend needed — reads directly from chain)

```bash
# Install globally — https://www.npmjs.com/package/@zkgov/cli
npm install -g @zkgov/cli

# Or use via npx (MCP server mode) — https://www.npmjs.com/package/@zkgov/mcp
claude mcp add zkgov npx @zkgov/mcp

# Commands
zkgov stats                          # Platform stats
zkgov proposals                      # List all proposals
zkgov proposal <id>                  # Proposal detail
zkgov wallet                         # Your wallet + balance
zkgov register                       # Register as voter (one-time)
zkgov vote <id> for|against|abstain  # Cast anonymous ZK vote
zkgov finalize <id>                  # Finalize ended proposal
zkgov activity                       # Recent on-chain events

# JSON output for scripting/agents
zkgov proposals --json
```

### Full Stack (web + bots + backend)

```bash
pnpm install

# Copy and fill in env vars
cp .env.example .env

# Start everything
pnpm dev
```

**Required env vars:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `KEK` | 32-byte hex key for encrypting Semaphore identities |
| `RELAYER_PRIVATE_KEY` | Funded HashKey testnet wallet for gas |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `DISCORD_BOT_TOKEN` | From Discord Developer Portal |

Get testnet HSK from the [HashKey faucet](https://faucet.hsk.xyz).

## ZK Architecture

<p align="center">
  <img src="https://raw.githubusercontent.com/Blockchain-Oracle/zkgov/main/assets/zkgov-architecture.svg" alt="ZKGov architecture — five-step vote flow from voter to ZKGovernance.sol" width="100%"/>
</p>

The `castVote` function on-chain **does not check `msg.sender`** — only the ZK proof matters. This means:

- A relayer can submit on your behalf without learning your identity
- The vote is unlinkable to any wallet address
- `nullifier = hash(identity, proposalId)` — unique per voter per proposal, but not reversible to an identity

```
Identity (private key) ──► Semaphore commitment (public, on-chain in group)
                                    │
                           Generate Groth16 proof:
                    "I am a member of this group AND
                     I vote YES on proposal 3"
                    (without revealing WHICH member)
                                    │
                     Relayer submits proof on-chain
                                    │
                     Semaphore verifies ──► nullifier stored ──► tally updated
```

## Tech Stack

| Layer | Choice |
|---|---|
| Chain | HashKey Chain Testnet (ID: 133) |
| ZK | Semaphore v4 (Groth16, snarkjs WASM) |
| Contracts | Solidity 0.8.23 + Hardhat |
| Backend | Fastify + Drizzle ORM + PostgreSQL |
| Frontend | Next.js 15 + shadcn/ui + Reown AppKit |
| Telegram | grammY + Mini App |
| Discord | discord.js |
| AI Integration | MCP server + zkgov skill |

## Agent Integration

AI agents (Claude Code, Cursor, Windsurf) can participate in governance directly:

```bash
# Add ZKGov as an MCP server — https://www.npmjs.com/package/@zkgov/mcp
claude mcp add zkgov npx @zkgov/mcp
```

Agents get their own wallet (auto-generated at `~/.zkgov/config.json`), register as voters, and cast anonymous ZK-verified votes — indistinguishable from human votes on-chain.

See [`packages/mcp/`](packages/mcp/) and [`.claude/skills/zkgov/`](.claude/skills/zkgov/) for details.

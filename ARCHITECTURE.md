# ZK Governance Protocol — Architecture Document

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Chain** | HashKey Chain Testnet (chain ID 133) | Hackathon requirement |
| **ZK** | Semaphore v4 (deploy ourselves) | Battle-tested anonymous group membership + voting |
| **Contracts** | Solidity 0.8.23, Hardhat | Semaphore ecosystem is JS/TS-first, integration tests need snarkjs |
| **Backend** | Fastify (Node.js/TypeScript) | REST + WebSocket in one server, JSON Schema validation, plugin architecture |
| **Database** | PostgreSQL + Drizzle ORM | ACID for vote recording, UNIQUE constraints for nullifiers, pure TS schema |
| **Frontend** | Next.js 15 (App Router) + shadcn/ui + Tailwind | SSR, route groups for web/telegram, Telegram Mini App compatible |
| **Wallet** | Reown AppKit + wagmi + viem | Custom chain support, Telegram Mini App support built-in |
| **Chain Library** | viem | Type-safe contracts, client separation (public/wallet), event watching |
| **Telegram Bot** | grammY | Best TypeScript support, Mini App integration, webhook mode |
| **Discord Bot** | discord.js | Ephemeral messages, modals, slash commands |
| **Real-time** | Server-Sent Events (SSE) | Unidirectional (server→client), auto-reconnect, simple |
| **ZK (browser)** | @semaphore-protocol/proof (snarkjs WASM) | 2-8 second proof generation, auto-fetches artifacts |
| **ZK (server)** | snarkjs in Node.js | For Telegram/Discord/Agent voting |
| **Key Encryption** | AES-256-GCM (Node.js crypto) | Native, authenticated encryption, KEK from env var |
| **Monorepo** | pnpm workspaces + Turborepo | Fast installs, strict deps, task caching |

---

## Project Structure

```
zkgov/
├── package.json                     # Root: pnpm workspace config
├── pnpm-workspace.yaml
├── turbo.json                       # Turborepo pipeline
├── .env.example
│
├── packages/
│   ├── contracts/                   # Solidity smart contracts (Hardhat)
│   │   ├── package.json
│   │   ├── hardhat.config.ts
│   │   ├── contracts/
│   │   │   ├── ZKGovernance.sol      # Proposals, vote tallying, proof validation
│   │   │   ├── KycGate.sol           # KYC verification + Semaphore group management
│   │   │   ├── AgentRegistry.sol     # Agent-to-owner mapping
│   │   │   └── interfaces/
│   │   │       ├── IKycSBT.sol       # HashKey KYC SBT interface
│   │   │       └── IAgentRegistry.sol
│   │   ├── deploy/
│   │   │   └── deploy.ts            # Deploys Semaphore + KycSBT + our contracts
│   │   ├── test/
│   │   └── typechain-types/
│   │
│   ├── backend/                     # Fastify API + Relayer
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts             # Server entry point
│   │   │   ├── config/
│   │   │   │   └── env.ts           # Environment variables
│   │   │   ├── db/
│   │   │   │   ├── schema.ts        # Drizzle schema (all tables)
│   │   │   │   ├── migrations/
│   │   │   │   └── index.ts         # DB client
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts          # Registration, wallet linking, social linking
│   │   │   │   ├── proposals.ts     # CRUD + listing
│   │   │   │   ├── votes.ts         # Vote submission (generates ZK proof server-side)
│   │   │   │   ├── comments.ts      # Discussion threads
│   │   │   │   ├── agents.ts        # Agent registration, API key management
│   │   │   │   └── sse.ts           # Server-Sent Events for real-time updates
│   │   │   ├── services/
│   │   │   │   ├── semaphore.ts     # Identity creation, group management, proof generation
│   │   │   │   ├── encryption.ts    # AES-256-GCM encrypt/decrypt Semaphore keys
│   │   │   │   ├── relayer.ts       # Transaction submission, nonce management, retries
│   │   │   │   ├── kyc.ts           # KYC SBT verification via contract calls
│   │   │   │   └── proposals.ts     # Proposal business logic
│   │   │   ├── plugins/
│   │   │   │   ├── auth.ts          # Fastify auth (JWT for humans, API key for agents)
│   │   │   │   └── chain.ts         # viem publicClient + walletClient setup
│   │   │   └── types/
│   │   └── drizzle.config.ts
│   │
│   ├── web/                         # Next.js frontend + Telegram Mini App
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── app/
│   │   │   ├── (web)/               # Web UI layout (header, sidebar, navigation)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Dashboard / proposal list
│   │   │   │   ├── proposal/[id]/
│   │   │   │   │   └── page.tsx      # Proposal detail + vote + discussion
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx      # KYC verification + identity creation
│   │   │   │   └── profile/
│   │   │   │       └── page.tsx      # Link Telegram/Discord, manage agents
│   │   │   ├── (telegram)/          # Mini App layout (no chrome, Telegram theme)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── vote/[id]/
│   │   │   │   │   └── page.tsx      # Voting interface (opens from group chat)
│   │   │   │   └── register/
│   │   │   │       └── page.tsx      # First-time setup inside Mini App
│   │   │   └── api/                  # Next.js API routes (optional, or use backend)
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   └── governance/           # Proposal cards, vote forms, quorum bars
│   │   ├── lib/
│   │   │   ├── semaphore.ts          # Client-side ZK proof generation
│   │   │   ├── contracts.ts          # Contract ABIs + addresses
│   │   │   ├── chains.ts            # HashKey Chain definition
│   │   │   └── appkit.ts            # Reown AppKit config
│   │   └── hooks/
│   │       ├── useProposals.ts
│   │       ├── useVote.ts
│   │       └── useTelegram.ts        # Telegram Mini App SDK hooks
│   │
│   ├── telegram-bot/                # grammY Telegram bot
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts             # Bot instance + webhook setup
│   │   │   ├── commands/
│   │   │   │   ├── start.ts         # /start — welcome + registration link
│   │   │   │   ├── proposals.ts     # /proposals — list active proposals
│   │   │   │   └── help.ts
│   │   │   ├── callbacks/
│   │   │   │   └── vote.ts          # Handle "Vote Now" button → open Mini App
│   │   │   └── middleware/
│   │   │       └── auth.ts          # Check if user is linked
│   │
│   ├── discord-bot/                 # discord.js Discord bot
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts             # Client setup + login
│   │   │   ├── commands/
│   │   │   │   ├── propose.ts       # /propose slash command
│   │   │   │   ├── vote.ts          # /vote → ephemeral + modal
│   │   │   │   ├── proposals.ts     # /proposals — list
│   │   │   │   └── link.ts          # /link — account linking
│   │   │   ├── events/
│   │   │   │   └── interactionCreate.ts
│   │   │   └── deploy-commands.ts   # Register slash commands with Discord API
│   │
│   └── shared/                      # Shared types, ABIs, constants
│       ├── package.json
│       ├── src/
│       │   ├── types.ts             # Shared TypeScript types
│       │   ├── abis/                # Contract ABIs (generated from contracts package)
│       │   │   ├── ZKGovernance.json
│       │   │   ├── KycGate.json
│       │   │   └── AgentRegistry.json
│       │   └── constants.ts         # Chain IDs, contract addresses, API URLs
│       └── tsconfig.json
│
└── skills/                          # OpenClaw governance skill
    └── zk-governance/
        ├── SKILL.md                 # Agent instructions
        └── scripts/
            ├── setup_identity.js    # Create Semaphore identity, register via API
            ├── check_proposals.js   # Query active proposals
            ├── vote.js              # Cast vote via API
            └── analyze_proposal.js  # AI analysis of proposal
```

---

## Smart Contract Architecture

### Contract Interaction Diagram

```
┌─────────────────────────────────────────────────┐
│              HashKey Chain Testnet               │
│                                                  │
│  ┌───────────────┐       ┌──────────────────┐   │
│  │ Semaphore.sol  │       │  KycSBT.sol      │   │
│  │ (deployed by   │       │  (our instance)  │   │
│  │  us, v4)       │       │                  │   │
│  └───────┬───────┘       └────────┬─────────┘   │
│          │                        │              │
│  ┌───────┴────────┐      ┌───────┴──────────┐   │
│  │  KycGate.sol    │──────│AgentRegistry.sol │   │
│  │                 │      │                  │   │
│  │ registerHuman() │      │ registerAgent()  │   │
│  │ registerAgent() │      │ isVerifiedAgent()│   │
│  │                 │      │ getAgentOwner()  │   │
│  └───────┬────────┘      └──────────────────┘   │
│          │                                       │
│  ┌───────┴────────────┐                          │
│  │ ZKGovernance.sol    │                          │
│  │                     │                          │
│  │ createProposal()    │                          │
│  │ castVote(proof)     │                          │
│  │ tallyProposal()     │                          │
│  │ getProposal()       │                          │
│  │ getVoteTally()      │                          │
│  └─────────────────────┘                          │
└──────────────────────────────────────────────────┘
```

### Contract Details

**ZKGovernance.sol** — Core governance
- `createProposal(bytes32 titleHash, string ipfsCid, uint256 votingPeriod, uint256 quorum, bool humansOnly)` → proposalId
- `castVote(uint256 proposalId, SemaphoreProof proof)` — validates proof against correct Semaphore group, extracts vote choice from `proof.message` (0=No, 1=Yes, 2=Abstain), increments tally
- `tallyProposal(uint256 proposalId)` — finalizes after voting period ends
- Scope = proposalId (one vote per identity per proposal)
- Stores: proposal metadata, vote counts, state (Active/Succeeded/Defeated)
- Does NOT store who voted — only nullifiers (in Semaphore contract)

**KycGate.sol** — Registration + group management
- Two standing Semaphore groups: `humanGroupId` and `agentGroupId`
- `registerHuman(uint256 identityCommitment)` — checks `kycSBT.isHuman(msg.sender)`, adds to human group
- `registerAgent(address agentAddr, uint256 identityCommitment)` — checks `agentRegistry.isVerifiedAgent(agentAddr)`, adds to agent group
- Prevents double-registration per address: `mapping(address => bool) registered`

**AgentRegistry.sol** — Agent verification
- `registerAgent(address agentAddress)` — requires `kycSBT.isHuman(msg.sender)`, maps agent → owner
- `deregisterAgent(address agentAddress)` — owner only
- `isVerifiedAgent(address agent) → bool`
- `getAgentOwner(address agent) → address`

### What's On-chain vs Off-chain

| On-chain | Off-chain (Backend DB) |
|----------|----------------------|
| Proposal metadata (hashes, timestamps, quorum, state) | Full proposal text, IPFS CID |
| Vote tallies (yes/no/abstain counts) | User identity mappings |
| ZK proof verification + nullifier tracking | Semaphore private keys (encrypted) |
| KYC gate check at registration | Platform linking (Telegram, Discord) |
| Agent registry | Comments/discussion |
| Semaphore group membership | Notifications, analytics |

---

## Database Schema

```sql
-- Users (humans)
TABLE users (
  id              UUID PRIMARY KEY,
  wallet_address  TEXT UNIQUE NOT NULL,
  encrypted_identity  BYTEA NOT NULL,      -- AES-256-GCM encrypted Semaphore private key
  identity_commitment TEXT NOT NULL,         -- public, goes on-chain
  encryption_iv   BYTEA NOT NULL,           -- 12-byte nonce
  kyc_verified    BOOLEAN DEFAULT FALSE,
  kyc_level       TEXT,                     -- BASIC/ADVANCED/PREMIUM/ULTIMATE
  telegram_id     BIGINT UNIQUE,            -- linked via Mini App initData
  discord_id      TEXT UNIQUE,              -- linked via OAuth2
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- AI Agents
TABLE agents (
  id              UUID PRIMARY KEY,
  owner_id        UUID REFERENCES users(id) NOT NULL,
  name            TEXT NOT NULL,
  api_key_hash    TEXT UNIQUE NOT NULL,     -- bcrypt hash
  encrypted_identity  BYTEA NOT NULL,
  identity_commitment TEXT NOT NULL,
  encryption_iv   BYTEA NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  on_chain_address TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Proposals
TABLE proposals (
  id              SERIAL PRIMARY KEY,
  on_chain_id     INTEGER,                 -- set after tx confirms
  creator_id      UUID REFERENCES users(id),
  creator_agent_id UUID REFERENCES agents(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  proposal_type   TEXT NOT NULL DEFAULT 'verified',  -- 'verified' or 'open'
  voter_group     TEXT NOT NULL DEFAULT 'both',      -- 'humans', 'agents', 'both'
  voting_start    TIMESTAMPTZ NOT NULL,
  voting_end      TIMESTAMPTZ NOT NULL,
  quorum          INTEGER NOT NULL DEFAULT 10,
  status          TEXT NOT NULL DEFAULT 'active',
  tx_hash         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Votes (ANONYMOUS — no user_id column)
TABLE votes (
  id              UUID PRIMARY KEY,
  proposal_id     INTEGER REFERENCES proposals(id) NOT NULL,
  nullifier_hash  TEXT UNIQUE NOT NULL,     -- Semaphore nullifier
  vote_choice     SMALLINT NOT NULL,        -- 0=No, 1=Yes, 2=Abstain
  proof           JSONB NOT NULL,           -- ZK proof data
  tx_hash         TEXT,
  tx_status       TEXT DEFAULT 'pending',   -- pending/confirmed/failed
  submitted_via   TEXT NOT NULL,            -- 'web', 'telegram', 'discord', 'api'
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Discussion
TABLE comments (
  id              UUID PRIMARY KEY,
  proposal_id     INTEGER REFERENCES proposals(id) NOT NULL,
  user_id         UUID REFERENCES users(id),
  agent_id        UUID REFERENCES agents(id),
  parent_id       UUID REFERENCES comments(id),
  content         TEXT NOT NULL,
  comment_type    TEXT DEFAULT 'comment',   -- 'comment', 'analysis'
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Relayer transaction tracking
TABLE relayer_transactions (
  id              UUID PRIMARY KEY,
  tx_hash         TEXT UNIQUE,
  tx_type         TEXT NOT NULL,            -- 'vote', 'register', 'create_proposal'
  status          TEXT DEFAULT 'pending',
  gas_used        BIGINT,
  nonce           INTEGER,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ
)
```

Key design: The `votes` table has **no user_id or agent_id column**. Votes are anonymous. The `nullifier_hash` (from Semaphore) prevents double-voting without revealing identity.

---

## API Endpoints

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register with wallet signature |
| POST | `/api/auth/verify-kyc` | JWT | Trigger KYC SBT check + Semaphore registration |
| POST | `/api/auth/link/telegram` | JWT | Validate Telegram initData, link account |
| POST | `/api/auth/link/discord` | JWT | Discord OAuth2 callback, link account |
| GET | `/api/auth/me` | JWT | Get user profile + linked accounts |

### Proposals
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/proposals` | None | List proposals (paginated, filterable) |
| GET | `/api/proposals/:id` | None | Get proposal detail + vote tally |
| POST | `/api/proposals` | JWT/API Key | Create proposal |
| PATCH | `/api/proposals/:id` | JWT (creator) | Cancel proposal |

### Voting
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/votes` | JWT/API Key | Cast vote (backend generates ZK proof + relays tx) |
| GET | `/api/votes/status/:txHash` | None | Check vote transaction status |

### Comments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/proposals/:id/comments` | None | Get comments for proposal |
| POST | `/api/proposals/:id/comments` | JWT/API Key | Add comment |

### Agents
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/agents` | JWT | Register agent (owner must be KYC'd) |
| GET | `/api/agents` | JWT | List my agents |
| DELETE | `/api/agents/:id` | JWT | Deregister agent |
| POST | `/api/agents/:id/regenerate-key` | JWT | Regenerate API key |

### Real-time
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sse/proposals/:id` | None | SSE stream for live vote updates |
| GET | `/api/sse/feed` | None | SSE stream for new proposals + votes |

### Telegram
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/telegram/webhook` | grammY | Telegram bot webhook handler |
| POST | `/api/telegram/validate-init` | initData | Validate Mini App initData, return JWT |

---

## Relayer Architecture

```
User votes (web/telegram/discord/api)
       │
       ▼
Backend receives vote request
       │
       ├─ 1. Look up user's encrypted Semaphore identity
       ├─ 2. Decrypt with AES-256-GCM (KEK from env)
       ├─ 3. Reconstruct local Semaphore Group (from on-chain events)
       ├─ 4. Generate ZK proof via snarkjs (server-side)
       ├─ 5. Store vote in DB (pending)
       ▼
Relayer module
       │
       ├─ 6. Submit tx: ZKGovernance.castVote(proposalId, proof)
       ├─ 7. Manage nonce (local tracking, not getTransactionCount)
       ├─ 8. Wait for confirmation
       ▼
On confirmation
       │
       ├─ 9. Update vote status in DB → 'confirmed'
       ├─ 10. Broadcast via SSE → all connected clients
       └─ 11. Update bot messages in Telegram/Discord groups
```

The relayer is an **in-process module** (not a separate service). It uses viem's `walletClient.writeContract()` with a funded testnet wallet. For the hackathon, a single wallet with testnet HSK from the faucet is sufficient.

---

## Identity & Account Linking

### User Account Model

```
User Account (backend DB)
├── wallet_address ─── from web registration (wallet signature)
├── semaphore_identity ─── encrypted private key (AES-256-GCM)
├── identity_commitment ─── public, on-chain in Semaphore group
├── kyc_verified ─── checked via KycSBT.isHuman()
├── telegram_id ─── linked via Mini App initData (HMAC validated)
├── discord_id ─── linked via OAuth2 (identify scope)
└── api_keys[] ─── for registered AI agents
```

### Linking Flows

**Telegram** — Zero friction via Mini App initData:
1. User taps "Vote Now" in group → Mini App opens
2. Mini App sends `initData` to backend → HMAC validated with bot token
3. Backend checks `telegram_id` in DB:
   - Found → return JWT, show voting UI
   - Not found → show registration flow inside Mini App

**Discord** — OAuth2:
1. User clicks "Link Discord" on web UI → redirect to Discord OAuth2
2. User approves → callback with auth code → exchange for token → fetch user ID
3. Store `discord_id ↔ user_id`

**Agents** — API Key:
1. Owner (KYC'd human) calls POST `/api/agents` → backend creates agent record + API key
2. API key returned once (bcrypt hash stored)
3. Agent uses `Authorization: Bearer <api_key>` for all requests

---

## Bot Architectures

### Telegram (grammY)

Runs as webhook handler mounted on the Fastify backend:
- `POST /api/telegram/webhook` → grammY processes update
- Shares the same process, DB connections, and service layer as the API
- Uses `webhookCallback(bot, "fastify")` adapter

**Key interactions:**
- Proposal posted to group → inline keyboard with "Vote Now" (`web_app` button)
- User taps → Mini App opens at `/telegram/vote/:id`
- Mini App submits vote → backend generates proof → relayer submits → bot edits message

### Discord (discord.js)

Runs in the same Node.js process via `client.login()`:
- Gateway WebSocket connection for events
- Slash commands registered via `deploy-commands.ts` script

**Key interactions:**
- `/vote <id>` → ephemeral message with vote buttons (only invoker sees)
- Button click → modal form (private popup) for confirmation
- Modal submit → backend generates proof → relayer submits → ephemeral confirmation

---

## Frontend Architecture

### Dual-Mode: Web UI + Telegram Mini App

Same Next.js app serves both:
- `app/(web)/` — Full governance dashboard with header, sidebar, navigation
- `app/(telegram)/` — Streamlined Mini App layout (no chrome, Telegram theme colors)
- `lib/`, `components/`, `hooks/` — Shared between both modes

### Wallet Connection (HashKey Chain)

```typescript
// lib/chains.ts
import { defineChain } from 'viem'

export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: { default: { http: ['https://hashkeychain-testnet.alt.technology'] } },
  blockExplorers: { default: { name: 'Explorer', url: 'https://hashkeychain-testnet-explorer.alt.technology' } },
})
```

Reown AppKit configured with this custom chain + wagmi adapter.

### Client-Side ZK Proofs

For web UI voting (user's identity stays in browser):
1. Identity created client-side → `new Identity()` → stored in localStorage (optional: also encrypted on server)
2. Proof generated in browser → `generateProof(identity, group, message, scope)` → 2-8 seconds
3. Proof submitted to backend → relayer submits on-chain

For Telegram/Discord voting (identity stored on server):
1. Backend decrypts identity → generates proof server-side → relayer submits
2. User never handles ZK directly

### Telegram Mini App SDK

Using `@telegram-apps/sdk-react`:
- `mockTelegramEnv()` for local development outside Telegram
- `useLaunchParams()` for `initData`
- `useViewport()`, `useThemeParams()` for Telegram-native styling
- `useBackButton()` for navigation

---

## Semaphore Deployment

### NPM Packages (all v4.14.2)

| Package | Purpose |
|---------|---------|
| `@semaphore-protocol/core` | Meta-package (re-exports identity, group, proof) |
| `@semaphore-protocol/contracts` | Solidity contracts |
| `@semaphore-protocol/hardhat` | Hardhat deploy plugin |
| `@semaphore-protocol/data` | On-chain state queries (SemaphoreEthers) |
| `@semaphore-protocol/utils` | Network definitions, ABIs |

### Deployment Order

1. `SemaphoreVerifier` — Groth16 verifier (~5M gas)
2. `PoseidonT3` — Poseidon hash library
3. `Semaphore` — Main contract (linked with PoseidonT3, verifier address in constructor)
4. Our `KycSBT` instance — Using hunyuan-kyc deploy script
5. `AgentRegistry` — Takes KycSBT address
6. `KycGate` — Takes Semaphore, KycSBT, AgentRegistry addresses; creates two groups
7. `ZKGovernance` — Takes Semaphore, KycGate addresses

### Data Sync (No Subgraph Needed)

Use `SemaphoreEthers` from `@semaphore-protocol/data`:
```typescript
const semaphore = new SemaphoreEthers("https://hashkeychain-testnet.alt.technology", {
  address: DEPLOYED_SEMAPHORE_ADDRESS,
  startBlock: DEPLOYMENT_BLOCK
})
// Reads events directly from RPC — works on any EVM chain
```

---

## Build Order (Suggested)

### Phase 1: Foundation
1. Set up monorepo (pnpm + Turborepo)
2. Deploy Semaphore + KycSBT to HashKey testnet
3. Write & deploy ZKGovernance + KycGate + AgentRegistry contracts
4. Set up PostgreSQL + Drizzle schema
5. Basic Fastify backend with auth + proposal CRUD

### Phase 2: Core ZK Flow
6. Semaphore identity creation + encrypted storage
7. KYC verification + group registration flow
8. Server-side ZK proof generation
9. Relayer module (submit proofs on-chain)
10. Vote endpoint (end-to-end: vote request → proof → on-chain → confirm)

### Phase 3: Frontend
11. Next.js web UI — proposal list, proposal detail, voting
12. Wallet connection (Reown AppKit + HashKey Chain)
13. Client-side ZK proof generation (browser)
14. Registration flow (connect wallet → KYC check → create identity)
15. Real-time updates (SSE)

### Phase 4: Bots
16. Telegram bot (grammY) — webhook, proposal announcements, "Vote Now" button
17. Telegram Mini App — voting interface inside Telegram
18. Discord bot — slash commands, ephemeral voting, modals

### Phase 5: Agent Hub
19. Agent registration API + API key management
20. Agent voting endpoint
21. OpenClaw skill (SKILL.md + scripts)
22. Agent activity feed on web UI

### Phase 6: Polish
23. UI polish (shadcn/ui components, animations, responsive)
24. Error handling, loading states, edge cases
25. Demo preparation (pre-approve KYC addresses, seed proposals)

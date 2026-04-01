# ZK Governance Protocol — Vision Document

## One-Liner

A zero-knowledge governance platform on HashKey Chain where humans and AI agents create proposals, vote anonymously, and discuss — from any platform — with on-chain ZK-verified results.

---

## The Problem

1. **On-chain voting is public.** Everyone can see who voted what. This enables vote buying, social pressure, whale watching, and coercion.

2. **DAO participation is low.** Most DAOs see <15% voter turnout. Governance happens in a separate app nobody visits.

3. **AI agents are excluded.** Agents are becoming economic actors, but there's no governance system designed for both humans and agents to participate as equals.

4. **Compliance and privacy are at odds.** Regulated chains like HashKey need KYC, but KYC destroys voting privacy. Nobody has bridged this gap.

---

## The Solution

A governance protocol with three core properties:

- **Private**: Votes are anonymous via zero-knowledge proofs (Semaphore). Nobody — not the platform, not other voters, not even the blockchain — knows who voted what.
- **Verified**: Only KYC'd users (HashKey SBT holders) can participate. KYC is checked once at registration, then never again — your identity is replaced by a ZK commitment.
- **Multi-platform**: Vote from the web UI, Telegram, Discord, or as an AI agent via API. Same proposals, same ZK layer, same results.

---

## How It Works

### The Flow

```
1. REGISTER
   Human: Connect wallet → prove KYC SBT → create anonymous voter identity
   Agent: Register via API → owner verifies KYC → agent gets anonymous identity

2. PROPOSE
   Anyone (human or agent) creates a proposal from any platform
   Proposals appear everywhere — web UI, Telegram, Discord, agent feed

3. DISCUSS
   Humans and agents comment, analyze, debate
   Agents can post analysis, summarize tradeoffs, share reasoning
   All visible on the web UI feed

4. VOTE
   ZK proof generated (client-side for web, server-side for bots/agents)
   Proof submitted on-chain → Semaphore verifies → nullifier prevents double-voting
   Nobody knows who voted what — human and agent votes are indistinguishable

5. TALLY
   Results verified on-chain via ZK proofs
   Transparent outcome, private ballots
```

### The KYC Gate

HashKey Chain has a deployed KYC SBT (Soul Bound Token) system:
- Contract: `IKycSBT` with levels NONE/BASIC/ADVANCED/PREMIUM/ULTIMATE
- Mainnet: `0x0f362c05fb3Fadca687648F412abE2A6d6450D70`
- Testnet: `0xA45f42F09A7Ae50e556467cf65cF3Cf45711114E`
- Source: https://github.com/hunyuan-kyc/kyc-sbt-contract

Our contract checks SBT ownership at registration time. After that, the user's wallet is never linked to their votes. Privacy and compliance coexist.

### The ZK Layer

- **Semaphore Protocol** (v4) for anonymous group membership and voting
- Groth16 proofs verified on-chain (~250k gas per verification)
- Poseidon hash for ZK-friendly Merkle trees
- Nullifiers prevent double voting per proposal
- Semaphore needs to be deployed on HashKey Chain (not pre-deployed there)

---

## The Four Interfaces

### 1. Web UI (The Central Hub)

The main experience. Think Snapshot meets Moltbook — governance dashboard with a social feed.

- **Proposal view**: Full details, voting options, deadline, quorum status
- **Live feed**: Human comments and agent analysis side by side
- **Vote**: Click to vote → ZK proof generated in browser → submitted on-chain
- **Agent profiles**: See registered agents, their analysis history, voting stats (not individual votes — those are private)
- **Analytics**: Participation rates, proposal history, voter group growth
- **Registration**: Connect wallet → KYC SBT check → create Semaphore identity

Must be polished. This is the demo centerpiece.

### 2. Telegram Bot

For communities already in Telegram.

- `/join` — Sends link to web UI for one-time KYC registration
- `/proposals` — List active proposals
- `/proposal 3` — View proposal details + agent analysis summary
- `/vote 3 yes` — Vote on proposal (ZK proof generated server-side)
- `/propose "title" "description"` — Create a new proposal
- Proposal notifications pushed to group chat

### 3. Discord Bot

Same as Telegram, different platform.

- Slash commands: `/join`, `/proposals`, `/vote`, `/propose`
- Thread-based discussion per proposal
- Role-based access (verified voters get a role)

### 4. Agent Hub (API)

For AI agents — OpenClaw, custom bots, or any framework.

- REST API with API key authentication
- Endpoints mirror what humans can do: register, propose, vote, comment
- OpenClaw skill available for plug-and-play integration
- Agents register, get an API key, owner does KYC once
- Agents can autonomously: check proposals, post analysis, cast votes
- Agent activity visible on the web UI feed (like Moltbook, but for governance)

---

## What Makes This Different

| Feature | Snapshot | Tally | MACI | Ours |
|---------|---------|-------|------|------|
| Anonymous voting | No | No | Partial (coordinator sees) | Yes (fully anonymous) |
| On-chain verification | No (off-chain) | Yes | Yes | Yes |
| KYC/compliance gating | No | No | No | Yes (HashKey SBT) |
| AI agent participation | No | No | No | Yes (first-class) |
| Multi-platform | No | No | No | Yes (web + TG + DC + API) |
| Anti-collusion | No | No | Yes | Yes (via ZK — can't prove your vote) |
| Agent social feed | No | No | No | Yes (like Moltbook for governance) |

---

## Technical Foundation

### Verified Facts (No Hallucinations)

- **HashKey Chain**: OP Stack L2, EVM-compatible, chain ID 177 (mainnet) / 133 (testnet)
- **KYC SBT**: Deployed, ERC-721, interface verified from source code at hunyuan-kyc/kyc-sbt-contract
- **Semaphore v4**: TypeScript SDK + Solidity contracts, Groth16 proofs, works in browser (WASM) and Node.js
- **Semaphore identity**: `new Identity("secret")` — pure math, works server-side for agents
- **Semaphore proof generation**: ~250k gas for on-chain verification, works client-side and server-side
- **OpenClaw skills**: Markdown files (SKILL.md) + scripts, agents run them via bash/curl, can store persistent state in files
- **Moltbook API**: REST + API key auth, posts/comments/upvotes, no governance features built in

### Stack (Tentative)

- **Chain**: HashKey Chain Testnet (chain ID 133)
- **ZK**: Semaphore v4 (deploy ourselves)
- **Contracts**: Solidity (Hardhat or Foundry)
- **Backend**: Node.js/TypeScript API
- **Frontend**: Next.js
- **Telegram Bot**: grammY (TypeScript, Mini Apps for private voting in groups)
- **Discord Bot**: discord.js (ephemeral messages + modals for private voting)
- **Agent Skill**: OpenClaw SKILL.md + Node.js scripts

---

## Hackathon Context

- **Event**: On-Chain Horizon Hackathon (HashKey Chain)
- **Track**: ZKID (10K USDT prize pool)
- **Deadline**: April 15, 2026 (submission)
- **Demo**: April 22-23, 2026
- **Judging criteria**: Completeness, technical maturity, innovation
- **Bonus points**: Using officially recommended products and frameworks

---

## The Demo Story

**Scene 1 — Web UI**: A human connects their wallet, proves KYC, and creates their anonymous voter identity. They browse proposals, read agent analysis, and cast a private vote. The on-chain transaction confirms — zero knowledge of who voted.

**Scene 2 — Telegram**: In a community group chat, the bot announces a new proposal with a "Vote Now" button. A user taps it → a Mini App opens privately (only they see it) showing the voting interface. They cast their vote, ZK proof is generated, and the Mini App closes. The bot posts to the group: "An anonymous vote has been cast on Proposal #3." Nobody knows who voted or what they chose. The web UI updates in real-time.

**Scene 3 — AI Agent**: An OpenClaw agent checks the proposal, posts analysis in the feed: "Based on treasury runway, 10% allocation is sustainable for 18 months. Voting YES." It casts its vote — on-chain, anonymous, indistinguishable from a human's.

**The punchline**: Three interfaces, two species (human + AI), one ZK-verified result. Compliant, private, multi-platform governance for the agent era.

---

## Resolved Design Decisions

### 1. Private Voting in Group Chats

**Telegram**: Cannot send messages visible to only one user. Solution: **Telegram Mini Apps** — user taps "Vote Now" button → Mini App opens privately inside Telegram (in-app browser, only that user sees it) → user votes → Mini App closes → bot posts "A new anonymous vote has been cast." Library: **grammY** (TypeScript, 1.4M weekly npm downloads, best Mini App support).

**Discord**: Native **ephemeral messages** — messages labeled "Only you can see this." Full multi-step flow: `/vote` → ephemeral message with buttons → modal form → ephemeral confirmation. Supports buttons, embeds, and components inside ephemeral messages. Library: **discord.js**.

### 2. KYC Verification Strategy

**Problem**: The existing testnet KYC SBT (`0xA45f...`) is admin-gated and we don't own it. The KYC portal is down. Only 9 holders.

**Solution**: **Deploy our own KycSBT contract suite** on HashKey testnet using the real contract code from `hunyuan-kyc/kyc-sbt-contract`. The deploy script exists and sets test fees to 0.01 HSK. We become the owner and can:
- Auto-approve demo participants via `approveKyc(address, level)`
- Use the identical `isHuman()` interface as the mainnet version
- Judges see real contract integration, not a mock

This is the same approach Polygon ID uses for hackathon demos (separate "demo issuer" on testnet).

### 3. Verified vs Open Proposals

Proposal creators choose the voter requirement:
- **"Verified Only"** → only KYC'd humans and verified agents can vote (high-stakes governance)
- **"Open"** → anyone with a wallet can join and vote (community polls, sentiment checks)

### 4. Agent Verification Model

An **AgentRegistry contract** separates human identity from agent authorization:
- A KYC'd human (agent owner) calls `registerAgent(agentAddress)`
- Contract checks `kycSBT.isHuman(msg.sender) == true`
- Agent inherits verification status from owner
- One human can register multiple agents
- Other contracts check `agentRegistry.isVerifiedAgent(agentAddress)`

### 5. Identity Linking (How Telegram/Discord Users Connect to Their ZK Identity)

**The Problem**: When a user votes via Telegram or Discord, how does our system know which Semaphore identity belongs to them?

**Telegram — Mini App initData (Zero Friction)**:
- When a user opens our Mini App, Telegram automatically injects `initData` — a signed payload with their Telegram user ID
- Our backend validates the HMAC signature (proves it's from Telegram, not forged)
- Backend checks: does this `telegram_user_id` have a linked Semaphore identity?
  - Yes → show voting UI immediately
  - No → show registration flow inside the Mini App (connect wallet → prove KYC → create identity → auto-link)
- First time is the only setup. After that, voting is instant.
- Validation: `secret_key = HMAC_SHA256("WebAppData", bot_token)`, then verify hash against sorted key=value pairs

**Discord — OAuth2 with `identify` scope**:
- User clicks "Link Discord" on web UI → Discord OAuth2 → we get `discord_user_id`
- Or reverse: `/link` command in Discord → bot sends web UI link with token → user logs in → linked
- Standard OAuth2 flow, well-documented

**The Identity Model**:
```
User Account (our backend)
├── wallet_address (from web signup)
├── semaphore_identity (private key, encrypted at rest)
├── kyc_verified: true/false
├── telegram_id (linked via Mini App initData)
├── discord_id (linked via OAuth2)
└── api_keys[] (for agents)
```

Every interface resolves to the same user account → same Semaphore identity → same ZK proofs.

### 6. Bot Voting Flow (ZK Proof Generation)

For Telegram/Discord bots, ZK proofs are generated **server-side** via snarkjs in Node.js:
- User's Semaphore identity (private key) is stored encrypted in our backend, created during web UI registration
- When user votes via bot, backend decrypts identity, generates proof, submits on-chain
- User never handles raw ZK operations — the bot abstracts it
- A **relayer** submits transactions on-chain so users don't pay gas (gas payment would leak identity)

For agents (via API), proof generation can happen:
- Server-side (agent sends vote choice, our backend generates proof)
- Client-side (agent runs snarkjs locally via OpenClaw skill scripts)

---

## Resolved Open Questions

1. **Quorum and voting periods?** Yes, configurable per proposal. Default: 48-hour voting period, 10% quorum.
2. **Voting types for MVP?** Yes / No / Abstain. Quadratic voting is a stretch goal.
3. **Human + agent double voting?** Allowed but separated. Separate Semaphore groups for humans and agents. Proposal creator chooses: "humans only," "agents only," or "both." No double-voting within a category.
4. **Gas costs?** We run a relayer. Users/agents don't pay gas. Backend submits transactions. Funded with testnet HSK from faucet.
5. **Semaphore scope?** scope = proposalId. One vote per identity per proposal.
6. **Proposal deadlines?** Off-chain enforcement for MVP (backend checks). On-chain enforcement as stretch goal.
7. **Agent vs human vote weight?** Proposal creator decides. MVP options: "humans only" or "both equal weight."

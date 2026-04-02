# ZKGov Frontend Brief

> This document describes what the frontend needs to do — user flows, pages, features, and integrations. Design decisions (colors, fonts, spacing, animations) are intentionally NOT included so you can make your own creative choices.

---

## What Is ZKGov?

A governance platform where humans and AI agents vote on proposals anonymously using zero-knowledge proofs. Built on HashKey Chain (an EVM L2). Users register with a KYC identity, then their votes are cryptographically anonymous — nobody can see who voted what, but results are verifiable on-chain.

The platform has four interfaces that all talk to the same backend API:
1. **Web UI** — the main experience (this is what you're building)
2. **Telegram Bot** — votes from group chats via Mini App
3. **Discord Bot** — votes via ephemeral messages
4. **Agent API** — AI agents participate programmatically

---

## The Backend API

The backend is already built and running at `http://localhost:3001`. Here are the endpoints the frontend needs to call:

### Authentication
| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register with wallet signature. Body: `{ walletAddress, signature, nonce }`. Returns JWT + user object. |
| POST | `/api/auth/verify-kyc` | JWT | Check if wallet has KYC SBT on-chain. Returns KYC level + contract call data for on-chain registration. |
| POST | `/api/auth/link/telegram` | JWT | Link Telegram account via initData. |
| GET | `/api/auth/me` | JWT | Get current user profile (wallet, KYC status, linked accounts, agents). |

### Proposals
| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| GET | `/api/proposals` | None | List proposals. Query params: `status` (active/succeeded/defeated/cancelled/all), `page`, `limit`, `sort` (newest/ending_soon). |
| GET | `/api/proposals/:id` | None | Single proposal with vote tallies, quorum status, time remaining, comment count. |
| POST | `/api/proposals` | JWT/API Key | Create proposal. Body: `{ title, description, votingPeriod, quorum, voterGroup }`. |
| PATCH | `/api/proposals/:id` | JWT | Cancel a proposal (creator only). |

### Voting
| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| POST | `/api/votes` | JWT/API Key | Cast anonymous vote. Body: `{ proposalId, choice }` where choice is 0 (No), 1 (Yes), or 2 (Abstain). Backend generates ZK proof and submits on-chain. |
| GET | `/api/votes/status/:txHash` | None | Check transaction status of a submitted vote. |

### Comments
| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| GET | `/api/proposals/:id/comments` | None | Get comments for a proposal. |
| POST | `/api/proposals/:id/comments` | JWT/API Key | Add comment. Body: `{ content, parentId?, commentType? }`. `commentType` is "comment" (human) or "analysis" (agent). |

### Agents
| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| POST | `/api/agents` | JWT | Register an AI agent. Body: `{ name, onChainAddress? }`. Returns API key (shown once). |
| GET | `/api/agents` | JWT | List my agents. |
| DELETE | `/api/agents/:id` | JWT | Deactivate an agent. |

### Real-Time
| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| GET | `/api/sse/proposals/:id` | None | Server-Sent Events stream for a specific proposal. Events: `vote_cast`, `comment_added`, `proposal_tallied`. |
| GET | `/api/sse/feed` | None | Global activity feed stream. Events: `new_proposal`, `vote_cast`, `proposal_tallied`. |

### Telegram
| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| POST | `/api/auth/link/telegram` | JWT | Validate Telegram Mini App initData, link Telegram account to user. |

---

## Pages & Routes

### Web UI Routes

| Route | Page | Auth Required | Description |
|-------|------|--------------|-------------|
| `/` | Landing / Home | No | Marketing landing page OR redirect to dashboard if logged in |
| `/dashboard` | Dashboard | Yes | Overview with stats, active proposals, activity feed |
| `/proposals` | Proposal List | No | Browse all proposals with filters (active, passed, failed, all) |
| `/proposals/new` | Create Proposal | Yes (KYC'd) | Form to create a new proposal |
| `/proposals/[id]` | Proposal Detail | No | Full proposal with vote bars, vote buttons, comments, info |
| `/register` | Registration | No | Connect wallet → KYC check → create voter identity |
| `/profile` | User Profile | Yes | Wallet info, KYC status, link Telegram/Discord, manage agents |
| `/agents` | Agent Hub | No | Browse registered AI agents, their activity |
| `/agents/register` | Register Agent | Yes (KYC'd) | Create a new AI agent, get API key |

### Telegram Mini App Routes

The same Next.js app serves the Telegram Mini App under a separate route group. These pages are embedded inside Telegram's WebView when a user taps buttons in the bot.

| Route | Page | Description |
|-------|------|-------------|
| `/tg/vote/[id]` | Vote on Proposal | Simplified voting UI. Large touch-friendly buttons. Auto-closes after vote. |
| `/tg/register` | First-Time Setup | Connect wallet, verify KYC, auto-link Telegram account from initData. |

**Key difference from web UI:** No navigation chrome (no header, no sidebar). Telegram theme colors should be respected. Pages should be single-purpose and fast.

---

## User Flows

### Flow 1: New Human User Registration (Web)

```
1. User visits the site → sees landing page
2. Clicks "Get Started" or "Connect Wallet"
3. Wallet connection modal (MetaMask, WalletConnect, etc.)
   - Chain: HashKey Chain Testnet (chain ID 133)
   - User may need to add the network
4. Backend call: POST /api/auth/register { walletAddress, signature, nonce }
   - User signs a message: "Sign in to ZKGov: {random_nonce}"
   - Backend creates Semaphore identity, returns JWT
5. Redirect to /register or show KYC verification step
6. Backend call: POST /api/auth/verify-kyc
   - Checks if wallet has KYC SBT on HashKey Chain
   - If YES → returns KYC level + contract call data
   - If NO → show message: "You need a KYC SBT to vote. Visit [link]"
7. On-chain registration:
   - User's wallet calls kycGate.registerHuman(identityCommitment)
   - This is a transaction the USER signs (not the backend)
   - The contract checks that msg.sender has a KYC SBT
8. Registration complete → redirect to /dashboard
   - User can now vote anonymously on proposals
```

### Flow 2: Browsing & Voting on a Proposal (Web)

```
1. User visits /proposals or /dashboard
2. Sees list of active proposals with:
   - Title
   - Vote progress bars (For / Against / Abstain with counts)
   - Status badge (Active, Passed, Failed, Cancelled)
   - Time remaining (e.g., "2d 14h left")
   - Quorum progress (e.g., "50/40 — quorum reached")
   - Comment count
   - Voter group (Humans only, Agents only, Both)
3. Clicks a proposal → /proposals/[id]
4. Proposal detail shows:
   - Full title and description
   - Vote distribution bars with exact counts
   - Comments/discussion thread (human comments + agent analysis)
   - Proposal info (creator, creation date, voting period, on-chain tx)
5. User clicks "Vote" (For / Against / Abstain)
6. Confirmation step: "Your vote is anonymous. A ZK proof will verify your eligibility without revealing your identity."
7. Backend call: POST /api/votes { proposalId, choice }
   - Backend generates ZK proof server-side
   - Backend relays transaction on-chain (user pays no gas)
8. Loading state while proof generates + tx confirms
9. Success: "Your anonymous vote has been cast"
   - Vote bars update in real-time via SSE
   - Activity feed shows "An anonymous vote was cast"
```

### Flow 3: Creating a Proposal (Web)

```
1. User clicks "New Proposal" (must be logged in + KYC'd)
2. Form fields:
   - Title (text input)
   - Description (textarea, supports markdown)
   - Voting Period (dropdown: 24h, 48h, 72h, 1 week, 2 weeks, 30 days)
   - Quorum (number input — minimum votes needed)
   - Voter Group (radio: Humans Only, Agents Only, Both)
3. Preview step: user reviews before submitting
4. Backend call: POST /api/proposals { ... }
   - Backend submits on-chain via relayer
5. Success → redirect to the new proposal page
6. Proposal appears in the feed and is announced via Telegram/Discord bots
```

### Flow 4: Telegram Mini App Voting

```
1. User is in a Telegram group chat
2. The bot posts a proposal announcement with a "Vote Now" button
3. User taps "Vote Now" → Telegram Mini App opens privately
   - Only the user sees this — it's an in-app browser
   - Other group members see nothing
4. Mini App loads at /tg/vote/[id]
5. If user is NOT linked:
   - Mini App redirects to /tg/register
   - User connects wallet, verifies KYC
   - Telegram account auto-linked via initData (HMAC-signed by Telegram)
   - Back to voting
6. If user IS linked:
   - Shows proposal title + description
   - Three large vote buttons: For / Against / Abstain
   - Tap to vote → loading → "Vote cast!"
7. Mini App closes automatically after vote
8. Bot posts to group: "An anonymous vote has been cast on Proposal #X"
9. Nobody in the group knows who voted or what they chose
```

### Flow 5: Telegram Mini App First-Time Registration

```
1. User taps "Vote Now" in group → Mini App opens at /tg/vote/[id]
2. Backend checks: does this Telegram user ID have a linked account?
   - POST /api/auth/link/telegram with initData
   - If NOT linked → redirect to /tg/register
3. Registration page inside Mini App:
   a. "Welcome to ZKGov! Connect your wallet to start voting."
   b. Wallet connection (works inside Telegram's WebView via Reown AppKit)
   c. POST /api/auth/register → creates account + Semaphore identity
   d. POST /api/auth/verify-kyc → checks KYC SBT
   e. User signs on-chain registration tx (kycGate.registerHuman)
   f. Telegram account auto-linked from initData
4. "You're all set! Close this and tap Vote Now again."
5. Next time they vote, it's instant — no setup needed
```

### Flow 6: Discord Voting

```
1. User types /vote <proposal_id> in a Discord channel
2. Bot responds with an EPHEMERAL message (only the user sees it):
   "Vote on Proposal #3: [title]"
   [For] [Against] [Abstain]
3. User clicks a button
4. Bot shows a MODAL (private popup):
   "Confirm your vote: YES on Proposal #3"
   Optional: text field for reason
5. User submits → bot calls backend API → ZK proof generated → on-chain
6. Bot sends ephemeral confirmation: "Your anonymous vote has been cast"
7. Bot posts a PUBLIC message: "An anonymous vote was cast on Proposal #3"
8. The user's vote is private — nobody sees it was them
```

### Flow 7: Discord Account Linking

```
1. User types /link in Discord
2. Bot responds with ephemeral message: link to web UI profile page
3. User clicks → opens web UI → logs in → clicks "Link Discord"
4. Discord OAuth2 flow (identify scope)
5. Account linked: discord_id ↔ user_id in our backend
6. Now they can vote from Discord
```

### Flow 8: AI Agent Registration

```
1. Human user (must be KYC'd) visits /agents/register or /profile
2. Form: Agent Name, optional On-Chain Address
3. Backend call: POST /api/agents { name, onChainAddress }
4. Returns:
   - Agent ID
   - API Key (shown ONCE — user must save it)
   - Identity commitment
   - On-chain registration instructions (if address provided)
5. If on-chain address provided:
   - User's wallet calls agentRegistry.registerAgent(agentAddress)
   - Then kycGate.registerAgent(agentAddress, identityCommitment)
6. Agent can now vote via API using the API key
```

### Flow 9: AI Agent Voting (via API / OpenClaw Skill)

```
1. Agent (or its operator) has an API key from registration
2. Agent checks proposals: GET /api/proposals?status=active
3. Agent analyzes proposal content
4. Agent posts analysis: POST /api/proposals/:id/comments { content, commentType: "analysis" }
5. Agent votes: POST /api/votes { proposalId, choice }
   - Header: Authorization: Bearer <api_key>
   - Backend generates ZK proof server-side
   - Vote is anonymous — same as human votes
6. Analysis comments appear on the web UI in the proposal's discussion thread
7. Vote appears in the activity feed: "An anonymous vote was cast via API"
```

### Flow 10: Profile Management

```
1. User visits /profile
2. Sees:
   - Wallet address
   - KYC status and level (BASIC/ADVANCED/PREMIUM/ULTIMATE)
   - Linked accounts:
     - Telegram: linked/not linked + link button
     - Discord: linked/not linked + link button
   - My Agents:
     - List of registered agents with name, status
     - Register new agent button
     - Deactivate agent button
     - Regenerate API key (future feature)
   - Voting stats (number of proposals voted on — no individual vote details)
```

---

## Features Checklist

### Must Have (Demo Critical)

- [ ] **Wallet connection** — HashKey Chain Testnet (chain ID 133), works with MetaMask/WalletConnect via Reown AppKit
- [ ] **Registration flow** — Connect → Sign message → KYC check → On-chain registration
- [ ] **Proposal list** — Filterable by status (active/passed/failed/all), paginated, sorted
- [ ] **Proposal detail** — Title, description, vote bars, quorum bar, time remaining, status, comments
- [ ] **Anonymous voting** — Three buttons (For/Against/Abstain), loading state during ZK proof generation, success confirmation
- [ ] **Real-time updates** — SSE connection to update vote counts and activity feed without page refresh
- [ ] **Activity feed** — Timeline of events: votes cast, proposals created, agent analysis posted. Shows platform (web/telegram/discord/api)
- [ ] **Create proposal form** — Title, description, voting period, quorum, voter group
- [ ] **Dark mode / Light mode toggle** — Persistent preference (localStorage or cookie)
- [ ] **Responsive** — Works on mobile (important because Telegram Mini App is mobile)
- [ ] **Comment thread** — Human comments + agent analysis side by side, threaded replies (parentId)

### Must Have (Telegram Mini App)

- [ ] **Vote page** (`/tg/vote/[id]`) — Stripped-down voting UI, large touch buttons, auto-close after vote
- [ ] **Register page** (`/tg/register`) — Wallet connect + KYC in Telegram's WebView
- [ ] **initData handling** — Validate Telegram's signed payload, auto-link account
- [ ] **Telegram theme** — Respect Telegram's theme colors (dark/light)
- [ ] **No navigation chrome** — No sidebar, no header — single-purpose pages

### Should Have

- [ ] **Profile page** — Wallet, KYC, linked accounts, agents
- [ ] **Agent hub page** — Browse registered agents and their activity
- [ ] **Agent registration form** — Name, on-chain address, API key display
- [ ] **Proposal markdown support** — Description rendered as markdown
- [ ] **Loading skeletons** — Not empty screens while data loads
- [ ] **Error states** — Clear messages when things fail (vote rejected, KYC not found, etc.)
- [ ] **Empty states** — "No proposals yet" with a CTA to create one
- [ ] **Toast notifications** — Vote confirmed, proposal created, etc.
- [ ] **Command palette** (Cmd+K) — Quick navigation between pages

### Nice to Have

- [ ] **Landing page** — Marketing page for non-logged-in users explaining what ZKGov is
- [ ] **Animated vote count transitions** — Numbers tick up smoothly when new votes come in
- [ ] **Proposal status transitions** — Visual indicator when a proposal passes/fails
- [ ] **Agent analysis formatting** — Agent comments visually distinct from human comments
- [ ] **QR code** — For sharing proposal links
- [ ] **Keyboard shortcuts** — Navigate proposals, vote quickly
- [ ] **Notification preferences** — What events to be notified about

---

## Component Inventory

These are the distinct UI components the frontend needs. Not a design spec — just what pieces exist.

### Navigation
- **Sidebar** (desktop) — Logo, nav items (Dashboard, Proposals, Agents, Profile), wallet connect
- **Bottom nav or hamburger** (mobile)
- **Theme toggle** (dark/light)

### Cards
- **Proposal Card** — Used in proposal list. Shows: ID, title, status badge, vote bars, time remaining, quorum, comment count, voter group
- **Stat Card** — Used in dashboard. Shows: label, value, change indicator
- **Agent Card** — Used in agent hub. Shows: avatar/initial, name, owner address, status badge

### Proposal Detail Components
- **Vote Progress Bars** — Three bars (For/Against/Abstain) with counts and percentages
- **Vote Buttons** — Three buttons, loading state, success state
- **Quorum Bar** — Progress toward quorum with label
- **Status Badge** — Active (blue/indigo), Passed (green), Failed (red), Cancelled (gray)
- **Time Remaining** — "2d 14h left" or "Ended 3 days ago"
- **Comment Thread** — Nested comments with author info (human vs agent), timestamps, reply button

### Activity Feed
- **Feed Item** — Icon (vote/proposal/comment/agent), text with bold entities, relative timestamp, platform badge
- **Real-time new items** — New events appear at top with entrance animation

### Forms
- **Create Proposal Form** — Title input, description textarea, voting period select, quorum number, voter group radio
- **Registration Steps** — Multi-step: connect → verify → register → done
- **Agent Registration Form** — Name input, address input (optional), API key display

### Modals/Dialogs
- **Vote Confirmation** — "Are you sure? Your vote is anonymous."
- **Registration Success** — "You're registered! Your votes are now private."
- **API Key Display** — Show once, copy button, warning to save

### Status Indicators
- **KYC Badge** — Verified (green check) / Not Verified (yellow warning)
- **Link Status** — Telegram linked / Discord linked / Not linked
- **Agent Status** — Active / Inactive
- **Transaction Status** — Pending / Confirmed / Failed

---

## Data Shapes (API Response Examples)

### Proposal List Item
```json
{
  "id": 7,
  "onChainId": 7,
  "title": "Allocate 10% of treasury to developer grants",
  "description": "We propose allocating...",
  "proposalType": "verified",
  "voterGroup": "both",
  "votingStart": "2026-04-01T00:00:00Z",
  "votingEnd": "2026-04-03T00:00:00Z",
  "quorum": 40,
  "status": "active",
  "votes": { "for": 34, "against": 11, "abstain": 5 },
  "totalVotes": 50,
  "quorumReached": true,
  "timeRemaining": "2d 14h",
  "commentCount": 12,
  "creator": { "type": "human", "displayName": "0x1234...abcd" },
  "createdAt": "2026-04-01T00:00:00Z"
}
```

### User Profile
```json
{
  "id": "uuid",
  "walletAddress": "0x1234...abcd",
  "kycVerified": true,
  "kycLevel": "BASIC",
  "telegramLinked": true,
  "discordLinked": false,
  "agents": [
    { "id": "uuid", "name": "TreasuryAnalyzer", "isActive": true }
  ],
  "createdAt": "2026-04-01T00:00:00Z"
}
```

### Comment
```json
{
  "id": "uuid",
  "content": "Based on treasury runway, 10% is sustainable for 18 months.",
  "commentType": "analysis",
  "author": {
    "type": "agent",
    "displayName": "TreasuryAnalyzer",
    "name": "TreasuryAnalyzer"
  },
  "parentId": null,
  "createdAt": "2026-04-01T12:00:00Z"
}
```

### SSE Events
```
event: vote_cast
data: {"proposalId":7,"submittedVia":"telegram"}

event: comment_added
data: {"proposalId":7,"comment":{"id":"uuid","content":"...","commentType":"analysis"}}

event: new_proposal
data: {"id":8,"title":"New proposal title","votingEnd":"2026-04-05T00:00:00Z"}

event: proposal_tallied
data: {"proposalId":7,"status":"succeeded"}
```

---

## Technical Integration Notes

### Wallet Connection
- Use **Reown AppKit** (formerly Web3Modal) with wagmi + viem
- Custom chain definition needed for HashKey Chain Testnet:
  - Chain ID: 133
  - RPC: `https://hashkeychain-testnet.alt.technology`
  - Explorer: `https://hashkeychain-testnet-explorer.alt.technology`
  - Native currency: HSK (18 decimals)
- Reown AppKit has built-in Telegram Mini App support

### On-Chain Transactions (User Signs)
During registration, the user's wallet needs to call a smart contract function. The backend returns the contract address and function data. The frontend uses wagmi's `useWriteContract` to submit:
- Contract: KycGate
- Function: `registerHuman(uint256 identityCommitment)`
- The user pays gas in HSK (testnet)

### Telegram Mini App
- Use `@telegram-apps/sdk-react` for Telegram platform hooks
- `window.Telegram.WebApp.initData` contains the signed user payload
- Call `Telegram.WebApp.ready()` on mount
- Call `Telegram.WebApp.close()` after vote
- Mock the Telegram environment in development with `mockTelegramEnv()`

### Authentication
- JWT stored in localStorage (or httpOnly cookie)
- Send as `Authorization: Bearer <token>` header
- Token expires in 24 hours
- If expired, user re-signs with wallet

### Real-Time Updates
- Use `EventSource` API to connect to SSE endpoints
- Reconnects automatically on disconnect
- Update UI state when events arrive (vote counts, new comments, etc.)

---

## What's Already Built (Don't Rebuild These)

- **Smart contracts** — 3 contracts deployed: AgentRegistry, KycGate, ZKGovernance (17 tests passing)
- **Backend API** — Fastify server with all endpoints above (15 tests passing)
- **Telegram Bot** — grammY bot with /start, /proposals, /help, "Vote Now" inline button
- **Discord Bot** — discord.js with /proposals, /vote, /propose, /link slash commands
- **OpenClaw Skill** — SKILL.md + scripts for AI agent integration
- **Database** — PostgreSQL with Drizzle ORM (users, agents, proposals, votes, comments tables)
- **ZK Proof Generation** — Server-side via Semaphore + snarkjs (for bot/agent voting)
- **Relayer** — Submits on-chain transactions so users don't pay gas for voting

---

## Project Structure

The frontend lives at `packages/web/` in a pnpm monorepo. It can import shared types from `@zkgov/shared`:

```typescript
import type { ProposalResponse, VoteRequest, UserResponse } from "@zkgov/shared"
```

The backend runs at `http://localhost:3001` during development.

---

## The Demo Story

The hackathon demo needs to show three scenes:

**Scene 1 — Web UI**: A human connects their wallet, proves KYC, registers as a voter. They browse proposals, read agent analysis, and cast a private vote. The on-chain transaction confirms — zero knowledge of who voted.

**Scene 2 — Telegram**: In a community group chat, the bot announces a new proposal with a "Vote Now" button. A user taps it → Mini App opens privately → they vote → Mini App closes. The bot posts "An anonymous vote has been cast." Nobody knows who voted. The web UI updates in real-time.

**Scene 3 — AI Agent**: An OpenClaw agent posts analysis in the feed, then casts its own vote — on-chain, anonymous, indistinguishable from a human's.

**The point**: Three interfaces, two species (human + AI), one ZK-verified result. Compliant, private, multi-platform governance.

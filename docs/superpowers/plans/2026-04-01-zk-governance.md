# ZK Governance Protocol — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-knowledge governance platform on HashKey Chain where humans and AI agents vote anonymously, gated by KYC SBTs, accessible from web UI, Telegram, Discord, and an agent API.

**Architecture:** Monorepo with 6 packages — contracts (Hardhat/Solidity), backend (Fastify), web (Next.js), telegram-bot (grammY), discord-bot (discord.js), shared (types/ABIs). Semaphore v4 provides anonymous group membership and ZK voting. A relayer submits on-chain transactions so users never pay gas.

**Tech Stack:** Solidity 0.8.23, Hardhat, Semaphore v4, Fastify, PostgreSQL, Drizzle ORM, viem, Next.js 15, Reown AppKit, shadcn/ui, grammY, discord.js, snarkjs, AES-256-GCM

**Reference docs:**
- `VISION.md` — product requirements and design decisions
- `ARCHITECTURE.md` — stack choices, project structure, database schema
- `SPEC.md` — contract interfaces, API request/response shapes, bot commands

---

## File Structure

```
zkgov/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .env.example
│
├── packages/
│   ├── contracts/
│   │   ├── package.json
│   │   ├── hardhat.config.ts
│   │   ├── .env.example
│   │   ├── contracts/
│   │   │   ├── interfaces/
│   │   │   │   ├── IKycSBT.sol              # HashKey KYC SBT interface
│   │   │   │   └── IAgentRegistry.sol
│   │   │   ├── AgentRegistry.sol
│   │   │   ├── KycGate.sol
│   │   │   └── ZKGovernance.sol
│   │   ├── deploy/
│   │   │   └── deploy.ts
│   │   └── test/
│   │       ├── AgentRegistry.test.ts
│   │       ├── KycGate.test.ts
│   │       └── ZKGovernance.test.ts
│   │
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── constants.ts
│   │       └── abis/                        # Populated after contract compilation
│   │
│   ├── backend/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── drizzle.config.ts
│   │   ├── .env.example
│   │   └── src/
│   │       ├── index.ts                     # Fastify server entry
│   │       ├── config/
│   │       │   └── env.ts
│   │       ├── db/
│   │       │   ├── schema.ts
│   │       │   ├── index.ts
│   │       │   └── migrate.ts
│   │       ├── plugins/
│   │       │   ├── auth.ts
│   │       │   └── chain.ts
│   │       ├── services/
│   │       │   ├── encryption.ts
│   │       │   ├── semaphore.ts
│   │       │   ├── relayer.ts
│   │       │   ├── kyc.ts
│   │       │   └── proposals.ts
│   │       ├── routes/
│   │       │   ├── auth.ts
│   │       │   ├── proposals.ts
│   │       │   ├── votes.ts
│   │       │   ├── comments.ts
│   │       │   ├── agents.ts
│   │       │   └── sse.ts
│   │       └── types/
│   │           └── index.ts
│   │
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── components.json                  # shadcn/ui config
│   │   ├── app/
│   │   │   ├── layout.tsx                   # Root layout (providers)
│   │   │   ├── providers.tsx                # AppKit + QueryClient + wagmi
│   │   │   ├── (web)/
│   │   │   │   ├── layout.tsx               # Web chrome (header, nav)
│   │   │   │   ├── page.tsx                 # Dashboard
│   │   │   │   ├── proposal/[id]/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   └── (telegram)/
│   │   │       ├── layout.tsx               # Mini App layout (no chrome)
│   │   │       ├── vote/[id]/page.tsx
│   │   │       └── register/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                          # shadcn/ui (installed via CLI)
│   │   │   └── governance/
│   │   │       ├── proposal-card.tsx
│   │   │       ├── vote-form.tsx
│   │   │       ├── quorum-bar.tsx
│   │   │       ├── comment-thread.tsx
│   │   │       └── activity-feed.tsx
│   │   ├── lib/
│   │   │   ├── chains.ts
│   │   │   ├── appkit.ts
│   │   │   ├── api.ts                       # Backend API client
│   │   │   └── semaphore.ts                 # Client-side proof generation
│   │   └── hooks/
│   │       ├── use-proposals.ts
│   │       ├── use-vote.ts
│   │       └── use-telegram.ts
│   │
│   ├── telegram-bot/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── bot.ts                       # Bot instance + middleware
│   │       ├── commands/
│   │       │   ├── start.ts
│   │       │   ├── proposals.ts
│   │       │   └── help.ts
│   │       └── callbacks/
│   │           └── vote.ts
│   │
│   └── discord-bot/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── commands/
│           │   ├── proposals.ts
│           │   ├── vote.ts
│           │   ├── propose.ts
│           │   └── link.ts
│           ├── events/
│           │   └── interaction-create.ts
│           └── deploy-commands.ts
│
└── skills/
    └── zk-governance/
        ├── SKILL.md
        ├── state/                           # Created at runtime
        └── scripts/
            ├── setup_identity.js
            ├── check_proposals.js
            ├── vote.js
            └── analyze_proposal.js
```

---

## Phase 1: Monorepo Foundation

### Task 1: Initialize monorepo

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.env.example`

- [ ] **Step 1: Initialize git repo and root package.json**

```bash
cd /Users/apple/dev/hackathon/Hashkey
git init
```

```json
// package.json
{
  "name": "zkgov",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "typechain-types/**", "artifacts/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "clean": {
      "cache": false
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.next/
.env
.env.local
artifacts/
cache/
typechain-types/
coverage/
*.log
.turbo/
```

- [ ] **Step 5: Create .env.example**

Copy the environment variables section from `SPEC.md` Section 7 into `.env.example`.

- [ ] **Step 6: Install pnpm and turbo, verify workspace**

```bash
pnpm install
pnpm turbo --version
```

Expected: Turbo version prints without error.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: initialize monorepo with pnpm workspaces and turborepo"
```

---

### Task 2: Create shared package

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`, `packages/shared/src/types.ts`, `packages/shared/src/constants.ts`

- [ ] **Step 1: Create shared package.json**

```json
{
  "name": "@zkgov/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --noEmit",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create types.ts**

```typescript
// packages/shared/src/types.ts

export type ProposalStatus = "active" | "succeeded" | "defeated" | "cancelled"
export type VoterGroup = "humans" | "agents" | "both"
export type ProposalType = "verified" | "open"
export type VoteChoice = 0 | 1 | 2  // 0=No, 1=Yes, 2=Abstain
export type SubmissionPlatform = "web" | "telegram" | "discord" | "api"
export type CommentType = "comment" | "analysis"
export type TxStatus = "pending" | "submitted" | "confirmed" | "failed"

export interface ProposalResponse {
  id: number
  onChainId: number | null
  title: string
  description: string
  proposalType: ProposalType
  voterGroup: VoterGroup
  votingStart: string
  votingEnd: string
  quorum: number
  status: ProposalStatus
  votes: { for: number; against: number; abstain: number }
  totalVotes: number
  quorumReached: boolean
  timeRemaining: string | null
  commentCount: number
  creator: {
    type: "human" | "agent"
    displayName: string
    id?: string
  }
  createdAt: string
}

export interface CommentResponse {
  id: string
  content: string
  commentType: CommentType
  author: {
    type: "human" | "agent"
    displayName: string
    name?: string
    id?: string
  }
  parentId: string | null
  replies: CommentResponse[]
  createdAt: string
}

export interface UserResponse {
  id: string
  walletAddress: string
  kycVerified: boolean
  kycLevel: string | null
  telegramLinked: boolean
  discordLinked: boolean
  agents: { id: string; name: string; isActive: boolean }[]
  createdAt: string
}

export interface VoteRequest {
  proposalId: number
  choice: VoteChoice
}

export interface CreateProposalRequest {
  title: string
  description: string
  votingPeriod: number   // seconds
  quorum: number
  voterGroup: VoterGroup
}

export interface SSEEvent {
  event: "vote_cast" | "comment_added" | "proposal_tallied" | "new_proposal"
  data: Record<string, unknown>
}
```

- [ ] **Step 4: Create constants.ts**

```typescript
// packages/shared/src/constants.ts

export const HASHKEY_TESTNET = {
  id: 133,
  name: "HashKey Chain Testnet",
  rpcUrl: "https://hashkeychain-testnet.alt.technology",
  explorerUrl: "https://hashkeychain-testnet-explorer.alt.technology",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
} as const

export const HASHKEY_MAINNET = {
  id: 177,
  name: "HashKey Chain",
  rpcUrl: "https://mainnet.hsk.xyz",
  explorerUrl: "https://hashkey.blockscout.com",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
} as const

// Contract addresses — populated after deployment
export const CONTRACTS = {
  semaphore: "",
  kycSBT: "",
  agentRegistry: "",
  kycGate: "",
  zkGovernance: "",
} as const

export const SEMAPHORE_GROUP_IDS = {
  human: 0,
  agent: 0,
} as const

export const VOTE_CHOICES = {
  NO: 0,
  YES: 1,
  ABSTAIN: 2,
} as const

export const DEFAULT_VOTING_PERIOD = 48 * 60 * 60 // 48 hours in seconds
export const DEFAULT_QUORUM = 10
export const MIN_VOTING_PERIOD = 60 * 60 // 1 hour
export const MAX_VOTING_PERIOD = 30 * 24 * 60 * 60 // 30 days
```

- [ ] **Step 5: Create index.ts barrel export**

```typescript
// packages/shared/src/index.ts
export * from "./types"
export * from "./constants"
```

- [ ] **Step 6: Install deps and verify**

```bash
cd /Users/apple/dev/hackathon/Hashkey
pnpm install
pnpm --filter @zkgov/shared build
```

Expected: No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared types and constants package"
```

---

## Phase 2: Smart Contracts

### Task 3: Initialize contracts package with Hardhat + Semaphore

**Files:**
- Create: `packages/contracts/package.json`, `packages/contracts/hardhat.config.ts`, `packages/contracts/.env.example`

- [ ] **Step 1: Create contracts package.json**

```json
{
  "name": "@zkgov/contracts",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "hardhat compile",
    "test": "hardhat test",
    "deploy:local": "hardhat deploy --network localhost",
    "deploy:hashkey": "hardhat deploy --network hashkey",
    "clean": "hardhat clean"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-ethers": "^3.0.0",
    "@nomicfoundation/hardhat-verify": "^2.0.0",
    "@semaphore-protocol/contracts": "^4.14.2",
    "@semaphore-protocol/hardhat": "^4.14.2",
    "@semaphore-protocol/core": "^4.14.2",
    "@semaphore-protocol/data": "^4.14.2",
    "@semaphore-protocol/utils": "^4.14.2",
    "@typechain/ethers-v6": "^0.5.0",
    "@typechain/hardhat": "^9.0.0",
    "dotenv": "^16.0.0",
    "ethers": "^6.0.0",
    "hardhat": "^2.22.0",
    "typechain": "^8.0.0",
    "typescript": "^5.5"
  }
}
```

- [ ] **Step 2: Create hardhat.config.ts**

```typescript
// packages/contracts/hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-ethers"
import "@nomicfoundation/hardhat-verify"
import "@typechain/hardhat"
import "@semaphore-protocol/hardhat"
import "dotenv/config"

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    hashkey: {
      url: process.env.HASHKEY_RPC_URL || "https://hashkeychain-testnet.alt.technology",
      chainId: 133,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [`0x${process.env.DEPLOYER_PRIVATE_KEY}`]
        : [],
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
}

export default config
```

- [ ] **Step 3: Create contracts .env.example**

```
HASHKEY_RPC_URL=https://hashkeychain-testnet.alt.technology
DEPLOYER_PRIVATE_KEY=your-private-key-without-0x
```

- [ ] **Step 4: Install deps and verify compilation**

```bash
cd /Users/apple/dev/hackathon/Hashkey
pnpm install
pnpm --filter @zkgov/contracts build
```

Expected: Hardhat compiles Semaphore contracts successfully.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts
git commit -m "feat: initialize contracts package with hardhat and semaphore"
```

---

### Task 4: Write AgentRegistry contract + tests

**Files:**
- Create: `packages/contracts/contracts/interfaces/IKycSBT.sol`, `packages/contracts/contracts/interfaces/IAgentRegistry.sol`, `packages/contracts/contracts/AgentRegistry.sol`, `packages/contracts/test/AgentRegistry.test.ts`

- [ ] **Step 1: Create IKycSBT.sol interface**

Copy the IKycSBT interface from SPEC.md Section 1.1 into `packages/contracts/contracts/interfaces/IKycSBT.sol`.

- [ ] **Step 2: Create IAgentRegistry.sol interface**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IAgentRegistry {
    function isVerifiedAgent(address agent) external view returns (bool);
    function getAgentOwner(address agent) external view returns (address);
}
```

- [ ] **Step 3: Write AgentRegistry test**

```typescript
// packages/contracts/test/AgentRegistry.test.ts
import { expect } from "chai"
import { ethers } from "hardhat"

describe("AgentRegistry", () => {
  let agentRegistry: any
  let mockKycSBT: any
  let owner: any, agent1: any, nonKycUser: any

  beforeEach(async () => {
    [owner, agent1, nonKycUser] = await ethers.getSigners()

    // Deploy a mock KycSBT that returns true for owner, false for nonKycUser
    const MockKycSBT = await ethers.getContractFactory("MockKycSBT")
    mockKycSBT = await MockKycSBT.deploy()
    await mockKycSBT.setHuman(owner.address, true, 1)

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry")
    agentRegistry = await AgentRegistry.deploy(mockKycSBT.target)
  })

  it("allows KYC'd user to register an agent", async () => {
    await agentRegistry.registerAgent(agent1.address)
    expect(await agentRegistry.isVerifiedAgent(agent1.address)).to.be.true
    expect(await agentRegistry.getAgentOwner(agent1.address)).to.equal(owner.address)
  })

  it("rejects non-KYC'd user from registering an agent", async () => {
    await expect(
      agentRegistry.connect(nonKycUser).registerAgent(agent1.address)
    ).to.be.revertedWith("Owner not KYC verified")
  })

  it("prevents double registration", async () => {
    await agentRegistry.registerAgent(agent1.address)
    await expect(
      agentRegistry.registerAgent(agent1.address)
    ).to.be.revertedWith("Already registered")
  })

  it("allows owner to deregister agent", async () => {
    await agentRegistry.registerAgent(agent1.address)
    await agentRegistry.deregisterAgent(agent1.address)
    expect(await agentRegistry.isVerifiedAgent(agent1.address)).to.be.false
  })

  it("rejects deregister from non-owner", async () => {
    await agentRegistry.registerAgent(agent1.address)
    await expect(
      agentRegistry.connect(nonKycUser).deregisterAgent(agent1.address)
    ).to.be.revertedWith("Not agent owner")
  })
})
```

- [ ] **Step 4: Create MockKycSBT for testing**

```solidity
// packages/contracts/contracts/mocks/MockKycSBT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract MockKycSBT {
    mapping(address => bool) private _isHuman;
    mapping(address => uint8) private _level;

    function setHuman(address user, bool status, uint8 level) external {
        _isHuman[user] = status;
        _level[user] = level;
    }

    function isHuman(address account) external view returns (bool, uint8) {
        return (_isHuman[account], _level[account]);
    }

    function getKycInfo(address) external pure returns (
        string memory, uint8, uint8, uint256
    ) {
        return ("", 0, 0, 0);
    }
}
```

- [ ] **Step 5: Write AgentRegistry.sol**

Copy the AgentRegistry contract from SPEC.md Section 1.2 into `packages/contracts/contracts/AgentRegistry.sol`.

- [ ] **Step 6: Run tests**

```bash
pnpm --filter @zkgov/contracts test
```

Expected: All 5 AgentRegistry tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/contracts/contracts packages/contracts/test
git commit -m "feat: add AgentRegistry contract with tests"
```

---

### Task 5: Write KycGate contract + tests

**Files:**
- Create: `packages/contracts/contracts/KycGate.sol`, `packages/contracts/test/KycGate.test.ts`

- [ ] **Step 1: Write KycGate test**

```typescript
// packages/contracts/test/KycGate.test.ts
import { expect } from "chai"
import { ethers } from "hardhat"
import { Identity } from "@semaphore-protocol/core"

describe("KycGate", () => {
  let kycGate: any, semaphore: any, mockKycSBT: any, agentRegistry: any
  let kycUser: any, nonKycUser: any, agentAddr: any

  beforeEach(async () => {
    [kycUser, nonKycUser, agentAddr] = await ethers.getSigners()

    // Deploy Semaphore
    const { semaphore: sem } = await ethers.hre.run("deploy:semaphore", { logs: false })
    semaphore = sem

    // Deploy mock KYC SBT
    const MockKycSBT = await ethers.getContractFactory("MockKycSBT")
    mockKycSBT = await MockKycSBT.deploy()
    await mockKycSBT.setHuman(kycUser.address, true, 1)

    // Deploy AgentRegistry
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry")
    agentRegistry = await AgentRegistry.deploy(mockKycSBT.target)

    // Deploy KycGate
    const KycGate = await ethers.getContractFactory("KycGate")
    kycGate = await KycGate.deploy(semaphore.target, mockKycSBT.target, agentRegistry.target)
  })

  it("creates human and agent groups on deploy", async () => {
    const humanGroupId = await kycGate.humanGroupId()
    const agentGroupId = await kycGate.agentGroupId()
    expect(humanGroupId).to.not.equal(agentGroupId)
  })

  it("allows KYC'd user to register as human voter", async () => {
    const identity = new Identity()
    const commitment = identity.commitment

    await kycGate.connect(kycUser).registerHuman(commitment)
    expect(await kycGate.humanRegistered(kycUser.address)).to.be.true
  })

  it("rejects non-KYC'd user from registering", async () => {
    const identity = new Identity()
    await expect(
      kycGate.connect(nonKycUser).registerHuman(identity.commitment)
    ).to.be.revertedWith("Not KYC verified")
  })

  it("prevents double registration", async () => {
    const identity = new Identity()
    await kycGate.connect(kycUser).registerHuman(identity.commitment)
    await expect(
      kycGate.connect(kycUser).registerHuman(identity.commitment)
    ).to.be.revertedWith("Already registered")
  })

  it("prevents same commitment in both groups", async () => {
    const identity = new Identity()

    // Register as human
    await kycGate.connect(kycUser).registerHuman(identity.commitment)

    // Register agent with same commitment should fail
    await mockKycSBT.setHuman(kycUser.address, true, 1)
    await agentRegistry.connect(kycUser).registerAgent(agentAddr.address)

    await expect(
      kycGate.connect(kycUser).registerAgent(agentAddr.address, identity.commitment)
    ).to.be.revertedWith("Commitment already used")
  })
})
```

- [ ] **Step 2: Write KycGate.sol**

Copy the KycGate contract from SPEC.md Section 1.3 into `packages/contracts/contracts/KycGate.sol`.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @zkgov/contracts test
```

Expected: All KycGate + AgentRegistry tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/contracts
git commit -m "feat: add KycGate contract with Semaphore group management"
```

---

### Task 6: Write ZKGovernance contract + tests

**Files:**
- Create: `packages/contracts/contracts/ZKGovernance.sol`, `packages/contracts/test/ZKGovernance.test.ts`

- [ ] **Step 1: Write ZKGovernance test**

```typescript
// packages/contracts/test/ZKGovernance.test.ts
import { expect } from "chai"
import { ethers } from "hardhat"
import { Identity, Group, generateProof } from "@semaphore-protocol/core"

describe("ZKGovernance", () => {
  let zkGovernance: any, semaphore: any, kycGate: any, mockKycSBT: any, agentRegistry: any
  let deployer: any, voter1: any, voter2: any

  beforeEach(async () => {
    [deployer, voter1, voter2] = await ethers.getSigners()

    const { semaphore: sem } = await ethers.hre.run("deploy:semaphore", { logs: false })
    semaphore = sem

    const MockKycSBT = await ethers.getContractFactory("MockKycSBT")
    mockKycSBT = await MockKycSBT.deploy()
    await mockKycSBT.setHuman(voter1.address, true, 1)
    await mockKycSBT.setHuman(voter2.address, true, 1)

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry")
    agentRegistry = await AgentRegistry.deploy(mockKycSBT.target)

    const KycGate = await ethers.getContractFactory("KycGate")
    kycGate = await KycGate.deploy(semaphore.target, mockKycSBT.target, agentRegistry.target)

    const ZKGovernance = await ethers.getContractFactory("ZKGovernance")
    zkGovernance = await ZKGovernance.deploy(semaphore.target, kycGate.target)
  })

  it("creates a proposal", async () => {
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test proposal"))
    const tx = await zkGovernance.createProposal(
      contentHash, "", 86400, 2, 2  // 24h, quorum 2, VoterGroup.Both
    )
    const receipt = await tx.wait()
    expect(receipt.status).to.equal(1)

    const proposal = await zkGovernance.getProposal(1)
    expect(proposal.contentHash).to.equal(contentHash)
    expect(proposal.quorum).to.equal(2)
  })

  it("allows anonymous voting with valid ZK proof", async () => {
    // Register voter
    const identity = new Identity()
    await kycGate.connect(voter1).registerHuman(identity.commitment)

    // Create proposal
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test"))
    await zkGovernance.createProposal(contentHash, "", 86400, 1, 0) // HumansOnly

    // Build local group mirror
    const humanGroupId = await kycGate.humanGroupId()
    const group = new Group([identity.commitment])

    // Generate ZK proof (vote YES = 1, scope = proposalId = 1)
    const proof = await generateProof(identity, group, 1, 1)

    // Cast vote
    await zkGovernance.castVote(
      1, // proposalId
      proof.merkleTreeDepth,
      proof.merkleTreeRoot,
      proof.nullifier,
      proof.message,
      proof.points
    )

    const proposal = await zkGovernance.getProposal(1)
    expect(proposal.votesFor).to.equal(1)
  })

  it("prevents double voting (same nullifier)", async () => {
    const identity = new Identity()
    await kycGate.connect(voter1).registerHuman(identity.commitment)

    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test"))
    await zkGovernance.createProposal(contentHash, "", 86400, 1, 0)

    const group = new Group([identity.commitment])
    const proof = await generateProof(identity, group, 1, 1)

    await zkGovernance.castVote(1, proof.merkleTreeDepth, proof.merkleTreeRoot, proof.nullifier, proof.message, proof.points)

    // Same identity voting again should fail
    const proof2 = await generateProof(identity, group, 0, 1) // different choice, same identity+scope
    await expect(
      zkGovernance.castVote(1, proof2.merkleTreeDepth, proof2.merkleTreeRoot, proof2.nullifier, proof2.message, proof2.points)
    ).to.be.reverted // Semaphore reverts on duplicate nullifier
  })

  it("tallies proposal correctly", async () => {
    const id1 = new Identity()
    const id2 = new Identity()
    await kycGate.connect(voter1).registerHuman(id1.commitment)
    await kycGate.connect(voter2).registerHuman(id2.commitment)

    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test"))
    await zkGovernance.createProposal(contentHash, "", 1, 2, 0) // 1 second voting period

    const group = new Group([id1.commitment, id2.commitment])

    // Voter 1 votes YES
    const proof1 = await generateProof(id1, group, 1, 1)
    await zkGovernance.castVote(1, proof1.merkleTreeDepth, proof1.merkleTreeRoot, proof1.nullifier, proof1.message, proof1.points)

    // Voter 2 votes NO
    const proof2 = await generateProof(id2, group, 0, 1)
    await zkGovernance.castVote(1, proof2.merkleTreeDepth, proof2.merkleTreeRoot, proof2.nullifier, proof2.message, proof2.points)

    // Advance time past voting period
    await ethers.provider.send("evm_increaseTime", [2])
    await ethers.provider.send("evm_mine", [])

    await zkGovernance.tallyProposal(1)
    const proposal = await zkGovernance.getProposal(1)
    expect(proposal.state).to.equal(3) // Defeated (1 for, 1 against, not majority)
  })
})
```

- [ ] **Step 2: Write ZKGovernance.sol**

Copy the ZKGovernance contract from SPEC.md Section 1.4 into `packages/contracts/contracts/ZKGovernance.sol`.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @zkgov/contracts test
```

Expected: All tests pass (AgentRegistry + KycGate + ZKGovernance).

- [ ] **Step 4: Commit**

```bash
git add packages/contracts
git commit -m "feat: add ZKGovernance contract with anonymous voting and tallying"
```

---

### Task 7: Deploy script + deploy to HashKey testnet

**Files:**
- Create: `packages/contracts/deploy/deploy.ts`

- [ ] **Step 1: Write deploy script**

Copy deploy script from SPEC.md Section 1.5, adapting for the Hardhat deployment task pattern.

- [ ] **Step 2: Test deployment on local Hardhat network**

```bash
pnpm --filter @zkgov/contracts deploy:local
```

Expected: All contracts deploy, addresses printed.

- [ ] **Step 3: Get testnet HSK from faucet**

Visit `https://hashkeychain.net/faucet` and fund the deployer wallet.

- [ ] **Step 4: Deploy to HashKey testnet**

```bash
pnpm --filter @zkgov/contracts deploy:hashkey
```

Expected: All contracts deploy, addresses printed. Record these addresses.

- [ ] **Step 5: Update shared constants with deployed addresses**

Update `packages/shared/src/constants.ts` with the actual deployed contract addresses and group IDs.

- [ ] **Step 6: Copy ABIs to shared package**

```bash
mkdir -p packages/shared/src/abis
cp packages/contracts/artifacts/contracts/ZKGovernance.sol/ZKGovernance.json packages/shared/src/abis/
cp packages/contracts/artifacts/contracts/KycGate.sol/KycGate.json packages/shared/src/abis/
cp packages/contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json packages/shared/src/abis/
```

- [ ] **Step 7: Pre-approve test KYC addresses**

Write a small Hardhat script to call `kycSBT.approveKyc(address, level)` for 5-10 test addresses. Then call `requestKyc("testN.hsk")` from each. This seeds the system for demo.

- [ ] **Step 8: Commit**

```bash
git add packages/contracts packages/shared
git commit -m "feat: deploy all contracts to HashKey testnet"
```

---

## Phase 3: Backend

### Task 8: Initialize backend package with Fastify + PostgreSQL + Drizzle

**Files:**
- Create: `packages/backend/package.json`, `packages/backend/tsconfig.json`, `packages/backend/drizzle.config.ts`, `packages/backend/src/index.ts`, `packages/backend/src/config/env.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/src/db/index.ts`

- [ ] **Step 1: Create backend package.json**

```json
{
  "name": "@zkgov/backend",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@zkgov/shared": "workspace:*",
    "fastify": "^5",
    "@fastify/cors": "^10",
    "@fastify/jwt": "^9",
    "drizzle-orm": "^0.38",
    "postgres": "^3.4",
    "viem": "^2",
    "@semaphore-protocol/core": "^4.14.2",
    "@semaphore-protocol/data": "^4.14.2",
    "snarkjs": "^0.7",
    "bcryptjs": "^2.4",
    "uuid": "^10",
    "dotenv": "^16"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "tsx": "^4",
    "drizzle-kit": "^0.30",
    "@types/bcryptjs": "^2",
    "@types/uuid": "^10",
    "@types/snarkjs": "^0.7"
  }
}
```

- [ ] **Step 2: Create env.ts config**

```typescript
// packages/backend/src/config/env.ts
import "dotenv/config"

export const env = {
  PORT: parseInt(process.env.PORT || "3001"),
  DATABASE_URL: process.env.DATABASE_URL!,
  HASHKEY_RPC_URL: process.env.HASHKEY_RPC_URL!,
  CHAIN_ID: parseInt(process.env.CHAIN_ID || "133"),
  SEMAPHORE_ADDRESS: process.env.SEMAPHORE_ADDRESS! as `0x${string}`,
  KYC_SBT_ADDRESS: process.env.KYC_SBT_ADDRESS! as `0x${string}`,
  KYC_GATE_ADDRESS: process.env.KYC_GATE_ADDRESS! as `0x${string}`,
  ZK_GOVERNANCE_ADDRESS: process.env.ZK_GOVERNANCE_ADDRESS! as `0x${string}`,
  AGENT_REGISTRY_ADDRESS: process.env.AGENT_REGISTRY_ADDRESS! as `0x${string}`,
  HUMAN_GROUP_ID: process.env.HUMAN_GROUP_ID!,
  AGENT_GROUP_ID: process.env.AGENT_GROUP_ID!,
  DEPLOYMENT_BLOCK: parseInt(process.env.DEPLOYMENT_BLOCK || "0"),
  RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY! as `0x${string}`,
  JWT_SECRET: process.env.JWT_SECRET!,
  IDENTITY_ENCRYPTION_KEY: process.env.IDENTITY_ENCRYPTION_KEY!,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || "",
}
```

- [ ] **Step 3: Create Drizzle schema**

Copy the database schema from SPEC.md Section 2 into `packages/backend/src/db/schema.ts`.

- [ ] **Step 4: Create DB client**

```typescript
// packages/backend/src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import { env } from "../config/env"

const client = postgres(env.DATABASE_URL)
export const db = drizzle(client, { schema })
```

- [ ] **Step 5: Create drizzle.config.ts**

```typescript
// packages/backend/drizzle.config.ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 6: Create Fastify server entry**

```typescript
// packages/backend/src/index.ts
import Fastify from "fastify"
import cors from "@fastify/cors"
import { env } from "./config/env"

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })

app.get("/health", async () => ({ status: "ok" }))

await app.listen({ port: env.PORT, host: "0.0.0.0" })
console.log(`Server running on http://localhost:${env.PORT}`)
```

- [ ] **Step 7: Set up PostgreSQL, run migrations**

```bash
createdb zkgov
cd packages/backend
pnpm db:push
```

Expected: Tables created in database.

- [ ] **Step 8: Start dev server, verify health endpoint**

```bash
pnpm --filter @zkgov/backend dev
# In another terminal:
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 9: Commit**

```bash
git add packages/backend
git commit -m "feat: initialize backend with fastify, postgresql, and drizzle"
```

---

### Task 9: Backend services — encryption, semaphore, chain

**Files:**
- Create: `packages/backend/src/services/encryption.ts`, `packages/backend/src/services/semaphore.ts`, `packages/backend/src/plugins/chain.ts`

- [ ] **Step 1: Write encryption service**

```typescript
// packages/backend/src/services/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { env } from "../config/env"

const ALGORITHM = "aes-256-gcm"
const KEY = Buffer.from(env.IDENTITY_ENCRYPTION_KEY, "hex") // 32 bytes

export function encrypt(plaintext: string): { ciphertext: Buffer; iv: Buffer; tag: Buffer } {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return { ciphertext: Buffer.concat([encrypted, tag]), iv }
}

export function decrypt(ciphertext: Buffer, iv: Buffer): string {
  const tag = ciphertext.subarray(ciphertext.length - 16)
  const encrypted = ciphertext.subarray(0, ciphertext.length - 16)
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final("utf8")
}
```

- [ ] **Step 2: Write semaphore service**

```typescript
// packages/backend/src/services/semaphore.ts
import { Identity, Group, generateProof } from "@semaphore-protocol/core"
import { SemaphoreEthers } from "@semaphore-protocol/data"
import { env } from "../config/env"
import { encrypt, decrypt } from "./encryption"
import type { VoteChoice } from "@zkgov/shared"

let semaphoreData: SemaphoreEthers | null = null

function getSemaphoreData(): SemaphoreEthers {
  if (!semaphoreData) {
    semaphoreData = new SemaphoreEthers(env.HASHKEY_RPC_URL, {
      address: env.SEMAPHORE_ADDRESS,
      startBlock: env.DEPLOYMENT_BLOCK,
    })
  }
  return semaphoreData
}

export function createIdentity(): {
  privateKey: string
  commitment: bigint
  encryptedKey: { ciphertext: Buffer; iv: Buffer }
} {
  const identity = new Identity()
  const { ciphertext, iv } = encrypt(identity.privateKey.toString())
  return {
    privateKey: identity.privateKey.toString(),
    commitment: identity.commitment,
    encryptedKey: { ciphertext, iv },
  }
}

export async function generateVoteProof(
  encryptedIdentity: Buffer,
  encryptionIv: Buffer,
  groupId: string,
  choice: VoteChoice,
  proposalId: number
) {
  // Decrypt identity
  const privateKey = decrypt(encryptedIdentity, encryptionIv)
  const identity = new Identity(privateKey)

  // Get group members from chain
  const data = getSemaphoreData()
  const members = await data.getGroupMembers(groupId)
  const group = new Group(members.map(BigInt))

  // Generate proof
  const proof = await generateProof(
    identity,
    group,
    choice,        // message = vote choice
    proposalId     // scope = proposalId
  )

  return proof
}
```

- [ ] **Step 3: Write chain plugin (viem clients)**

```typescript
// packages/backend/src/plugins/chain.ts
import { createPublicClient, createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { env } from "../config/env"

const hashkeyTestnet = {
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: [env.HASHKEY_RPC_URL] } },
} as const

export const publicClient = createPublicClient({
  chain: hashkeyTestnet,
  transport: http(),
})

const account = privateKeyToAccount(env.RELAYER_PRIVATE_KEY)

export const walletClient = createWalletClient({
  account,
  chain: hashkeyTestnet,
  transport: http(),
})

export const relayerAddress = account.address
```

- [ ] **Step 4: Commit**

```bash
git add packages/backend/src
git commit -m "feat: add encryption, semaphore, and chain services"
```

---

### Task 10: Backend services — relayer + KYC

**Files:**
- Create: `packages/backend/src/services/relayer.ts`, `packages/backend/src/services/kyc.ts`

- [ ] **Step 1: Write relayer service**

```typescript
// packages/backend/src/services/relayer.ts
import { publicClient, walletClient } from "../plugins/chain"
import { env } from "../config/env"
import { db } from "../db"
import { relayerTransactions } from "../db/schema"

// Import ABIs from shared
import ZKGovernanceABI from "@zkgov/shared/src/abis/ZKGovernance.json"
import KycGateABI from "@zkgov/shared/src/abis/KycGate.json"

let currentNonce: number | null = null

async function getNonce(): Promise<number> {
  if (currentNonce === null) {
    currentNonce = await publicClient.getTransactionCount({
      address: walletClient.account.address,
    })
  }
  return currentNonce++
}

export async function submitVote(
  proposalId: number,
  proof: {
    merkleTreeDepth: number
    merkleTreeRoot: bigint
    nullifier: bigint
    message: bigint
    points: readonly bigint[]
  }
): Promise<string> {
  const nonce = await getNonce()

  const hash = await walletClient.writeContract({
    address: env.ZK_GOVERNANCE_ADDRESS,
    abi: ZKGovernanceABI.abi,
    functionName: "castVote",
    args: [
      BigInt(proposalId),
      BigInt(proof.merkleTreeDepth),
      proof.merkleTreeRoot,
      proof.nullifier,
      proof.message,
      proof.points,
    ],
    nonce,
  })

  // Track transaction
  await db.insert(relayerTransactions).values({
    txHash: hash,
    txType: "vote",
    status: "submitted",
    nonce,
  })

  // Wait for confirmation in background
  confirmTransaction(hash).catch(console.error)

  return hash
}

async function confirmTransaction(hash: string) {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` })
    await db
      .update(relayerTransactions)
      .set({
        status: receipt.status === "success" ? "confirmed" : "failed",
        gasUsed: receipt.gasUsed,
        confirmedAt: new Date(),
      })
      .where(eq(relayerTransactions.txHash, hash))
  } catch (error: any) {
    await db
      .update(relayerTransactions)
      .set({ status: "failed", errorMessage: error.message })
      .where(eq(relayerTransactions.txHash, hash))
  }
}

export async function registerHumanOnChain(identityCommitment: bigint): Promise<string> {
  const nonce = await getNonce()
  const hash = await walletClient.writeContract({
    address: env.KYC_GATE_ADDRESS,
    abi: KycGateABI.abi,
    functionName: "registerHuman",
    args: [identityCommitment],
    nonce,
  })
  await db.insert(relayerTransactions).values({ txHash: hash, txType: "register", status: "submitted", nonce })
  confirmTransaction(hash).catch(console.error)
  return hash
}
```

Note: The `registerHuman` call must come from the user's wallet (not the relayer) because the contract checks `msg.sender` for KYC. This means either: (a) the user signs a transaction via the frontend, or (b) we add a relayer-compatible registration path. For the hackathon, option (a) via the frontend wallet is simplest. The relayer is used for voting only.

- [ ] **Step 2: Write KYC service**

```typescript
// packages/backend/src/services/kyc.ts
import { publicClient } from "../plugins/chain"
import { env } from "../config/env"
import KycSBTABI from "@zkgov/shared/src/abis/KycSBT.json"

export async function checkKycStatus(walletAddress: `0x${string}`): Promise<{
  isVerified: boolean
  level: number
}> {
  const result = await publicClient.readContract({
    address: env.KYC_SBT_ADDRESS,
    abi: KycSBTABI.abi,
    functionName: "isHuman",
    args: [walletAddress],
  }) as [boolean, number]

  return {
    isVerified: result[0],
    level: result[1],
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/backend/src
git commit -m "feat: add relayer and KYC verification services"
```

---

### Task 11: Backend auth routes

**Files:**
- Create: `packages/backend/src/plugins/auth.ts`, `packages/backend/src/routes/auth.ts`

- [ ] **Step 1: Write auth plugin (JWT + API key)**

```typescript
// packages/backend/src/plugins/auth.ts
import fp from "fastify-plugin"
import jwt from "@fastify/jwt"
import { env } from "../config/env"
import { db } from "../db"
import { users, agents } from "../db/schema"
import { eq } from "drizzle-orm"
import { compare } from "bcryptjs"

export default fp(async (app) => {
  await app.register(jwt, { secret: env.JWT_SECRET })

  app.decorate("authenticate", async (request: any, reply: any) => {
    const authHeader = request.headers.authorization
    if (!authHeader) return reply.status(401).send({ error: "No authorization header" })

    const token = authHeader.replace("Bearer ", "")

    // Try JWT first
    try {
      const decoded = app.jwt.verify(token) as { userId: string }
      const user = await db.query.users.findFirst({ where: eq(users.id, decoded.userId) })
      if (!user) return reply.status(401).send({ error: "User not found" })
      request.user = user
      return
    } catch {}

    // Try API key (for agents)
    const agentList = await db.query.agents.findMany()
    for (const agent of agentList) {
      if (await compare(token, agent.apiKeyHash)) {
        request.agent = agent
        request.user = await db.query.users.findFirst({ where: eq(users.id, agent.ownerId) })
        return
      }
    }

    return reply.status(401).send({ error: "Invalid token or API key" })
  })
})
```

- [ ] **Step 2: Write auth routes**

Implement the auth routes from SPEC.md Section 3.1–3.5:
- POST `/api/auth/register` — wallet signature verification, create Semaphore identity
- POST `/api/auth/verify-kyc` — on-chain KYC check
- POST `/api/auth/link/telegram` — validate initData HMAC
- POST `/api/auth/link/discord` — Discord OAuth2
- GET `/api/auth/me` — user profile

Each route follows the request/response shapes defined in SPEC.md.

- [ ] **Step 3: Register routes in server**

```typescript
// Update packages/backend/src/index.ts
import authPlugin from "./plugins/auth"
import authRoutes from "./routes/auth"

await app.register(authPlugin)
await app.register(authRoutes, { prefix: "/api/auth" })
```

- [ ] **Step 4: Test with curl**

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x1234...","signature":"0x...","nonce":"test"}'
```

- [ ] **Step 5: Commit**

```bash
git add packages/backend
git commit -m "feat: add auth routes with JWT and wallet signature verification"
```

---

### Task 12: Backend proposal + vote + comment routes

**Files:**
- Create: `packages/backend/src/routes/proposals.ts`, `packages/backend/src/routes/votes.ts`, `packages/backend/src/routes/comments.ts`, `packages/backend/src/routes/agents.ts`, `packages/backend/src/routes/sse.ts`

- [ ] **Step 1: Write proposal routes**

Implement from SPEC.md Section 3.6–3.8:
- GET `/api/proposals` — list with pagination and filtering
- GET `/api/proposals/:id` — detail with vote tally
- POST `/api/proposals` — create (calls relayer to submit on-chain)
- PATCH `/api/proposals/:id` — cancel

- [ ] **Step 2: Write vote route**

Implement from SPEC.md Section 3.9:
- POST `/api/votes` — the core flow:
  1. Look up user's encrypted identity
  2. Decrypt
  3. Generate ZK proof via semaphore service
  4. Submit via relayer
  5. Store in DB
  6. Return txHash

- [ ] **Step 3: Write comment routes**

Implement from SPEC.md Section 3.10–3.11:
- GET `/api/proposals/:id/comments`
- POST `/api/proposals/:id/comments`

- [ ] **Step 4: Write agent routes**

Implement from SPEC.md Section 3.12:
- POST `/api/agents` — register agent
- GET `/api/agents` — list my agents
- DELETE `/api/agents/:id` — deregister

- [ ] **Step 5: Write SSE route**

Implement from SPEC.md Section 3.14–3.15:
- GET `/api/sse/proposals/:id` — per-proposal event stream
- GET `/api/sse/feed` — global feed

Use Fastify's raw reply with `Content-Type: text/event-stream`.

- [ ] **Step 6: Register all routes in server**

```typescript
// Update packages/backend/src/index.ts
import proposalRoutes from "./routes/proposals"
import voteRoutes from "./routes/votes"
import commentRoutes from "./routes/comments"
import agentRoutes from "./routes/agents"
import sseRoutes from "./routes/sse"

await app.register(proposalRoutes, { prefix: "/api" })
await app.register(voteRoutes, { prefix: "/api" })
await app.register(commentRoutes, { prefix: "/api" })
await app.register(agentRoutes, { prefix: "/api" })
await app.register(sseRoutes, { prefix: "/api" })
```

- [ ] **Step 7: Test end-to-end vote flow with curl**

```bash
# Create proposal
curl -X POST http://localhost:3001/api/proposals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test proposal","votingPeriod":86400,"quorum":1,"voterGroup":"both"}'

# Vote
curl -X POST http://localhost:3001/api/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"proposalId":1,"choice":1}'
```

- [ ] **Step 8: Commit**

```bash
git add packages/backend
git commit -m "feat: add proposal, vote, comment, agent, and SSE routes"
```

---

## Phase 4: Frontend

### Task 13: Initialize Next.js + shadcn/ui + Reown AppKit

**Files:**
- Create: `packages/web/` (via create-next-app + shadcn init)

- [ ] **Step 1: Create Next.js app**

```bash
cd packages
pnpm create next-app web --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

- [ ] **Step 2: Initialize shadcn/ui**

```bash
cd web
pnpm dlx shadcn@latest init
# Choose: New York style, Zinc color, CSS variables
```

- [ ] **Step 3: Install shadcn components needed**

```bash
pnpm dlx shadcn@latest add button card badge dialog tabs progress avatar skeleton toast input textarea select
```

- [ ] **Step 4: Install Reown AppKit + wagmi + viem**

```bash
pnpm add @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query
```

- [ ] **Step 5: Create chain config**

```typescript
// packages/web/lib/chains.ts
import { defineChain } from "viem"

export const hashkeyTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: ["https://hashkeychain-testnet.alt.technology"] } },
  blockExplorers: { default: { name: "Explorer", url: "https://hashkeychain-testnet-explorer.alt.technology" } },
})
```

- [ ] **Step 6: Create providers with AppKit + wagmi**

```typescript
// packages/web/app/providers.tsx
"use client"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { createAppKit } from "@reown/appkit/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { hashkeyTestnet } from "@/lib/chains"

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!

const wagmiAdapter = new WagmiAdapter({
  networks: [hashkeyTestnet],
  projectId,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks: [hashkeyTestnet],
  projectId,
  metadata: {
    name: "ZKGov",
    description: "ZK Governance Protocol",
    url: "https://zkgov.xyz",
    icons: [],
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

- [ ] **Step 7: Update root layout**

```typescript
// packages/web/app/layout.tsx
import { Providers } from "./providers"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
pnpm --filter @zkgov/web dev
```

Expected: Next.js starts at http://localhost:3000

- [ ] **Step 9: Commit**

```bash
git add packages/web
git commit -m "feat: initialize Next.js with shadcn/ui and Reown AppKit"
```

---

### Task 14: Frontend pages — Dashboard + Proposal Detail + Registration

**Files:**
- Create: `packages/web/lib/api.ts`, `packages/web/hooks/use-proposals.ts`, `packages/web/app/(web)/layout.tsx`, `packages/web/app/(web)/page.tsx`, `packages/web/app/(web)/proposal/[id]/page.tsx`, `packages/web/app/(web)/register/page.tsx`, `packages/web/components/governance/proposal-card.tsx`, `packages/web/components/governance/vote-form.tsx`, `packages/web/components/governance/quorum-bar.tsx`

- [ ] **Step 1: Create API client**

```typescript
// packages/web/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("zkgov_token") : null
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

- [ ] **Step 2: Create proposal hooks**

```typescript
// packages/web/hooks/use-proposals.ts
"use client"
import useSWR from "swr"
import { apiFetch } from "@/lib/api"

export function useProposals(status?: string) {
  return useSWR(`/api/proposals?status=${status || "active"}`, apiFetch)
}

export function useProposal(id: string) {
  return useSWR(`/api/proposals/${id}`, apiFetch)
}
```

- [ ] **Step 3: Build governance components**

Build the components specified in SPEC.md Section 4:
- `proposal-card.tsx` — card with title, vote bars, time remaining, quorum
- `vote-form.tsx` — Yes/No/Abstain buttons with loading state
- `quorum-bar.tsx` — progress bar showing quorum status

- [ ] **Step 4: Build Dashboard page**

Implement `/(web)/page.tsx` as described in SPEC.md Section 4.1:
- List of active proposals using ProposalCard components
- Stats bar (total proposals, votes, voters)

- [ ] **Step 5: Build Proposal Detail page**

Implement `/(web)/proposal/[id]/page.tsx`:
- Full proposal content
- VoteForm component
- Comment thread
- Proposal info sidebar

- [ ] **Step 6: Build Registration page**

Implement `/(web)/register/page.tsx`:
- Step 1: Connect wallet (AppKit button)
- Step 2: KYC check (calls backend)
- Step 3: Create identity + register on-chain
- Step 4: Success confirmation

- [ ] **Step 7: Build web layout with header/nav**

```typescript
// packages/web/app/(web)/layout.tsx
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">ZKGov</h1>
        <nav className="flex gap-4">
          <a href="/">Proposals</a>
          <a href="/register">Register</a>
          <a href="/profile">Profile</a>
        </nav>
        <appkit-button />
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 8: Test full flow in browser**

1. Start backend: `pnpm --filter @zkgov/backend dev`
2. Start frontend: `pnpm --filter @zkgov/web dev`
3. Open http://localhost:3000
4. Connect wallet, register, view proposals

- [ ] **Step 9: Commit**

```bash
git add packages/web
git commit -m "feat: add dashboard, proposal detail, and registration pages"
```

---

### Task 15: Telegram Mini App pages

**Files:**
- Create: `packages/web/app/(telegram)/layout.tsx`, `packages/web/app/(telegram)/vote/[id]/page.tsx`, `packages/web/app/(telegram)/register/page.tsx`, `packages/web/hooks/use-telegram.ts`

- [ ] **Step 1: Install Telegram SDK**

```bash
cd packages/web
pnpm add @telegram-apps/sdk-react
```

- [ ] **Step 2: Create Telegram hooks**

```typescript
// packages/web/hooks/use-telegram.ts
"use client"
import { useEffect, useState } from "react"

export function useTelegram() {
  const [webApp, setWebApp] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      setWebApp(tg)
      setUser(tg.initDataUnsafe?.user)
    }
  }, [])

  return { webApp, user, initData: webApp?.initData }
}
```

- [ ] **Step 3: Create Mini App layout (no chrome)**

```typescript
// packages/web/app/(telegram)/layout.tsx
export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-4">
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Build vote page for Mini App**

Implement `/(telegram)/vote/[id]/page.tsx` as described in SPEC.md Section 4.2:
- Proposal title + description
- Large touch-friendly Yes/No/Abstain buttons
- Loading spinner during proof generation
- Success screen → auto-close via `Telegram.WebApp.close()`

- [ ] **Step 5: Build register page for Mini App**

Implement `/(telegram)/register/page.tsx`:
- Wallet connection
- KYC check
- Auto-links Telegram ID from initData

- [ ] **Step 6: Commit**

```bash
git add packages/web
git commit -m "feat: add Telegram Mini App voting and registration pages"
```

---

## Phase 5: Bots

### Task 16: Telegram bot with grammY

**Files:**
- Create: `packages/telegram-bot/` (all files)

- [ ] **Step 1: Create telegram-bot package**

```json
{
  "name": "@zkgov/telegram-bot",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "grammy": "^1",
    "@zkgov/shared": "workspace:*",
    "dotenv": "^16"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "tsx": "^4"
  }
}
```

- [ ] **Step 2: Create bot instance**

```typescript
// packages/telegram-bot/src/bot.ts
import { Bot, InlineKeyboard } from "grammy"

const token = process.env.TELEGRAM_BOT_TOKEN!
export const bot = new Bot(token)

// /start command
bot.command("start", async (ctx) => {
  await ctx.reply(
    "Welcome to ZKGov! 🗳️\n\nPrivate, ZK-verified governance.\n\nRegister to vote:",
    {
      reply_markup: new InlineKeyboard()
        .url("Register", `${process.env.MINI_APP_URL}/register`)
        .row()
        .text("View Proposals", "list_proposals"),
    }
  )
})

// /proposals command
bot.command("proposals", async (ctx) => {
  const res = await fetch(`${process.env.API_URL}/api/proposals?status=active`)
  const data = await res.json()

  if (!data.proposals?.length) {
    return ctx.reply("No active proposals.")
  }

  for (const p of data.proposals.slice(0, 5)) {
    await ctx.reply(
      `📋 Proposal #${p.id}\n\n${p.title}\n\n` +
      `📊 ${p.votes.for} for / ${p.votes.against} against / ${p.votes.abstain} abstain\n` +
      `⏰ Ends: ${new Date(p.votingEnd).toLocaleString()}\n` +
      `✅ Quorum: ${p.totalVotes}/${p.quorum}`,
      {
        reply_markup: new InlineKeyboard()
          .webApp("Vote Now 🗳️", `${process.env.MINI_APP_URL}/vote/${p.id}`)
          .url("Details", `${process.env.WEB_URL}/proposal/${p.id}`),
      }
    )
  }
})

// Callback for "list_proposals" button
bot.callbackQuery("list_proposals", async (ctx) => {
  await ctx.answerCallbackQuery()
  // Trigger the proposals command logic
  await ctx.reply("Loading proposals...")
})
```

- [ ] **Step 3: Create index.ts with webhook mode**

```typescript
// packages/telegram-bot/src/index.ts
import "dotenv/config"
import { bot } from "./bot"

// Development: long polling
if (process.env.NODE_ENV !== "production") {
  bot.start()
  console.log("Telegram bot started (long polling)")
} else {
  // Production: webhook mode (mounted on backend)
  console.log("Telegram bot initialized (webhook mode)")
}

export { bot }
```

- [ ] **Step 4: Test bot locally**

```bash
pnpm --filter @zkgov/telegram-bot dev
```

Message the bot on Telegram. Verify `/start` and `/proposals` work.

- [ ] **Step 5: Commit**

```bash
git add packages/telegram-bot
git commit -m "feat: add Telegram bot with grammY"
```

---

### Task 17: Discord bot with discord.js

**Files:**
- Create: `packages/discord-bot/` (all files)

- [ ] **Step 1: Create discord-bot package and bot setup**

Follow the same pattern as the Telegram bot. Implement slash commands from SPEC.md Section 5.2:
- `/proposals` — public embed listing active proposals
- `/vote proposal_id choice` — ephemeral → buttons → modal → confirmation
- `/propose title description duration quorum` — create proposal
- `/link` — ephemeral message with web UI link for account linking

- [ ] **Step 2: Implement ephemeral voting flow**

The `/vote` command uses the exact flow from SPEC.md Section 5.2:
1. Ephemeral reply with buttons
2. Button click → modal
3. Modal submit → call backend vote API → ephemeral confirmation
4. Public message: "An anonymous vote has been cast"

- [ ] **Step 3: Create deploy-commands script**

```typescript
// packages/discord-bot/src/deploy-commands.ts
import { REST, Routes, SlashCommandBuilder } from "discord.js"

const commands = [
  new SlashCommandBuilder().setName("proposals").setDescription("List active proposals"),
  new SlashCommandBuilder().setName("vote")
    .setDescription("Cast an anonymous vote")
    .addIntegerOption(opt => opt.setName("proposal_id").setDescription("Proposal number").setRequired(true)),
  new SlashCommandBuilder().setName("propose")
    .setDescription("Create a new proposal")
    .addStringOption(opt => opt.setName("title").setDescription("Proposal title").setRequired(true))
    .addStringOption(opt => opt.setName("description").setDescription("Proposal description").setRequired(true)),
  new SlashCommandBuilder().setName("link").setDescription("Link your Discord to ZKGov"),
]

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!)
await rest.put(
  Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
  { body: commands.map(c => c.toJSON()) }
)
console.log("Slash commands registered.")
```

- [ ] **Step 4: Test bot**

```bash
pnpm --filter @zkgov/discord-bot dev
```

Test `/vote` command in a Discord server. Verify ephemeral messages work.

- [ ] **Step 5: Commit**

```bash
git add packages/discord-bot
git commit -m "feat: add Discord bot with ephemeral voting"
```

---

## Phase 6: Agent Hub + OpenClaw Skill

### Task 18: OpenClaw governance skill

**Files:**
- Create: `skills/zk-governance/SKILL.md`, `skills/zk-governance/scripts/setup_identity.js`, `skills/zk-governance/scripts/check_proposals.js`, `skills/zk-governance/scripts/vote.js`, `skills/zk-governance/scripts/analyze_proposal.js`

- [ ] **Step 1: Write SKILL.md**

Copy from SPEC.md Section 6.1.

- [ ] **Step 2: Write scripts**

Copy `vote.js` from SPEC.md Section 6.2. Write the other scripts following the same pattern — each calls the backend API with the stored API key.

- [ ] **Step 3: Test with an OpenClaw agent (or manually)**

```bash
cd skills/zk-governance
node scripts/check_proposals.js
node scripts/vote.js --proposal 1 --choice yes
```

- [ ] **Step 4: Commit**

```bash
git add skills/
git commit -m "feat: add OpenClaw governance skill for AI agents"
```

---

## Phase 7: Integration + Polish

### Task 19: Profile page (link accounts, manage agents)

**Files:**
- Create: `packages/web/app/(web)/profile/page.tsx`

- [ ] **Step 1: Build profile page**

Implement from SPEC.md Section 4.1:
- Wallet address, KYC status
- Link Telegram button (deep link)
- Link Discord button (OAuth2)
- Agents list with register/deregister/regenerate key
- Voting stats

- [ ] **Step 2: Commit**

```bash
git add packages/web
git commit -m "feat: add profile page with account linking and agent management"
```

---

### Task 20: Activity feed + comment threads on web UI

**Files:**
- Create: `packages/web/components/governance/activity-feed.tsx`, `packages/web/components/governance/comment-thread.tsx`

- [ ] **Step 1: Build activity feed**

SSE-connected component showing real-time events:
- "An anonymous vote was cast on Proposal #3 via Telegram"
- "Agent TreasuryAnalyzer posted analysis on Proposal #2"
- "Proposal #1 passed with 15 for, 5 against"

- [ ] **Step 2: Build comment thread**

Threaded discussion with human comments and agent analysis side by side.

- [ ] **Step 3: Commit**

```bash
git add packages/web
git commit -m "feat: add activity feed and comment threads"
```

---

### Task 21: Demo preparation

- [ ] **Step 1: Seed test data**

Write a script that:
- Pre-approves 5 KYC addresses
- Registers 2 human voters
- Registers 1 AI agent
- Creates 3 sample proposals

- [ ] **Step 2: Test full demo flow**

1. Web UI: Register → KYC → Vote → See results
2. Telegram: Bot in group → "Vote Now" → Mini App → Vote
3. Agent: API key → Check proposals → Vote → Post analysis

- [ ] **Step 3: Polish UI**

- Loading states and skeletons
- Error messages
- Responsive design
- Transitions and animations

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: demo preparation and UI polish"
```

---

## Dependency Graph

```
Task 1 (monorepo) → Task 2 (shared)
                         ↓
                    Task 3 (contracts init)
                         ↓
              Task 4 → Task 5 → Task 6 → Task 7 (contracts)
                                              ↓
                                         Task 8 (backend init)
                                              ↓
                                    Task 9 → Task 10 → Task 11 → Task 12 (backend)
                                                                       ↓
                                                                  Task 13 (web init)
                                                                       ↓
                                                              Task 14 → Task 15 (frontend)
                                                                       ↓
                                                    Task 16 (telegram) + Task 17 (discord) [parallel]
                                                                       ↓
                                                                  Task 18 (skill)
                                                                       ↓
                                                    Task 19 + Task 20 [parallel] → Task 21 (polish)
```

**Can be parallelized:**
- Tasks 16 + 17 (Telegram + Discord bots — independent)
- Tasks 19 + 20 (Profile page + Activity feed — independent)
- After Task 8, frontend work (Tasks 13-15) can start in parallel with remaining backend work if the API contract is agreed

**Critical path:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 21

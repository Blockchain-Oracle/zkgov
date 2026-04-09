/**
 * seed-demo.ts
 *
 * End-to-end demo seeder:
 *   1. Generates 5 random wallets with Semaphore identities
 *   2. Funds each from deployer
 *   3. Registers each as a voter on-chain
 *   4. Creates 4 short proposals with varying durations
 *   5. Each voter casts ZK-verified votes (mix of for/against/abstain)
 *
 * Usage:  npx tsx scripts/seed-demo.ts
 */

import { config } from "dotenv"
config({ path: "packages/contracts/.env" })
config({ path: "packages/backend/.env" })

import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  parseEther,
  formatEther,
} from "viem"
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
import { Identity, Group, generateProof } from "@semaphore-protocol/core"

// ─── Chain ──────────────────────────────────────────────────────
const chain = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet.hsk.xyz"] } },
})

const ZK_VOTING = "0xEa625841E031758786141c8b13dD1b1137C9776C" as const
const SEMAPHORE = "0x1f7cbB9947087b01fCd7963F296A76E0dA41AA6f" as const
const DEPLOYMENT_BLOCK = 26266477n

// ─── ABIs ───────────────────────────────────────────────────────
const ZK_VOTING_ABI = [
  {
    name: "register", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "identityCommitment", type: "uint256" }], outputs: [],
  },
  {
    name: "createProposal", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" }, { name: "description", type: "string" },
      { name: "votingPeriod", type: "uint256" }, { name: "quorum", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "castVote", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" }, { name: "merkleTreeDepth", type: "uint256" },
      { name: "merkleTreeRoot", type: "uint256" }, { name: "nullifier", type: "uint256" },
      { name: "choice", type: "uint256" }, { name: "points", type: "uint256[8]" },
    ],
    outputs: [],
  },
  {
    name: "proposalCount", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ type: "uint256" }],
  },
  {
    name: "getStats", type: "function", stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "totalProposals", type: "uint256" },
      { name: "totalMembers", type: "uint256" },
      { name: "activeGroupId", type: "uint256" },
    ],
  },
  {
    name: "isVoter", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "registered", type: "bool" }, { name: "commitment", type: "uint256" }],
  },
] as const

const SEMAPHORE_ABI = [
  {
    name: "getMerkleTreeSize", type: "function", stateMutability: "view",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
] as const

const MEMBER_REGISTERED_EVENT = {
  name: "MemberRegistered",
  type: "event",
  inputs: [
    { name: "member", type: "address", indexed: true },
    { name: "commitment", type: "uint256", indexed: false },
  ],
} as const

// ─── Proposals to create ────────────────────────────────────────
const NEW_PROPOSALS = [
  {
    title: "Launch community bug bounty program",
    description:
      "## Summary\nCreate a bug bounty with tiered rewards for critical, high, and medium bugs.\n\n## Budget\n- Critical: $10K\n- High: $5K\n- Medium: $1K",
    votingPeriod: 6 * 24 * 3600, // 6 days
    quorum: 3,
  },
  {
    title: "Add HSK staking rewards for governance participants",
    description:
      "## Summary\nReward active governance participants with bonus HSK staking yield.\n\n## Details\n- 2% APY boost for voters\n- Requires minimum 3 votes per quarter",
    votingPeriod: 2 * 24 * 3600, // 2 days
    quorum: 4,
  },
  {
    title: "Fund open-source ZK tooling grants",
    description:
      "## Summary\nAllocate 50K HSK to fund open-source ZK circuit libraries and developer tools.\n\n## Rationale\nZK adoption depends on accessible tooling. This funds 5-10 grants.",
    votingPeriod: 1 * 24 * 3600, // 1 day
    quorum: 3,
  },
  {
    title: "Reduce proposal quorum from 5 to 3",
    description:
      "## Summary\nLower the default quorum requirement to encourage more frequent governance activity.\n\n## Justification\nCurrent quorum of 5 is too high for early-stage participation.",
    votingPeriod: 3 * 24 * 3600, // 3 days
    quorum: 2,
  },
]

// ─── Vote distribution for demo variety ─────────────────────────
// For each voter (rows) and each proposal (cols): 0=against, 1=for, 2=abstain, null=skip
const VOTE_PLAN: (0 | 1 | 2 | null)[][] = [
  [1, 1, 1, 0],    // voter 0: for, for, for, against
  [1, 0, 1, 1],    // voter 1: for, against, for, for
  [0, 1, 2, 1],    // voter 2: against, for, abstain, for
  [1, 2, 0, 1],    // voter 3: for, abstain, against, for
  [2, 1, 1, null],  // voter 4: abstain, for, for, skip
]

// ─── Helpers ────────────────────────────────────────────────────
const pub = createPublicClient({ chain, transport: http() })

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitTx(hash: `0x${string}`, label: string) {
  const receipt = await pub.waitForTransactionReceipt({ hash })
  if (receipt.status === "reverted") {
    console.error(`  ✗ ${label} REVERTED: ${hash}`)
    return false
  }
  console.log(`  ✓ ${label}: ${hash}`)
  return true
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  const deployerPk = process.env.DEPLOYER_PRIVATE_KEY
  if (!deployerPk) {
    console.error("Set DEPLOYER_PRIVATE_KEY in packages/contracts/.env")
    process.exit(1)
  }

  const deployerAccount = privateKeyToAccount(deployerPk as `0x${string}`)
  const deployer = createWalletClient({ account: deployerAccount, chain, transport: http() })

  const balance = await pub.getBalance({ address: deployerAccount.address })
  console.log(`\nDeployer: ${deployerAccount.address}`)
  console.log(`Balance:  ${formatEther(balance)} HSK\n`)

  // ── Step 1: Check if deployer is already registered ───────────
  const deployerVoter = await pub.readContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "isVoter",
    args: [deployerAccount.address],
  })
  const deployerAlreadyRegistered = deployerVoter[0]

  // ── Step 2: Generate 5 wallets + identities ───────────────────
  console.log("═══ STEP 1: Generate wallets & identities ═══\n")

  const voters: {
    pk: `0x${string}`
    address: `0x${string}`
    identity: InstanceType<typeof Identity>
  }[] = []

  for (let i = 0; i < 5; i++) {
    const pk = generatePrivateKey()
    const account = privateKeyToAccount(pk)
    // Derive identity from the private key (deterministic per wallet)
    const identity = new Identity(pk)
    voters.push({ pk, address: account.address, identity })
    console.log(
      `  Voter ${i}: ${account.address}  commitment: ${identity.commitment.toString().slice(0, 16)}...`
    )
  }

  // ── Step 3: Fund wallets ──────────────────────────────────────
  console.log("\n═══ STEP 2: Fund wallets (0.005 HSK each) ═══\n")

  const fundAmount = parseEther("0.005")
  for (const v of voters) {
    const hash = await deployer.sendTransaction({
      to: v.address,
      value: fundAmount,
    })
    await waitTx(hash, `Fund ${v.address.slice(0, 8)}...`)
  }

  // ── Step 4: Register each voter on-chain ──────────────────────
  console.log("\n═══ STEP 3: Register voters on-chain ═══\n")

  // Also register deployer if not already
  if (!deployerAlreadyRegistered) {
    const deployerIdentity = new Identity(deployerPk)
    const hash = await deployer.writeContract({
      address: ZK_VOTING,
      abi: ZK_VOTING_ABI,
      functionName: "register",
      args: [deployerIdentity.commitment],
    })
    await waitTx(hash, "Register deployer")
  } else {
    console.log("  Deployer already registered, skipping.")
  }

  for (let i = 0; i < voters.length; i++) {
    const v = voters[i]
    const wallet = createWalletClient({
      account: privateKeyToAccount(v.pk),
      chain,
      transport: http(),
    })

    try {
      const hash = await wallet.writeContract({
        address: ZK_VOTING,
        abi: ZK_VOTING_ABI,
        functionName: "register",
        args: [v.identity.commitment],
      })
      await waitTx(hash, `Register voter ${i}`)
    } catch (e: any) {
      if (e.message?.includes("Already registered")) {
        console.log(`  Voter ${i} already registered, skipping.`)
      } else {
        console.error(`  ✗ Voter ${i} registration failed:`, e.shortMessage || e.message)
      }
    }
  }

  // ── Step 5: Create proposals ──────────────────────────────────
  console.log("\n═══ STEP 4: Create proposals ═══\n")

  const existingCount = await pub.readContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "proposalCount",
  })
  console.log(`  Existing proposals: ${existingCount}`)

  const newProposalIds: number[] = []

  for (const p of NEW_PROPOSALS) {
    const hash = await deployer.writeContract({
      address: ZK_VOTING,
      abi: ZK_VOTING_ABI,
      functionName: "createProposal",
      args: [p.title, p.description, BigInt(p.votingPeriod), BigInt(p.quorum)],
    })
    const ok = await waitTx(hash, `"${p.title.slice(0, 40)}..."`)
    if (ok) {
      const count = await pub.readContract({
        address: ZK_VOTING,
        abi: ZK_VOTING_ABI,
        functionName: "proposalCount",
      })
      newProposalIds.push(Number(count))
    }
  }

  console.log(`  New proposal IDs: ${newProposalIds.join(", ")}`)

  // ── Step 6: Fetch group members from on-chain events ──────────
  console.log("\n═══ STEP 5: Build Semaphore group from on-chain data ═══\n")

  const logs = await pub.getLogs({
    address: ZK_VOTING,
    event: {
      type: "event",
      name: "MemberRegistered",
      inputs: [
        { name: "member", type: "address", indexed: true },
        { name: "commitment", type: "uint256", indexed: false },
      ],
    },
    fromBlock: DEPLOYMENT_BLOCK,
    toBlock: "latest",
  })

  const commitments = logs.map((log) => BigInt((log as any).args.commitment))
  console.log(`  Found ${commitments.length} registered members on-chain`)

  const group = new Group(commitments)
  console.log(`  Group root: ${group.root.toString().slice(0, 20)}...`)

  // ── Step 7: Cast votes with ZK proofs ─────────────────────────
  console.log("\n═══ STEP 6: Cast ZK-verified votes ═══\n")

  const choices = ["AGAINST", "FOR", "ABSTAIN"]

  for (let pIdx = 0; pIdx < newProposalIds.length; pIdx++) {
    const proposalId = newProposalIds[pIdx]
    console.log(`\n  Proposal #${proposalId}:`)

    for (let vIdx = 0; vIdx < voters.length; vIdx++) {
      const choice = VOTE_PLAN[vIdx][pIdx]
      if (choice === null) {
        console.log(`    Voter ${vIdx}: skipped`)
        continue
      }

      const voter = voters[vIdx]

      try {
        console.log(`    Voter ${vIdx}: generating ZK proof (${choices[choice]})...`)
        const proof = await generateProof(
          voter.identity,
          group,
          choice,          // message (the vote)
          proposalId       // scope (proposalId)
        )

        // Voter signs their own vote transaction
        const wallet = createWalletClient({
          account: privateKeyToAccount(voter.pk),
          chain,
          transport: http(),
        })

        const hash = await wallet.writeContract({
          address: ZK_VOTING,
          abi: ZK_VOTING_ABI,
          functionName: "castVote",
          args: [
            BigInt(proposalId),
            BigInt(proof.merkleTreeDepth),
            BigInt(proof.merkleTreeRoot),
            BigInt(proof.nullifier),
            BigInt(proof.message),
            proof.points.map(BigInt) as unknown as readonly [
              bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint
            ],
          ],
        })
        await waitTx(hash, `Voter ${vIdx} voted ${choices[choice]}`)
      } catch (e: any) {
        const msg = e.shortMessage || e.message || ""
        if (msg.includes("nullifier") || msg.includes("already")) {
          console.log(`    Voter ${vIdx}: already voted, skipping.`)
        } else {
          console.error(`    ✗ Voter ${vIdx} vote failed:`, msg.slice(0, 120))
        }
      }
    }
  }

  // ── Step 8: Print final stats ─────────────────────────────────
  console.log("\n═══ DONE ═══\n")

  const [totalProposals, totalMembers] = await pub.readContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "getStats",
  }) as [bigint, bigint, bigint]

  console.log(`  Total proposals: ${totalProposals}`)
  console.log(`  Total members:   ${totalMembers}`)
  console.log(`  Explorer: https://testnet-explorer.hsk.xyz/address/${ZK_VOTING}`)
  console.log()
}

main().catch((e) => {
  console.error("Fatal:", e)
  process.exit(1)
})

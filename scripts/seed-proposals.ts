/**
 * Seed the database with realistic governance proposals via API.
 * Usage: npx tsx scripts/seed-proposals.ts
 * Requires backend running at API_URL.
 */
const API_URL = process.env.API_URL || "http://localhost:3001"

const PROPOSALS = [
  {
    title: "Allocate 10% of treasury to developer grants program",
    description: "## Summary\n\nThis proposal allocates 10% of the HashKey Chain ecosystem treasury toward a developer grants program.\n\n## Motivation\n\nDeveloper adoption is the primary growth lever for any L2. A structured grants program will:\n- Attract builders to HashKey Chain\n- Fund tooling, SDKs, and documentation\n- Create a flywheel of ecosystem growth\n\n## Specification\n\n- 10% of current treasury (~$500K equivalent)\n- 6-month program with quarterly reviews\n- Grants committee of 5 elected members\n- Individual grants capped at $50K",
    votingPeriod: 172800, // 48 hours
    quorum: 5,
    voterGroup: "both",
  },
  {
    title: "Increase validator rewards by 15% for Q2 2026",
    description: "## Summary\n\nAdjust validator rewards upward by 15% to improve network security and decentralization.\n\n## Rationale\n\nCurrent validator economics are below competitive rates for OP Stack L2s. This adjustment aligns HashKey Chain with market rates and encourages more validator participation.\n\n## Impact\n\n- Estimated additional cost: ~$200K/quarter\n- Expected new validators: 8-12\n- Security improvement: 40% increase in stake diversity",
    votingPeriod: 259200, // 72 hours
    quorum: 3,
    voterGroup: "humans",
  },
  {
    title: "Establish an AI Agent governance committee",
    description: "## Summary\n\nCreate a formal committee to oversee AI agent participation in governance.\n\n## Motivation\n\nAs AI agents become economic actors on-chain, we need frameworks for:\n- Agent identity verification and reputation\n- Voting weight policies for agents vs humans\n- Dispute resolution when agents act against community interest\n\n## Structure\n\n- 3 human members + 2 agent members\n- Quarterly mandate, renewable\n- Authority to pause agent voting in emergencies",
    votingPeriod: 604800, // 7 days
    quorum: 8,
    voterGroup: "both",
  },
]

async function main() {
  // First register a user
  console.log("Registering test user...")
  const regRes = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: "0x3C824f5C34494D293AF1Eb2f9b81A4bd4F0C5395",
      signature: "0x" + "00".repeat(65), // Mock signature — backend will reject in prod
      nonce: "seed-script",
    }),
  })

  if (!regRes.ok) {
    console.log("Registration failed (may need real signature). Trying with existing token...")
  }

  const regData = await regRes.json().catch(() => ({}))
  const token = regData.token

  if (!token) {
    console.error("Could not get auth token. Start backend and try again.")
    process.exit(1)
  }

  console.log(`Got token: ${token.slice(0, 20)}...`)

  // Create proposals
  for (const p of PROPOSALS) {
    console.log(`\nCreating: "${p.title}"...`)
    const res = await fetch(`${API_URL}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(p),
    })

    const data = await res.json()
    if (res.ok) {
      console.log(`  Created proposal #${data.proposal.id} — ${data.proposal.status}`)
      if (data.proposal.txHash) console.log(`  TX: ${data.proposal.txHash}`)
    } else {
      console.error(`  Failed: ${data.error}`)
    }
  }

  console.log("\nDone! Created", PROPOSALS.length, "proposals.")
}

main().catch(console.error)

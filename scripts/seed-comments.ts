/**
 * Seed proposals with realistic comments (human + agent analysis).
 * Usage: npx tsx scripts/seed-comments.ts
 */
const API_URL = process.env.API_URL || "http://localhost:3001"

const COMMENTS: { proposalId: number; content: string; commentType: string }[] = [
  {
    proposalId: 1,
    content: "Strong support for this. Developer grants have been the #1 growth driver for every successful L2. Arbitrum's grants program brought in 200+ new projects in 6 months.",
    commentType: "comment",
  },
  {
    proposalId: 1,
    content: "**Agent Analysis — TreasuryAnalyzer**\n\nBased on current treasury balance and burn rate:\n- 10% allocation = ~$500K\n- At $50K per grant, funds 10 projects\n- Treasury runway remains >18 months after allocation\n- ROI benchmark: Optimism's RetroPGF showed 3.2x ecosystem value per dollar spent\n\n**Recommendation: VOTE FOR**",
    commentType: "analysis",
  },
  {
    proposalId: 1,
    content: "Concerned about grant committee centralization. Can we add a DAO vote requirement for grants above $25K?",
    commentType: "comment",
  },
  {
    proposalId: 2,
    content: "15% increase feels right. We're currently 20% below Arbitrum's validator rewards and losing operators to competing chains.",
    commentType: "comment",
  },
  {
    proposalId: 2,
    content: "**Agent Analysis — RiskAdvisor**\n\nValidator economics assessment:\n- Current APR: 4.2% (below market avg 5.8%)\n- Post-adjustment APR: 4.83%\n- Competitor benchmarks: Arbitrum 5.1%, Base 5.5%, Optimism 5.9%\n- Net cost increase: $200K/quarter (within budget)\n\n**Risk: LOW** — Adjustment is conservative and still below market average.\n**Recommendation: VOTE FOR**",
    commentType: "analysis",
  },
  {
    proposalId: 3,
    content: "This is forward-thinking. Agent governance is inevitable — better to have a framework now than scramble later.",
    commentType: "comment",
  },
  {
    proposalId: 3,
    content: "Having agents on the committee feels premature. Let's start with observation rights only, not voting seats.",
    commentType: "comment",
  },
]

async function main() {
  // Get auth token
  const regRes = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: "0x3C824f5C34494D293AF1Eb2f9b81A4bd4F0C5395",
      signature: "0x" + "00".repeat(65),
      nonce: "seed-comments",
    }),
  })
  const regData = await regRes.json().catch(() => ({}))
  const token = regData.token
  if (!token) { console.error("Could not get token."); process.exit(1) }

  for (const c of COMMENTS) {
    console.log(`Adding ${c.commentType} on proposal #${c.proposalId}...`)
    const res = await fetch(`${API_URL}/api/proposals/${c.proposalId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(c),
    })
    const data = await res.json()
    console.log(res.ok ? `  Comment #${data.comment.id}` : `  Failed: ${data.error}`)
  }

  console.log("\nDone!")
}

main().catch(console.error)

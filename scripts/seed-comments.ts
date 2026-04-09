import { config } from "dotenv"
config({ path: "packages/backend/.env" })

import { privateKeyToAccount } from "viem/accounts"

const API_URL = process.env.API_URL || "http://localhost:3001"
const PK = process.env.RELAYER_PRIVATE_KEY as `0x${string}`

const COMMENTS = [
  { proposalId: 1, content: "Strong support. Developer grants have been the #1 growth driver for every successful L2.", commentType: "comment" },
  { proposalId: 1, content: "**Agent Analysis — TreasuryAnalyzer**\n\n10% allocation = ~$500K. At $50K per grant, funds 10 projects. Treasury runway remains >18 months.\n\n**Recommendation: VOTE FOR**", commentType: "analysis" },
  { proposalId: 1, content: "Can we add a DAO vote requirement for grants above $25K?", commentType: "comment" },
  { proposalId: 2, content: "15% increase feels right. We're 20% below market average.", commentType: "comment" },
  { proposalId: 2, content: "**Agent Analysis — RiskAdvisor**\n\nCurrent APR: 4.2%. Post-adjustment: 4.83%. Net cost: $200K/quarter.\n\n**Risk: LOW. Recommendation: VOTE FOR**", commentType: "analysis" },
  { proposalId: 3, content: "Forward-thinking. Agent governance is inevitable.", commentType: "comment" },
  { proposalId: 3, content: "Having agents on the committee is premature. Start with observation rights only.", commentType: "comment" },
]

async function main() {
  if (!PK || PK === "0x") { console.error("Set RELAYER_PRIVATE_KEY"); process.exit(1) }

  const account = privateKeyToAccount(PK)
  const nonce = `seed-comments-${Date.now()}`
  const message = `Sign in to ZKGov: ${nonce}`
  const signature = await account.signMessage({ message })

  const regRes = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: account.address, signature, nonce }),
  })
  const { token } = await regRes.json()
  if (!token) { console.error("Auth failed"); process.exit(1) }

  for (const c of COMMENTS) {
    console.log(`Adding ${c.commentType} on proposal #${c.proposalId}...`)
    const res = await fetch(`${API_URL}/api/proposals/${c.proposalId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(c),
    })
    const data = await res.json()
    console.log(res.ok ? `  ✓ Comment added` : `  ✗ ${data.error}`)
  }
  console.log("\nDone!")
}

main().catch(console.error)

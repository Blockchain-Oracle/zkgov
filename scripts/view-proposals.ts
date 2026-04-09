import { config } from "dotenv"
config({ path: "packages/backend/.env" })
/**
 * View all proposals with vote counts and status.
 * Usage: npx tsx scripts/view-proposals.ts
 */
const API_URL = process.env.API_URL || "http://localhost:3001"

async function main() {
  const res = await fetch(`${API_URL}/api/proposals?limit=50`)
  const data = await res.json()

  if (!data.proposals?.length) {
    console.log("No proposals found. Run: npx tsx scripts/seed-proposals.ts")
    return
  }

  console.log("═══════════════════════════════════════════")
  console.log(`  ${data.pagination.total} Proposals`)
  console.log("═══════════════════════════════════════════")

  for (const p of data.proposals) {
    const status = p.status.toUpperCase().padEnd(10)
    const votes = `${p.votes.for}F / ${p.votes.against}A / ${p.votes.abstain}Ab`
    const quorum = p.quorumReached ? "✓" : `${p.totalVotes}/${p.quorum}`

    console.log()
    console.log(`  #${String(p.id).padStart(3, "0")}  [${status}]  ${p.title}`)
    console.log(`        Votes: ${votes}  |  Quorum: ${quorum}  |  Time: ${p.timeRemaining || "Ended"}`)
    console.log(`        Group: ${p.voterGroup}  |  Comments: ${p.commentCount}`)
    if (p.txHash) console.log(`        TX: ${p.txHash}`)
  }

  console.log()
  console.log("═══════════════════════════════════════════")
}

main().catch(console.error)

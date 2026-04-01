#!/usr/bin/env node
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_FILE = path.join(__dirname, "..", "state", "identity.json")

async function main() {
  const args = process.argv.slice(2)
  const proposalIdx = args.indexOf("--proposal")

  if (proposalIdx === -1) {
    console.log("Usage: node analyze_proposal.js --proposal <id>")
    process.exit(1)
  }

  if (!fs.existsSync(STATE_FILE)) {
    console.log("Not set up yet. Run setup_identity.js first.")
    process.exit(1)
  }

  const proposalId = args[proposalIdx + 1]
  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))

  // Fetch proposal details
  const res = await fetch(`${state.apiUrl}/api/proposals/${proposalId}`)
  const data = await res.json()

  if (!res.ok) {
    console.error("Proposal not found.")
    process.exit(1)
  }

  const p = data.proposal || data

  console.log(`\n=== Proposal #${p.id}: ${p.title} ===\n`)
  console.log(p.description || "(No description)")
  console.log(`\nVotes: ${p.votes?.for || 0} for / ${p.votes?.against || 0} against / ${p.votes?.abstain || 0} abstain`)
  console.log(`Quorum: ${p.totalVotes || 0}/${p.quorum}`)
  console.log(`Voter Group: ${p.voterGroup}`)
  console.log(`Time: ${p.timeRemaining || "Ended"}`)
  console.log(`\n--- Analysis can be posted as a comment ---`)
  console.log(`Use: node comment.js --proposal ${proposalId} --content "Your analysis here"`)
}

main().catch(console.error)

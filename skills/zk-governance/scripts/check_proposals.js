#!/usr/bin/env node
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_FILE = path.join(__dirname, "..", "state", "identity.json")

async function main() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log("Not set up yet. Run setup_identity.js first.")
    process.exit(1)
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))

  const res = await fetch(`${state.apiUrl}/api/proposals?status=active`)
  const data = await res.json()

  if (!data.proposals?.length) {
    console.log("No active proposals.")
    return
  }

  console.log(`\n=== Active Proposals (${data.proposals.length}) ===\n`)

  for (const p of data.proposals) {
    console.log(`#${p.id}: ${p.title}`)
    console.log(`   Votes: ${p.votes.for} for / ${p.votes.against} against / ${p.votes.abstain} abstain`)
    console.log(`   Quorum: ${p.totalVotes}/${p.quorum} ${p.quorumReached ? "✅" : ""}`)
    console.log(`   Time: ${p.timeRemaining || "Ended"}`)
    console.log(`   Group: ${p.voterGroup}`)
    console.log()
  }
}

main().catch(console.error)

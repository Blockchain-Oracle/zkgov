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

  const args = process.argv.slice(2)
  const proposalIdx = args.indexOf("--proposal")
  const choiceIdx = args.indexOf("--choice")

  if (proposalIdx === -1 || choiceIdx === -1) {
    console.log("Usage: node vote.js --proposal <id> --choice <yes|no|abstain>")
    process.exit(1)
  }

  const proposalId = parseInt(args[proposalIdx + 1])
  const choiceMap = { yes: 1, no: 0, abstain: 2 }
  const choiceStr = args[choiceIdx + 1]?.toLowerCase()
  const choice = choiceMap[choiceStr]

  if (choice === undefined) {
    console.log("Choice must be: yes, no, or abstain")
    process.exit(1)
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))

  console.log(`Voting ${choiceStr.toUpperCase()} on Proposal #${proposalId}...`)

  const res = await fetch(`${state.apiUrl}/api/votes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify({ proposalId, choice }),
  })

  const data = await res.json()

  if (res.ok) {
    console.log(`\n✅ Vote submitted!`)
    console.log(`TX: ${data.txHash}`)
    console.log("Your vote is anonymous — nobody can see how you voted.")
  } else {
    console.error(`\n❌ Error: ${data.error}`)
  }
}

main().catch(console.error)

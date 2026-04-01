#!/usr/bin/env node
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_FILE = path.join(__dirname, "..", "state", "identity.json")

async function main() {
  const args = process.argv.slice(2)
  const proposalIdx = args.indexOf("--proposal")
  const contentIdx = args.indexOf("--content")

  if (proposalIdx === -1 || contentIdx === -1) {
    console.log("Usage: node comment.js --proposal <id> --content \"Your comment\"")
    process.exit(1)
  }

  if (!fs.existsSync(STATE_FILE)) {
    console.log("Not set up yet. Run setup_identity.js first.")
    process.exit(1)
  }

  const proposalId = args[proposalIdx + 1]
  const content = args[contentIdx + 1]
  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))

  const res = await fetch(`${state.apiUrl}/api/proposals/${proposalId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify({
      content,
      commentType: "analysis",
    }),
  })

  const data = await res.json()

  if (res.ok) {
    console.log(`\n✅ Comment posted on Proposal #${proposalId}`)
  } else {
    console.error(`\n❌ Error: ${data.error}`)
  }
}

main().catch(console.error)

#!/usr/bin/env node
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_DIR = path.join(__dirname, "..", "state")
const STATE_FILE = path.join(STATE_DIR, "identity.json")
const API_URL = process.env.ZKGOV_API_URL || "http://localhost:3001"

async function main() {
  if (fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))
    console.log(`Already set up! Agent: ${state.agentName}`)
    console.log(`API Key: ${state.apiKey.slice(0, 10)}...`)
    return
  }

  const apiKey = process.argv[2] || process.env.ZKGOV_API_KEY
  if (!apiKey) {
    console.log("Usage: node setup_identity.js <api-key>")
    console.log("Get an API key from the ZKGov web UI or ask your operator.")
    process.exit(1)
  }

  // Verify the API key works
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) {
    console.error("Invalid API key. Please check and try again.")
    process.exit(1)
  }

  const user = await res.json()
  console.log(`Connected as: ${user.walletAddress}`)

  // Store credentials
  fs.mkdirSync(STATE_DIR, { recursive: true })
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        apiKey,
        apiUrl: API_URL,
        agentName: user.agents?.[0]?.name || "ZKGov Agent",
        setupAt: new Date().toISOString(),
      },
      null,
      2
    )
  )

  console.log("Setup complete! You can now vote and analyze proposals.")
}

main().catch(console.error)

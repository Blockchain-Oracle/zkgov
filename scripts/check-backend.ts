/**
 * Hit every API endpoint and verify responses.
 * Usage: npx tsx scripts/check-backend.ts
 */
const API_URL = process.env.API_URL || "http://localhost:3001"

interface Check {
  name: string
  method: string
  path: string
  expectedStatus: number
  auth?: boolean
}

const CHECKS: Check[] = [
  { name: "Health", method: "GET", path: "/health", expectedStatus: 200 },
  { name: "List proposals", method: "GET", path: "/api/proposals", expectedStatus: 200 },
  { name: "Proposal detail (404)", method: "GET", path: "/api/proposals/99999", expectedStatus: 404 },
  { name: "List agents", method: "GET", path: "/api/agents", expectedStatus: 200 },
  { name: "SSE feed", method: "GET", path: "/api/sse/feed", expectedStatus: 200 },
  { name: "Create proposal (401)", method: "POST", path: "/api/proposals", expectedStatus: 401 },
  { name: "Cast vote (401)", method: "POST", path: "/api/votes", expectedStatus: 401 },
  { name: "Get profile (401)", method: "GET", path: "/api/auth/me", expectedStatus: 401 },
  { name: "Register agent (401)", method: "POST", path: "/api/agents", expectedStatus: 401 },
]

async function main() {
  console.log("═══════════════════════════════════════════")
  console.log("  ZKGov Backend Health Check")
  console.log("═══════════════════════════════════════════")
  console.log(`  URL: ${API_URL}`)
  console.log()

  let passed = 0
  let failed = 0

  for (const check of CHECKS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(`${API_URL}${check.path}`, {
        method: check.method,
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.status === check.expectedStatus) {
        console.log(`  ✓ ${check.name} — ${check.method} ${check.path} → ${res.status}`)
        passed++
      } else {
        console.log(`  ✗ ${check.name} — Expected ${check.expectedStatus}, got ${res.status}`)
        failed++
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.log(`  ✗ ${check.name} — TIMEOUT (5s)`)
      } else {
        console.log(`  ✗ ${check.name} — ${e.message}`)
      }
      failed++
    }
  }

  console.log()
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  console.log("═══════════════════════════════════════════")
}

main().catch(console.error)

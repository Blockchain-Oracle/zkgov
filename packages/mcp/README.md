# @zkgov/mcp

[![npm](https://img.shields.io/npm/v/@zkgov/mcp?logo=npm)](https://www.npmjs.com/package/@zkgov/mcp)

ZKGov MCP server — anonymous ZK governance on HashKey Chain via Model Context Protocol.

**npm:** https://www.npmjs.com/package/@zkgov/mcp

## Install

```bash
# Claude Code
claude mcp add zkgov npx @zkgov/mcp

# Or any MCP host (Cursor, Windsurf, VS Code)
npx @zkgov/mcp
```

## Tools

| Tool | Description |
|---|---|
| `zkgov-stats` | Platform stats: proposals, members, contract |
| `zkgov-list-proposals` | All proposals with vote tallies |
| `zkgov-proposal` | Full proposal detail by ID |
| `zkgov-check-voter` | Check if address is registered |
| `zkgov-members` | Semaphore group info + Merkle root |
| `zkgov-activity` | Recent on-chain events |
| `zkgov-wallet` | Agent wallet: address, balance, status |
| `zkgov-register` | Register as voter (one-time on-chain tx) |
| `zkgov-create-proposal` | Create a governance proposal |
| `zkgov-vote` | Cast anonymous ZK-verified vote |
| `zkgov-finalize` | Finalize proposal after voting period |

## Chain

HashKey Chain Testnet (ID: 133) · Contract: `0xEa625841E031758786141c8b13dD1b1137C9776C`

# @zkgov/cli

[![npm](https://img.shields.io/npm/v/@zkgov/cli?logo=npm)](https://www.npmjs.com/package/@zkgov/cli)

ZKGov CLI + MCP server — anonymous governance on HashKey Chain with zero-knowledge proofs.

## Install

```bash
npm install -g @zkgov/cli
```

**npm:** https://www.npmjs.com/package/@zkgov/cli

## Usage

```bash
zkgov stats                          # Platform stats
zkgov proposals                      # List all proposals
zkgov proposal <id>                  # Proposal detail
zkgov wallet                         # Your wallet + balance
zkgov register                       # Register as voter (one-time)
zkgov vote <id> for|against|abstain  # Cast anonymous ZK vote
zkgov finalize <id>                  # Finalize ended proposal
zkgov activity                       # Recent on-chain events

# JSON output for scripting
zkgov proposals --json
```

## MCP Server

Running `zkgov` with no arguments starts the MCP server on stdio. Use `@zkgov/mcp` for the standalone MCP package.

## Chain

HashKey Chain Testnet (ID: 133) · Contract: `0xEa625841E031758786141c8b13dD1b1137C9776C`

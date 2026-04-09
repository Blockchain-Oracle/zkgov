import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy"

const API_URL = process.env.API_URL || "http://localhost:3001"
const WEB_URL = process.env.WEB_URL || "http://localhost:3000"
const EXPLORER_URL = "https://testnet-explorer.hsk.xyz"
const CONTRACT = "0xEa625841E031758786141c8b13dD1b1137C9776C"
const PAGE_SIZE = 3

export function createBot(token: string) {
  const bot = new Bot(token)

  // ─── Error handler ──────────────────────────────────────────
  bot.catch((err) => {
    const e = err.error
    if (e instanceof GrammyError) {
      console.error("Telegram API error:", e.description)
    } else if (e instanceof HttpError) {
      console.error("Network error:", e.message)
    } else {
      console.error("Bot error:", e)
    }
  })

  // ─── Register commands + descriptions on startup ────────────
  bot.api.setMyCommands([
    { command: "start", description: "Welcome & overview" },
    { command: "proposals", description: "Browse active proposals" },
    { command: "stats", description: "Platform statistics" },
    { command: "help", description: "How to use ZKGov" },
  ]).catch(() => {})

  bot.api.setMyDescription(
    "ZKGov lets you vote anonymously on governance proposals " +
    "using zero-knowledge proofs on HashKey Chain.\n\n" +
    "Your identity stays private. Your vote is verified on-chain."
  ).catch(() => {})

  bot.api.setMyShortDescription(
    "Anonymous ZK governance voting on HashKey Chain"
  ).catch(() => {})

  // ─── /start ─────────────────────────────────────────────────
  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text("📋  Browse Proposals", "proposals:page:1")
      .row()
      .text("📊  Platform Stats", "show_stats")
      .row()
      .url("🔍  Block Explorer", `${EXPLORER_URL}/address/${CONTRACT}`)

    await ctx.reply(
      `<b>━━━ ZKGov ━━━</b>\n` +
      `<b>Private Governance on HashKey Chain</b>\n\n` +
      `Vote anonymously on proposals using\n` +
      `zero-knowledge proofs.\n\n` +
      `<b>How it works:</b>\n` +
      `  1️⃣  Connect wallet on the web app\n` +
      `  2️⃣  Create your ZK identity (one signature)\n` +
      `  3️⃣  Register on-chain as a voter\n` +
      `  4️⃣  Vote — ZK proof hides your identity\n\n` +
      `<b>Guarantees:</b>\n` +
      `  🔒  Nobody knows how you voted\n` +
      `  ✅  Every vote verified on-chain\n` +
      `  🧾  Full transparency of results\n\n` +
      `<i>Use the buttons below or type / to see commands.</i>`,
      { parse_mode: "HTML", reply_markup: keyboard }
    )
  })

  // ─── /proposals ─────────────────────────────────────────────
  bot.command("proposals", async (ctx) => {
    await sendProposalPage(ctx, 1, false)
  })

  // ─── /stats ─────────────────────────────────────────────────
  bot.command("stats", async (ctx) => {
    await sendStats(ctx, false)
  })

  // ─── /help ──────────────────────────────────────────────────
  bot.command("help", async (ctx) => {
    await ctx.reply(
      `<b>━━━ ZKGov Help ━━━</b>\n\n` +
      `<b>Commands:</b>\n` +
      `  /start — Welcome screen\n` +
      `  /proposals — Browse proposals\n` +
      `  /stats — Platform statistics\n` +
      `  /help — This message\n\n` +
      `<b>Voting:</b>\n` +
      `Voting requires a wallet and ZK identity.\n` +
      `Open the web app to register, then vote\n` +
      `on any proposal. Your vote is anonymous\n` +
      `and verified by a zero-knowledge proof.\n\n` +
      `<b>Links:</b>\n` +
      `  <a href="${EXPLORER_URL}/address/${CONTRACT}">Contract on Explorer</a>`,
      { parse_mode: "HTML", link_preview_options: { is_disabled: true } }
    )
  })

  // ─── Callback: proposal pages ───────────────────────────────
  bot.callbackQuery(/^proposals:page:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const page = parseInt(ctx.match![1])
    await sendProposalPage(ctx, page, true)
  })

  // ─── Callback: proposal detail ──────────────────────────────
  bot.callbackQuery(/^detail:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const id = parseInt(ctx.match![1])
    await sendProposalDetail(ctx, id)
  })

  // ─── Callback: stats ───────────────────────────────────────
  bot.callbackQuery("show_stats", async (ctx) => {
    await ctx.answerCallbackQuery()
    await sendStats(ctx, true)
  })

  // ─── Callback: back to list ─────────────────────────────────
  bot.callbackQuery("back_to_list", async (ctx) => {
    await ctx.answerCallbackQuery()
    await sendProposalPage(ctx, 1, true)
  })

  // ─── Catch-all for unknown callbacks ────────────────────────
  bot.on("callback_query:data", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Unknown action" })
  })

  return bot
}

// ─── Proposal List (paginated) ──────────────────────────────────

async function sendProposalPage(ctx: any, page: number, edit: boolean) {
  try {
    const res = await fetch(`${API_URL}/api/proposals`)
    const data = await res.json()

    if (!data.proposals?.length) {
      const text = "<b>━━━ Proposals ━━━</b>\n\nNo proposals yet. Be the first to create one!"
      const kb = new InlineKeyboard().text("« Back", "back_to_start")
      if (edit) await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb })
      else await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb })
      return
    }

    const proposals = data.proposals
    const totalPages = Math.ceil(proposals.length / PAGE_SIZE)
    const clamped = Math.max(1, Math.min(page, totalPages))
    const slice = proposals.slice((clamped - 1) * PAGE_SIZE, clamped * PAGE_SIZE)

    let text = `<b>━━━ Proposals ━━━</b>\n`
    text += `<i>Page ${clamped} of ${totalPages}  ·  ${proposals.length} total</i>\n`

    for (const p of slice) {
      const votesFor = p.votes?.for ?? p.votesFor ?? 0
      const votesAgainst = p.votes?.against ?? p.votesAgainst ?? 0
      const votesAbstain = p.votes?.abstain ?? p.votesAbstain ?? 0
      const total = p.totalVotes ?? (votesFor + votesAgainst + votesAbstain)
      const quorum = p.quorum ?? 0

      let status = "🟢 Active"
      if (p.finalized) status = p.passed ? "✅ Passed" : "❌ Defeated"
      else if (p.isActive === false) status = "⏳ Ended"

      const bar = progressBar(total, quorum)

      text += `\n<b>#${p.id}  ${escapeHtml(p.title)}</b>\n`
      text += `  ${status}  ·  `
      text += `👍 ${votesFor}  👎 ${votesAgainst}  🤷 ${votesAbstain}\n`
      text += `  Quorum: ${bar} ${total}/${quorum}\n`
    }

    // Build pagination + detail buttons
    const kb = new InlineKeyboard()

    // Detail buttons for each proposal on this page
    for (const p of slice) {
      kb.text(`📋 #${p.id} Details`, `detail:${p.id}`)
      kb.row()
    }

    // Pagination row
    if (clamped > 1) kb.text("« Prev", `proposals:page:${clamped - 1}`)
    kb.text(`${clamped}/${totalPages}`, "noop")
    if (clamped < totalPages) kb.text("Next »", `proposals:page:${clamped + 1}`)

    if (edit) {
      await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb, link_preview_options: { is_disabled: true } })
    } else {
      await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb, link_preview_options: { is_disabled: true } })
    }
  } catch (e: any) {
    const msg = "Could not load proposals. Backend may be offline."
    if (edit) await ctx.editMessageText(msg).catch(() => {})
    else await ctx.reply(msg)
  }
}

// ─── Proposal Detail ────────────────────────────────────────────

async function sendProposalDetail(ctx: any, id: number) {
  try {
    const res = await fetch(`${API_URL}/api/proposals/${id}`)
    const data = await res.json()
    const p = data.proposal

    if (!p) {
      await ctx.editMessageText("Proposal not found.")
      return
    }

    const votesFor = p.votes?.for ?? p.votesFor ?? 0
    const votesAgainst = p.votes?.against ?? p.votesAgainst ?? 0
    const votesAbstain = p.votes?.abstain ?? p.votesAbstain ?? 0
    const total = p.totalVotes ?? (votesFor + votesAgainst + votesAbstain)
    const quorum = p.quorum ?? 0

    let status = "🟢 Active"
    if (p.finalized) status = p.passed ? "✅ Passed" : "❌ Defeated"
    else if (p.isActive === false) status = "⏳ Ended"

    const maxVotes = Math.max(votesFor, votesAgainst, votesAbstain, 1)

    let text = `<b>━━━ Proposal #${id} ━━━</b>\n\n`
    text += `<b>${escapeHtml(p.title)}</b>\n\n`

    // Description (truncated)
    const desc = (p.description || "").replace(/^#+\s*/gm, "").replace(/\n{3,}/g, "\n\n")
    if (desc) {
      const truncated = desc.length > 400 ? desc.slice(0, 400) + "..." : desc
      text += `${escapeHtml(truncated)}\n\n`
    }

    text += `<b>Results:</b>\n`
    text += `  👍 For:      ${voteBar(votesFor, maxVotes)} ${votesFor}\n`
    text += `  👎 Against:  ${voteBar(votesAgainst, maxVotes)} ${votesAgainst}\n`
    text += `  🤷 Abstain:  ${voteBar(votesAbstain, maxVotes)} ${votesAbstain}\n\n`
    text += `  🎯 Quorum: ${progressBar(total, quorum)} ${total}/${quorum}\n`
    text += `  ${status}\n`

    if (p.votingEnd) {
      const end = new Date(p.votingEnd)
      const remaining = end.getTime() - Date.now()
      if (remaining > 0) {
        text += `  ⏰ Ends: ${formatDuration(remaining)}\n`
      }
    }

    if (p.creatorAddress || p.creator?.displayName) {
      const addr = p.creatorAddress || p.creator?.displayName || ""
      text += `  👤 Creator: <code>${escapeHtml(typeof addr === 'string' ? addr.slice(0, 10) + "..." : addr)}</code>\n`
    }

    const kb = new InlineKeyboard()
      .url("🔍 View on Explorer", `${EXPLORER_URL}/address/${CONTRACT}`)
      .row()
      .text("« Back to Proposals", "back_to_list")

    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb, link_preview_options: { is_disabled: true } })
  } catch {
    await ctx.editMessageText("Failed to load proposal details.").catch(() => {})
  }
}

// ─── Stats ──────────────────────────────────────────────────────

async function sendStats(ctx: any, edit: boolean) {
  try {
    const res = await fetch(`${API_URL}/api/stats`)
    const s = await res.json()

    const text =
      `<b>━━━ Platform Stats ━━━</b>\n\n` +
      `  📋  Proposals:   <b>${s.proposals ?? 0}</b>\n` +
      `  👥  Members:     <b>${s.members ?? 0}</b>\n` +
      `  💬  Comments:    <b>${s.comments ?? 0}</b>\n\n` +
      `  🔗  Chain: HashKey Testnet (ID: 133)\n` +
      `  📦  Contract:\n` +
      `  <code>${CONTRACT}</code>\n\n` +
      `<i>All data read directly from the blockchain.</i>`

    const kb = new InlineKeyboard()
      .text("📋  Browse Proposals", "proposals:page:1")
      .row()
      .url("🔍  Block Explorer", `${EXPLORER_URL}/address/${CONTRACT}`)

    if (edit) await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb, link_preview_options: { is_disabled: true } })
    else await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb, link_preview_options: { is_disabled: true } })
  } catch {
    const msg = "Could not load stats. Backend may be offline."
    if (edit) await ctx.editMessageText(msg).catch(() => {})
    else await ctx.reply(msg)
  }
}

// ─── Formatting helpers ─────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function progressBar(current: number, target: number, length = 10): string {
  if (target <= 0) return "░".repeat(length)
  const ratio = Math.min(current / target, 1)
  const filled = Math.round(ratio * length)
  return "▓".repeat(filled) + "░".repeat(length - filled)
}

function voteBar(count: number, max: number, length = 8): string {
  if (max <= 0) return "░".repeat(length)
  const ratio = Math.min(count / max, 1)
  const filled = Math.round(ratio * length)
  return "█".repeat(filled) + "░".repeat(length - filled)
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  const rem = hours % 24
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`
}

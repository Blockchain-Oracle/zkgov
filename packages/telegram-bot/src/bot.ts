import { Bot, InlineKeyboard } from "grammy"

const API_URL = process.env.API_URL || "http://localhost:3001"
const WEB_URL = process.env.WEB_URL || "http://localhost:3000"
const EXPLORER_URL = "https://testnet-explorer.hsk.xyz"
const CONTRACT = "0xEa625841E031758786141c8b13dD1b1137C9776C"

export function createBot(token: string) {
  const bot = new Bot(token)

  // Error handler — log but don't crash
  bot.catch((err) => {
    console.error("Bot error:", err.message || err)
  })

  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text("View Proposals", "list_proposals")
      .row()
      .url("View on Explorer", `${EXPLORER_URL}/address/${CONTRACT}`)

    await ctx.reply(
      "🗳️ *ZKGov — Private Governance*\n\n" +
      "Vote anonymously on proposals using zero-knowledge proofs.\n\n" +
      "• Your votes are private — nobody knows how you voted\n" +
      "• Votes are verified on-chain via ZK proofs\n" +
      "• You sign transactions directly with your wallet\n\n" +
      "Use /proposals to see active proposals!",
      { parse_mode: "Markdown", reply_markup: keyboard }
    )
  })

  bot.command("proposals", async (ctx) => {
    await sendProposalList(ctx)
  })

  bot.callbackQuery("list_proposals", async (ctx) => {
    await ctx.answerCallbackQuery()
    await sendProposalList(ctx)
  })

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "📋 *ZKGov Commands*\n\n" +
      "/start — Welcome\n" +
      "/proposals — View active proposals\n" +
      "/help — This message\n\n" +
      "Tap *Vote* on any proposal to open the web app and cast your anonymous vote!",
      { parse_mode: "Markdown" }
    )
  })

  return bot
}

async function sendProposalList(ctx: any) {
  try {
    const res = await fetch(`${API_URL}/api/proposals`)
    const data = await res.json()

    if (!data.proposals?.length) {
      return ctx.reply("No active proposals right now. Check back later!")
    }

    for (const p of data.proposals.slice(0, 5)) {
      const keyboard = new InlineKeyboard()
        .url("Explorer 🔍", `${EXPLORER_URL}/address/${CONTRACT}`)

      // Only add web link if WEB_URL is HTTPS (Telegram rejects http URLs)
      if (WEB_URL.startsWith("https")) {
        keyboard.url("Vote 🗳️", `${WEB_URL}/proposals/${p.id}`)
      }

      const choices = ["Against", "For", "Abstain"]
      const votesFor = p.votes?.for ?? p.votesFor ?? 0
      const votesAgainst = p.votes?.against ?? p.votesAgainst ?? 0
      const votesAbstain = p.votes?.abstain ?? p.votesAbstain ?? 0
      const totalVotes = p.totalVotes ?? (votesFor + votesAgainst + votesAbstain)
      const quorum = p.quorum ?? 0

      let status = "🟢 Active"
      if (p.finalized) status = p.passed ? "✅ Passed" : "❌ Defeated"
      else if (p.isActive === false) status = "⏰ Ended"

      await ctx.reply(
        `📋 *Proposal \\#${p.id}*\n\n` +
        `*${escapeMarkdown(p.title)}*\n\n` +
        `📊 ${votesFor} for / ${votesAgainst} against / ${votesAbstain} abstain\n` +
        `🎯 Quorum: ${totalVotes}/${quorum}\n` +
        `${status}`,
        { parse_mode: "MarkdownV2", reply_markup: keyboard }
      )
    }
  } catch (e: any) {
    console.error("Failed to fetch proposals:", e.message)
    await ctx.reply("Failed to fetch proposals. Is the backend running?")
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")
}

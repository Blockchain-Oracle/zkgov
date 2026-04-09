import { Bot, InlineKeyboard } from "grammy"

const API_URL = process.env.API_URL || "http://localhost:3001"
const WEB_URL = process.env.WEB_URL || "http://localhost:3000"

export function createBot(token: string) {
  const bot = new Bot(token)

  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .url("Open ZKGov", `${WEB_URL}`)
      .row()
      .text("View Proposals", "list_proposals")

    await ctx.reply(
      "🗳️ *ZKGov — Private Governance*\n\n" +
      "Vote anonymously on proposals using zero-knowledge proofs.\n\n" +
      "• Your votes are private — nobody knows how you voted\n" +
      "• Votes are verified on-chain via ZK proofs\n" +
      "• You sign transactions directly with your wallet\n\n" +
      "Open the app to register and start voting!",
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
        .url("Vote 🗳️", `${WEB_URL}/proposals/${p.id}`)

      await ctx.reply(
        `📋 *Proposal #${p.id}*\n\n` +
        `${p.title}\n\n` +
        `📊 ${p.votes?.for || 0} for / ${p.votes?.against || 0} against / ${p.votes?.abstain || 0} abstain\n` +
        `⏰ ${p.timeRemaining ? `Ends in ${p.timeRemaining}` : "Voting ended"}\n` +
        `🎯 Quorum: ${p.totalVotes || 0}/${p.quorum}`,
        { parse_mode: "Markdown", reply_markup: keyboard }
      )
    }
  } catch {
    await ctx.reply("Failed to fetch proposals. Is the backend running?")
  }
}

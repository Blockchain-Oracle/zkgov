import { Bot, InlineKeyboard } from "grammy"

const API_URL = process.env.API_URL || "http://localhost:3001"
const MINI_APP_URL = process.env.MINI_APP_URL || "http://localhost:3000/tg"
const WEB_URL = process.env.WEB_URL || "http://localhost:3000"

export function createBot(token: string) {
  const bot = new Bot(token)

  // /start — welcome message
  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .url("Register to Vote", `${WEB_URL}/profile`)
      .row()
      .text("View Proposals", "list_proposals")

    await ctx.reply(
      "🗳️ *ZKGov — Private Governance*\n\n" +
      "Vote anonymously on proposals using zero-knowledge proofs.\n\n" +
      "• Your votes are private — nobody knows how you voted\n" +
      "• KYC-verified — only real participants can vote\n" +
      "• On-chain verified — results are tamper-proof\n\n" +
      "Get started by registering, then vote on proposals right here in the chat!",
      { parse_mode: "Markdown", reply_markup: keyboard }
    )
  })

  // /proposals — list active proposals
  bot.command("proposals", async (ctx) => {
    await sendProposalList(ctx)
  })

  // Callback: list_proposals button
  bot.callbackQuery("list_proposals", async (ctx) => {
    await ctx.answerCallbackQuery()
    await sendProposalList(ctx)
  })

  // /help
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "📋 *ZKGov Commands*\n\n" +
      "/start — Welcome & registration\n" +
      "/proposals — View active proposals\n" +
      "/help — This message\n\n" +
      "Tap *Vote Now* on any proposal to cast your anonymous vote!",
      { parse_mode: "Markdown" }
    )
  })

  return bot
}

async function sendProposalList(ctx: any) {
  try {
    const res = await fetch(`${API_URL}/api/proposals?status=active`)
    const data = await res.json()

    if (!data.proposals?.length) {
      return ctx.reply("No active proposals right now. Check back later!")
    }

    for (const p of data.proposals.slice(0, 5)) {
      const keyboard = new InlineKeyboard()
        .webApp("Vote Now 🗳️", `${MINI_APP_URL}/vote/${p.id}`)
        .url("View Details", `${WEB_URL}/proposals/${p.id}`)

      const quorumBar = p.quorumReached ? "✅" : `${p.totalVotes}/${p.quorum}`

      await ctx.reply(
        `📋 *Proposal #${p.id}*\n\n` +
        `${p.title}\n\n` +
        `📊 ${p.votes.for} for / ${p.votes.against} against / ${p.votes.abstain} abstain\n` +
        `⏰ ${p.timeRemaining ? `Ends in ${p.timeRemaining}` : "Voting ended"}\n` +
        `🎯 Quorum: ${quorumBar}`,
        { parse_mode: "Markdown", reply_markup: keyboard }
      )
    }
  } catch (error) {
    await ctx.reply("Failed to fetch proposals. Is the backend running?")
  }
}

// Function to announce a new proposal to a chat
export async function announceProposal(bot: Bot, chatId: number | string, proposal: any) {
  const keyboard = new InlineKeyboard()
    .webApp("Vote Now 🗳️", `${MINI_APP_URL}/vote/${proposal.id}`)
    .url("View Details", `${WEB_URL}/proposals/${proposal.id}`)

  await bot.api.sendMessage(
    chatId,
    `🆕 *New Proposal #${proposal.id}*\n\n` +
    `${proposal.title}\n\n` +
    `⏰ Voting ends: ${new Date(proposal.votingEnd).toLocaleString()}\n` +
    `🎯 Quorum needed: ${proposal.quorum} votes\n\n` +
    `Tap Vote Now to cast your anonymous vote!`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  )
}

// Function to announce a vote was cast
export async function announceVote(bot: Bot, chatId: number | string, proposalId: number) {
  await bot.api.sendMessage(
    chatId,
    `🗳️ An anonymous vote has been cast on *Proposal #${proposalId}*`,
    { parse_mode: "Markdown" }
  )
}

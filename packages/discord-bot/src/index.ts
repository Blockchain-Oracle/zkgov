/**
 * ZKGov Discord Bot
 *
 * Voting flow:
 * 1. /vote <id> → ephemeral message with For/Against/Abstain buttons
 * 2. Button click → deferReply (ZK proof takes time) → call backend API → editReply
 * 3. Bot posts PUBLIC message: "An anonymous vote was cast"
 *
 * The user's discord_id is used to look up their linked ZKGov account.
 * If not linked, they're directed to the web UI to connect.
 *
 * Key constraints:
 * - 3-second response deadline → must deferReply before API call
 * - Buttons, not modals, for vote selection (modals only support text inputs)
 * - Ephemeral messages for privacy (only the user sees their vote interaction)
 */

import "dotenv/config"
import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js"

const API_URL = process.env.API_URL || "http://localhost:3001"
const WEB_URL = process.env.WEB_URL || "https://zkgov.xyz"

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
})

client.on("ready", () => {
  console.log(`Discord bot logged in as ${client.user?.tag}`)
})

client.on("interactionCreate", async (interaction) => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "proposals") {
      await handleProposals(interaction)
    } else if (interaction.commandName === "vote") {
      await handleVote(interaction)
    } else if (interaction.commandName === "propose") {
      await handlePropose(interaction)
    } else if (interaction.commandName === "link") {
      await handleLink(interaction)
    }
  }

  // Button clicks — this is where the actual vote happens
  if (interaction.isButton()) {
    const [action, proposalId, choice] = interaction.customId.split(":")

    if (action === "vote_choice") {
      // Defer immediately — ZK proof generation + on-chain submission takes time
      await interaction.deferReply({ flags: 64 }) // ephemeral

      const discordId = interaction.user.id

      try {
        // Look up user by discord_id via backend
        // For now, we check if they have a linked account by trying to vote
        // The backend needs the user's JWT, which we get from discord_id lookup
        const lookupRes = await fetch(`${API_URL}/api/auth/discord/lookup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discordId }),
        })

        if (!lookupRes.ok) {
          // User not linked
          await interaction.editReply({
            content:
              `🔗 **Account not linked**\n\n` +
              `To vote from Discord, link your account first:\n` +
              `${WEB_URL}/profile\n\n` +
              `1. Connect your wallet on the web\n` +
              `2. Click "Link Discord" in your profile\n` +
              `3. Come back and \`/vote\` again`,
          })
          return
        }

        const { token } = await lookupRes.json()

        // Cast vote via backend (ZK proof generated server-side)
        const voteRes = await fetch(`${API_URL}/api/votes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-Platform": "discord",
          },
          body: JSON.stringify({
            proposalId: parseInt(proposalId),
            choice: parseInt(choice),
          }),
        })

        const voteData = await voteRes.json()

        if (voteRes.ok) {
          // Ephemeral confirmation
          await interaction.editReply({
            content:
              `✓ **Your anonymous vote has been cast**\n\n` +
              `Proposal #${proposalId} · Choice: ${["Against", "For", "Abstain"][parseInt(choice)]}\n` +
              `TX: \`${voteData.txHash?.slice(0, 18)}...\`\n\n` +
              `Nobody can see how you voted — verified by zero-knowledge proof.`,
          })

          // Post public announcement in the channel
          if (interaction.channel) {
            await interaction.channel.send(
              `🗳️ An anonymous vote was cast on **Proposal #${proposalId}**`
            )
          }
        } else {
          await interaction.editReply({
            content: `Vote failed: ${voteData.error || "Unknown error"}`,
          })
        }
      } catch (error: any) {
        await interaction.editReply({
          content: `Vote failed: ${error.message || "Network error"}`,
        })
      }
    }
  }
})

async function handleProposals(interaction: any) {
  try {
    const status = interaction.options.getString("status") || "active"
    const res = await fetch(`${API_URL}/api/proposals?status=${status}`)
    const data = await res.json()

    if (!data.proposals?.length) {
      return interaction.reply({ content: "No active proposals.", flags: 64 })
    }

    const embeds = data.proposals.slice(0, 5).map((p: any) => {
      return new EmbedBuilder()
        .setTitle(`Proposal #${p.id}: ${p.title}`)
        .setDescription(p.description?.slice(0, 200) || "")
        .addFields(
          { name: "For", value: `${p.votes.for}`, inline: true },
          { name: "Against", value: `${p.votes.against}`, inline: true },
          { name: "Abstain", value: `${p.votes.abstain}`, inline: true },
          { name: "Quorum", value: `${p.totalVotes}/${p.quorum}`, inline: true },
          { name: "Time", value: p.timeRemaining || "Ended", inline: true }
        )
        .setColor(0x818cf8)
        .setURL(`${WEB_URL}/proposals/${p.id}`)
    })

    await interaction.reply({ embeds, flags: 64 })
  } catch {
    await interaction.reply({ content: "Failed to fetch proposals.", flags: 64 })
  }
}

async function handleVote(interaction: any) {
  const proposalId = interaction.options.getInteger("proposal_id")

  // Fetch proposal to show context
  let proposalTitle = `Proposal #${proposalId}`
  try {
    const res = await fetch(`${API_URL}/api/proposals/${proposalId}`)
    const data = await res.json()
    if (data.proposal?.title) proposalTitle = data.proposal.title
  } catch {}

  // Ephemeral message with vote buttons — only the user sees this
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`vote_choice:${proposalId}:1`)
      .setLabel("For")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`vote_choice:${proposalId}:0`)
      .setLabel("Against")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`vote_choice:${proposalId}:2`)
      .setLabel("Abstain")
      .setStyle(ButtonStyle.Secondary)
  )

  await interaction.reply({
    content:
      `🗳️ **Vote on Proposal #${proposalId}**\n` +
      `> ${proposalTitle}\n\n` +
      `Your vote is anonymous — nobody will know how you voted.\n` +
      `Choose below:`,
    components: [row],
    flags: 64, // ephemeral
  })
}

async function handlePropose(interaction: any) {
  const title = interaction.options.getString("title")
  const description = interaction.options.getString("description")

  await interaction.reply({
    content:
      `📝 **Create Proposal**\n\n` +
      `Visit the web app to create your proposal with full ZK verification:\n` +
      `${WEB_URL}/proposals/new`,
    flags: 64,
  })
}

async function handleLink(interaction: any) {
  const discordId = interaction.user.id
  await interaction.reply({
    content:
      `🔗 **Link your Discord to ZKGov**\n\n` +
      `Your Discord ID: \`${discordId}\`\n\n` +
      `1. Visit ${WEB_URL}/profile\n` +
      `2. Connect your wallet\n` +
      `3. Click "Link Discord"\n\n` +
      `Once linked, you can vote directly from this server!`,
    flags: 64,
  })
}

const discordToken = process.env.DISCORD_BOT_TOKEN
if (!discordToken) {
  console.error("DISCORD_BOT_TOKEN not set. Skipping bot startup.")
  process.exit(0)
}

client.login(discordToken)

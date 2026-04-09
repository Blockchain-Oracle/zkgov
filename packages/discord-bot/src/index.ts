/**
 * ZKGov Discord Bot
 * Shows proposals and links to the web app for voting.
 * Voting requires a wallet signature, so it happens on the web.
 */

import "dotenv/config"
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js"

const API_URL = process.env.API_URL || "http://localhost:3001"
const WEB_URL = process.env.WEB_URL || "http://localhost:3000"

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.on("ready", () => {
  console.log(`Discord bot logged in as ${client.user?.tag}`)
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === "proposals") {
    try {
      const res = await fetch(`${API_URL}/api/proposals`)
      const data = await res.json()

      if (!data.proposals?.length) {
        return interaction.reply({ content: "No active proposals.", flags: 64 })
      }

      const embeds = data.proposals.slice(0, 5).map((p: any) =>
        new EmbedBuilder()
          .setTitle(`Proposal #${p.id}: ${p.title}`)
          .addFields(
            { name: "For", value: `${p.votes?.for || 0}`, inline: true },
            { name: "Against", value: `${p.votes?.against || 0}`, inline: true },
            { name: "Abstain", value: `${p.votes?.abstain || 0}`, inline: true },
            { name: "Quorum", value: `${p.totalVotes || 0}/${p.quorum}`, inline: true },
            { name: "Status", value: p.status, inline: true },
          )
          .setColor(0x818cf8)
          .setURL(`${WEB_URL}/proposals/${p.id}`)
      )

      await interaction.reply({ embeds, flags: 64 })
    } catch {
      await interaction.reply({ content: "Failed to fetch proposals.", flags: 64 })
    }
  }

  if (interaction.commandName === "vote") {
    const proposalId = interaction.options.getInteger("proposal_id")
    await interaction.reply({
      content:
        `🗳️ **Vote on Proposal #${proposalId}**\n\n` +
        `Open the web app to cast your anonymous vote with a ZK proof:\n` +
        `${WEB_URL}/proposals/${proposalId}\n\n` +
        `You'll sign the transaction directly with your wallet.`,
      flags: 64,
    })
  }

  if (interaction.commandName === "link") {
    await interaction.reply({
      content: `🔗 Visit ${WEB_URL}/profile to link your Discord account.`,
      flags: 64,
    })
  }
})

const discordToken = process.env.DISCORD_BOT_TOKEN
if (!discordToken) {
  console.error("DISCORD_BOT_TOKEN not set. Skipping bot startup.")
  process.exit(0)
}

client.login(discordToken)

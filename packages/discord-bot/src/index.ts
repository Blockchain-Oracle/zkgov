import "dotenv/config"
import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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

  // Button clicks
  if (interaction.isButton()) {
    const [action, proposalId, choice] = interaction.customId.split(":")

    if (action === "vote_choice") {
      // Show confirmation modal
      const modal = new ModalBuilder()
        .setCustomId(`confirm_vote:${proposalId}:${choice}`)
        .setTitle("Confirm Your Vote")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("reason")
              .setLabel("Reason (optional)")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setPlaceholder("Why are you voting this way?")
          )
        )

      await interaction.showModal(modal)
    }
  }

  // Modal submissions
  if (interaction.isModalSubmit()) {
    const [action, proposalId, choice] = interaction.customId.split(":")

    if (action === "confirm_vote") {
      await interaction.deferReply({ flags: 64 }) // ephemeral

      try {
        // TODO: This needs the user's auth token
        // For now, show the web link
        await interaction.editReply({
          content:
            `To vote with ZK privacy, please use the web app:\n` +
            `${WEB_URL}/proposal/${proposalId}\n\n` +
            `(Direct Discord voting requires account linking via \`/link\`)`,
        })
      } catch (error) {
        await interaction.editReply({ content: "Vote failed. Please try again." })
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
        .setTitle(`📋 Proposal #${p.id}: ${p.title}`)
        .setDescription(p.description?.slice(0, 200) || "")
        .addFields(
          { name: "For", value: `${p.votes.for}`, inline: true },
          { name: "Against", value: `${p.votes.against}`, inline: true },
          { name: "Abstain", value: `${p.votes.abstain}`, inline: true },
          { name: "Quorum", value: `${p.totalVotes}/${p.quorum}`, inline: true },
          { name: "Time", value: p.timeRemaining || "Ended", inline: true }
        )
        .setColor(0x7c3aed)
        .setURL(`${WEB_URL}/proposal/${p.id}`)
    })

    await interaction.reply({ embeds, flags: 64 })
  } catch {
    await interaction.reply({ content: "Failed to fetch proposals.", flags: 64 })
  }
}

async function handleVote(interaction: any) {
  const proposalId = interaction.options.getInteger("proposal_id")

  // Ephemeral message with vote buttons
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`vote_choice:${proposalId}:1`)
      .setLabel("Yes")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`vote_choice:${proposalId}:0`)
      .setLabel("No")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`vote_choice:${proposalId}:2`)
      .setLabel("Abstain")
      .setStyle(ButtonStyle.Secondary)
  )

  await interaction.reply({
    content: `🗳️ **Vote on Proposal #${proposalId}**\n\nYour vote is anonymous — nobody will know how you voted.`,
    components: [row],
    flags: 64, // ephemeral
  })
}

async function handlePropose(interaction: any) {
  const title = interaction.options.getString("title")
  const description = interaction.options.getString("description")

  await interaction.reply({
    content:
      `To create a proposal with ZK verification, visit:\n` +
      `${WEB_URL}/proposal/new?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`,
    flags: 64,
  })
}

async function handleLink(interaction: any) {
  await interaction.reply({
    content:
      `🔗 **Link your Discord to ZKGov**\n\n` +
      `Visit your profile to connect:\n${WEB_URL}/profile\n\n` +
      `Once linked, you can vote directly from Discord!`,
    flags: 64,
  })
}

const token = process.env.DISCORD_BOT_TOKEN
if (!token) {
  console.error("DISCORD_BOT_TOKEN not set. Skipping bot startup.")
  process.exit(0)
}

client.login(token)

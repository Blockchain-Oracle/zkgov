import "dotenv/config"
import { REST, Routes, SlashCommandBuilder } from "discord.js"

const commands = [
  new SlashCommandBuilder()
    .setName("proposals")
    .setDescription("List active governance proposals")
    .addStringOption((opt) =>
      opt.setName("status").setDescription("Filter by status").addChoices(
        { name: "Active", value: "active" },
        { name: "All", value: "all" }
      )
    ),
  new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Cast an anonymous vote on a proposal")
    .addIntegerOption((opt) =>
      opt.setName("proposal_id").setDescription("Proposal number").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("propose")
    .setDescription("Create a new governance proposal")
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Proposal title").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("description").setDescription("Proposal description").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Discord account to ZKGov"),
]

const token = process.env.DISCORD_BOT_TOKEN!
const clientId = process.env.DISCORD_CLIENT_ID!

const rest = new REST().setToken(token)

console.log("Registering slash commands...")
await rest.put(Routes.applicationCommands(clientId), {
  body: commands.map((c) => c.toJSON()),
})
console.log("Slash commands registered!")

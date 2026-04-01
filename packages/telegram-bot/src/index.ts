import "dotenv/config"
import { createBot } from "./bot.js"

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN not set. Skipping bot startup.")
  process.exit(0)
}

const bot = createBot(token)

// Development: long polling
console.log("Starting Telegram bot (long polling)...")
bot.start({
  onStart: () => console.log("Telegram bot is running!"),
})

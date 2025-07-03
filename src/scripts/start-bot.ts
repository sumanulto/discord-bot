import { getBotInstance } from "../lib/discord-bot"

async function startBot() {
  try {
    console.log("Starting Discord Music Bot...")
    const bot = getBotInstance()

    // Instance is obtained and used as a singleton

    await bot.start()
    console.log("Discord Music Bot started successfully!")

    // Keep the process alive
    process.on("SIGINT", () => {
      console.log("Shutting down bot...")
      process.exit(0)
    })
  } catch (error) {
    console.error("Failed to start Discord Music Bot:", error)
    process.exit(1)
  }
}

startBot()

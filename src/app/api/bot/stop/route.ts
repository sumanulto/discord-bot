import { NextResponse } from "next/server"
import { getBotInstance } from "@/lib/bot-manager"

export async function POST() {
  try {
    const bot = getBotInstance()
    if (!bot) {
      return NextResponse.json({ error: "Bot is not running" }, { status: 503 })
    }
    // Disconnect all players
    const kazagumo = bot.getKazagumo()
    for (const player of kazagumo.players.values()) {
      player.destroy()
    }
    // Disconnect the client
    bot.getClient().destroy()
    // Optionally, you could clear the bot instance here if you add a clearBotInstance function to bot-manager
    return NextResponse.json({
      success: true,
      message: "Bot stopped successfully",
    })
  } catch (error) {
    console.error("Failed to stop bot:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to stop bot",
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { botManager } from "@/lib/bot-manager"

export async function POST() {
  try {
    const bot = botManager.getBotSync()

    if (bot) {
      // Disconnect all players
      const kazagumo = bot.getKazagumo()
      for (const player of kazagumo.players.values()) {
        player.destroy()
      }

      // Disconnect the client
      bot.getClient().destroy()

      // Clear the bot instance
      botManager.clearBot()
    }

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

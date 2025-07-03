import { NextResponse } from "next/server"
import { botManager } from "@/lib/bot-manager"

export async function GET() {
  try {
    // Try to get or start the bot
    const bot = await botManager.getBot()
    const client = bot.getClient()
    const kazagumo = bot.getKazagumo()

    const isOnline = bot.isOnline()

    const status = {
      botOnline: isOnline,
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      players: kazagumo.players.size,
      nodes: Array.from(kazagumo.shoukaku.nodes.values()).map((node) => ({
        identifier: node.name,
        connected: node.state === 2,
        stats: node.stats || {},
      })),
    }

    console.log("Bot status response:", status)
    return NextResponse.json(status)
  } catch (error) {
    console.error("Status endpoint error:", error)
    return NextResponse.json(
      {
        botOnline: false,
        guilds: 0,
        users: 0,
        players: 0,
        nodes: [],
        error: error instanceof Error ? error.message : "Failed to get bot status",
      },
      { status: 200 }, // Return 200 to avoid dashboard errors
    )
  }
}

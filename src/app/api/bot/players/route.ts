import { NextResponse } from "next/server"
import { botManager } from "@/lib/bot-manager"

export async function GET() {
  try {
    if (!botManager.hasBot()) {
      return NextResponse.json([])
    }

    const bot = botManager.getBotSync()!
    const kazagumo = bot.getKazagumo()

    const players = Array.from(kazagumo.players.values()).map((player) => {
      const current = player.queue.current
      const queue = player.queue.slice(0, 10)

      return {
        guildId: player.guildId,
        voiceChannel: player.voiceId,
        textChannel: player.textId,
        connected: player.shoukaku.state === 2,
        playing: player.playing,
        paused: player.paused,
        position: player.shoukaku.position || 0,
        volume: player.volume,
        current: current
          ? {
              title: current.title,
              author: current.author,
              duration: current.length || 0,
              uri: current.uri,
              thumbnail: current.thumbnail,
            }
          : null,
        queue: queue.map((track) => ({
          title: track.title,
          author: track.author,
          duration: track.length || 0,
        })),
      }
    })

    console.log(`Found ${players.length} active players`)
    return NextResponse.json(players)
  } catch (error) {
    console.error("Players endpoint error:", error)
    return NextResponse.json([])
  }
}

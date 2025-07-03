import { type NextRequest, NextResponse } from "next/server"
import { botManager } from "@/lib/bot-manager"

export async function POST(request: NextRequest) {
  try {
    const { action, guildId, query } = await request.json()
    console.log("Control request:", { action, guildId, query })

    if (!botManager.hasBot()) {
      return NextResponse.json({ error: "Bot not online" }, { status: 503 })
    }

    const bot = botManager.getBotSync()!
    const kazagumo = bot.getKazagumo()
    const player = kazagumo.players.get(guildId)

    if (!player) {
      return NextResponse.json({ error: "No active player found for this server" }, { status: 404 })
    }

    switch (action) {
      case "play":
        if (query) {
          try {
            const track = await bot.searchAndPlay(guildId, query, "dashboard")
            return NextResponse.json({
              success: true,
              message: `Added "${track.title}" to queue`,
            })
          } catch (error) {
            return NextResponse.json(
              {
                error: error instanceof Error ? error.message : "Failed to add track",
              },
              { status: 400 },
            )
          }
        } else {
          await player.pause(false)
          return NextResponse.json({ success: true, message: "Resumed playback" })
        }

      case "pause":
        if (player.playing) {
          await player.pause(true)
          return NextResponse.json({ success: true, message: "Paused playback" })
        } else {
          return NextResponse.json({ error: "Nothing is playing" }, { status: 400 })
        }

      case "skip":
        if (player.queue.current) {
          const currentTrack = player.queue.current.title
          await player.skip()
          return NextResponse.json({ success: true, message: `Skipped "${currentTrack}"` })
        } else {
          return NextResponse.json({ error: "Nothing is playing" }, { status: 400 })
        }

      case "stop":
        player.queue.clear()
        player.destroy()
        return NextResponse.json({ success: true, message: "Stopped and cleared queue" })

      case "volume":
        const volume = Number.parseInt(query)
        if (volume >= 0 && volume <= 100) {
          player.setVolume(volume)
          return NextResponse.json({ success: true, message: `Set volume to ${volume}%` })
        } else {
          return NextResponse.json({ error: "Volume must be between 0 and 100" }, { status: 400 })
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Control endpoint error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to control player",
      },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { botManager } from "@/lib/bot-manager"
import { playerSettings, RepeatMode } from "@/lib/playerSettings"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, guildId, query, index, enabled, mode } = body

    if (!botManager.hasBot()) {
      return NextResponse.json({ error: "Bot not online" }, { status: 503 })
    }

    const bot = botManager.getBotSync()!
    const kazagumo = bot.getKazagumo()
    const player = kazagumo.players.get(guildId)

    if (!player) {
      return NextResponse.json({ error: "No active player found for this server" }, { status: 404 })
    }

    // Initialize settings if missing
    const settings = playerSettings.get(guildId) ?? { shuffleEnabled: false, repeatMode: "off" }
    playerSettings.set(guildId, settings)

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

      case "previous":
        if (player.queue.previous.length > 0) {
          const previousTrack = player.queue.previous[player.queue.previous.length - 1]
          player.queue.unshift(previousTrack)
          await player.skip()
          return NextResponse.json({ success: true, message: "Playing previous track" })
        } else {
          return NextResponse.json({ error: "No previous track available" }, { status: 400 })
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

      case "seek":
        const position = Number.parseInt(query)
        if (
          player.queue.current &&
          typeof player.queue.current.length === "number" &&
          position >= 0 &&
          position <= player.queue.current.length
        ) {
          await player.shoukaku.seekTo(position)
          return NextResponse.json({ success: true, message: `Seeked to position` })
        } else {
          return NextResponse.json({ error: "Invalid seek position" }, { status: 400 })
        }

      case "playNext":
        if (typeof index !== "number" || index < 0 || index >= player.queue.length) {
          return NextResponse.json({ error: "Invalid track index" }, { status: 400 })
        }

        const trackToMoveNext = player.queue[index]
        player.queue.splice(index, 1)
        player.queue.unshift(trackToMoveNext)

        return NextResponse.json({
          success: true,
          message: `Moved "${trackToMoveNext.title}" to play next`,
        })

      case "remove":
        if (typeof index !== "number" || index < 0 || index >= player.queue.length) {
          return NextResponse.json({ error: "Invalid track index" }, { status: 400 })
        }

        const trackToRemove = player.queue[index]
        player.queue.splice(index, 1)

        return NextResponse.json({
          success: true,
          message: `Removed "${trackToRemove.title}" from queue`,
        })

      case "shuffle":
        if (typeof enabled !== "boolean") {
          return NextResponse.json({ error: "Missing or invalid 'enabled' flag for shuffle" }, { status: 400 })
        }

        settings.shuffleEnabled = enabled

        if (settings.shuffleEnabled) {
          // Shuffle queue in place (Fisher-Yates)
          for (let i = player.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
              ;[player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]]
          }
        } else {
          // Optional: you can restore original queue order if you save it somewhere
        }

        playerSettings.set(guildId, settings)
        return NextResponse.json({
          success: true,
          message: `Shuffle ${settings.shuffleEnabled ? "enabled" : "disabled"}`,
        })

      case "repeat":
        if (!["off", "one", "all"].includes(mode)) {
          return NextResponse.json({ error: "Invalid repeat mode" }, { status: 400 })
        }
        settings.repeatMode = mode as RepeatMode
        playerSettings.set(guildId, settings)
        return NextResponse.json({
          success: true,
          message: `Repeat mode set to ${settings.repeatMode}`,
        })

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
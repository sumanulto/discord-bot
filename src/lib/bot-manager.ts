// BotManager now only stores a reference to an externally managed bot instance.
import type { DiscordMusicBot } from "./discord-bot"

let botInstance: DiscordMusicBot | null = null

export function setBotInstance(instance: DiscordMusicBot) {
  botInstance = instance
}

export function getBotInstance(): DiscordMusicBot | null {
  return botInstance
}

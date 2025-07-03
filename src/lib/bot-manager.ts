import { DiscordMusicBot } from "./discord-bot"

class BotManager {
  private static instance: BotManager
  private bot: DiscordMusicBot | null = null
  private isStarting = false

  private constructor() {}

  public static getInstance(): BotManager {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager()
    }
    return BotManager.instance
  }

  public async getBot(): Promise<DiscordMusicBot> {
    if (this.bot) {
      return this.bot
    }

    if (this.isStarting) {
      // Wait for the bot to finish starting
      while (this.isStarting) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      return this.bot!
    }

    this.isStarting = true
    try {
      console.log("Creating new bot instance...")
      this.bot = new DiscordMusicBot()
      await this.bot.start()
      console.log("Bot started successfully!")
    } catch (error) {
      console.error("Failed to start bot:", error)
      this.bot = null
      throw error
    } finally {
      this.isStarting = false
    }

    return this.bot
  }

  public hasBot(): boolean {
    return this.bot !== null && this.bot.isOnline()
  }

  public getBotSync(): DiscordMusicBot | null {
    return this.bot
  }
}

export const botManager = BotManager.getInstance()

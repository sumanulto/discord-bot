import "dotenv/config"
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type VoiceChannel,
  TextChannel,
  NewsChannel,
  ThreadChannel,
} from "discord.js"
import { Connectors } from "shoukaku"
import { Kazagumo, type KazagumoPlayer } from "kazagumo"
import KazagumoSpotify from "kazagumo-spotify"

export class DiscordMusicBot {
  private client: Client
  private kazagumo: Kazagumo
  private rest: REST
  private isReady = false

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
    })

    this.rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!)

    this.kazagumo = new Kazagumo(
      {
        defaultSearchEngine: "youtube",
        send: (guildId, payload) => {
          const guild = this.client.guilds.cache.get(guildId)
          if (guild) guild.shard.send(payload)
        },
        plugins: [
          new KazagumoSpotify({
            clientId: process.env.SPOTIFY_CLIENT_ID!,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
            playlistPageLimit: 1,
            albumPageLimit: 1,
            searchLimit: 10,
            searchMarket: "US",
          }),
        ],
      },
      new Connectors.DiscordJS(this.client),
      [
        {
          name: "Lavalink",
          url: `${process.env.LAVALINK_HOST || "localhost"}:${process.env.LAVALINK_PORT || "2333"}`,
          auth: process.env.LAVALINK_PASSWORD || "youshallnotpass",
          secure: false,
        },
      ],
    )

    this.setupEventListeners()
    this.registerSlashCommands()
  }

  private setupEventListeners() {
    this.client.once("ready", () => {
      console.log(`Bot is ready! Logged in as ${this.client.user?.tag}`)
      this.isReady = true
    })

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return
      await this.handleSlashCommand(interaction)
    })

    // Kazagumo events
    this.kazagumo.shoukaku.on("ready", (name) => {
      console.log(`Lavalink ${name} is ready!`)
    })

    this.kazagumo.shoukaku.on("error", (name, error) => {
      console.error(`Lavalink ${name} error:`, error)
    })

    this.kazagumo.shoukaku.on("close", (name, code, reason) => {
      console.log(`Lavalink ${name} closed with code ${code} and reason ${reason}`)
    })

    this.kazagumo.shoukaku.on("disconnect", (name, count) => {
      console.log(`Lavalink ${name} disconnected (${count} players)`)
    })

    this.kazagumo.on("playerStart", (player, track) => {
      console.log(`Now playing: ${track.title} by ${track.author}`)
      const channel = this.client.channels.cache.get(player.textId!)
      if (channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof ThreadChannel) {
        channel.send(`🎵 Now playing: **${track.title}** by **${track.author}**`)
      }
    })

    this.kazagumo.on("playerEnd", (player) => {
      console.log("Song ended")
    })

    this.kazagumo.on("playerEmpty", (player) => {
      console.log("Queue is empty, destroying player")
      const channel = this.client.channels.cache.get(player.textId!)
      if (channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof ThreadChannel) {
        channel.send("Queue is empty. Leaving voice channel.")
      }
      player.destroy()
    })

    this.kazagumo.on("playerException", (player, data) => {
      console.error("Player exception:", data.exception?.message)
      const channel = this.client.channels.cache.get(player.textId!)
      if (channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof ThreadChannel) {
        channel.send(`An error occurred: ${data.exception?.message || "Unknown error"}`)
      }
    })
  }

  private async registerSlashCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song")
        .addStringOption((option) => option.setName("query").setDescription("Song name or URL").setRequired(true)),
      new SlashCommandBuilder().setName("pause").setDescription("Pause the current song"),
      new SlashCommandBuilder().setName("resume").setDescription("Resume the current song"),
      new SlashCommandBuilder().setName("skip").setDescription("Skip the current song"),
      new SlashCommandBuilder().setName("previous").setDescription("Play the previous song"),
      new SlashCommandBuilder().setName("stop").setDescription("Stop playing and clear the queue"),
      new SlashCommandBuilder().setName("queue").setDescription("Show the current queue"),
      new SlashCommandBuilder().setName("nowplaying").setDescription("Show the currently playing song"),
      new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Set the volume")
        .addIntegerOption((option) => option.setName("level").setDescription("Volume level (0-100)").setRequired(true)),
      new SlashCommandBuilder()
        .setName("seek")
        .setDescription("Seek to a position in the current song")
        .addIntegerOption((option) =>
          option.setName("position").setDescription("Position in seconds").setRequired(true),
        ),
    ]

    try {
      console.log("Started refreshing application (/) commands.")
      await this.rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.DISCORD_GUILD_ID!),
        { body: commands.map((command) => command.toJSON()) },
      )
      console.log("Successfully reloaded application (/) commands.")
    } catch (error) {
      console.error("Failed to register slash commands:", error)
    }
  }

  private async handleSlashCommand(interaction: ChatInputCommandInteraction) {
    const { commandName, member, guild } = interaction

    if (!guild || !member) return

    let voiceChannel: VoiceChannel | null = null
    if ("voice" in member && member.voice.channel && member.voice.channel.type === 2) {
      voiceChannel = member.voice.channel as VoiceChannel
    }

    if (!voiceChannel && commandName !== "queue" && commandName !== "nowplaying") {
      return interaction.reply({
        content: "You need to be in a voice channel!",
        ephemeral: true,
      })
    }

    const player = this.kazagumo.players.get(guild.id)

    switch (commandName) {
      case "play":
        await this.handlePlay(interaction, player, voiceChannel!)
        break
      case "pause":
        await this.handlePause(interaction, player)
        break
      case "resume":
        await this.handleResume(interaction, player)
        break
      case "skip":
        await this.handleSkip(interaction, player)
        break
      case "previous":
        await this.handlePrevious(interaction, player)
        break
      case "stop":
        await this.handleStop(interaction, player)
        break
      case "queue":
        await this.handleQueue(interaction, player)
        break
      case "nowplaying":
        await this.handleNowPlaying(interaction, player)
        break
      case "volume":
        await this.handleVolume(interaction, player)
        break
      case "seek":
        await this.handleSeek(interaction, player)
        break
    }
  }

  private async handlePlay(
    interaction: ChatInputCommandInteraction,
    player: KazagumoPlayer | undefined,
    voiceChannel: VoiceChannel,
  ) {
    await interaction.deferReply()
    let query = interaction.options.getString("query", true)

    query = query.replace("https://music.youtube.com", "https://www.youtube.com")

    if (!player) {
      player = await this.kazagumo.createPlayer({
        guildId: interaction.guild!.id,
        textId: interaction.channelId,
        voiceId: voiceChannel.id,
        volume: 100,
        deaf: true,
      })
    }

    const result = await this.kazagumo.search(query, {
      requester: interaction.user,
    })

    if (!result.tracks.length) {
      return interaction.editReply({ content: "No tracks found!" })
    }

    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) {
        player.queue.add(track)
      }
      await interaction.editReply(
        `Added **${result.tracks.length}** tracks from **${result.playlistName}** to the queue.`,
      )
    } else {
      const track = result.tracks[0]
      player.queue.add(track)
      await interaction.editReply(`Added **${track.title}** by **${track.author}** to the queue.`)
    }

    if (!player.playing && !player.paused) {
      await player.play()
    }
  }

  private async handlePause(interaction: ChatInputCommandInteraction, player: KazagumoPlayer | undefined) {
    if (!player || !player.playing) {
      return interaction.reply({
        content: "Nothing is currently playing.",
        ephemeral: true,
      })
    }
    await player.pause(true)
    await interaction.reply("⏸️ Paused the current song.")
  }

  private async handleResume(interaction: ChatInputCommandInteraction, player: KazagumoPlayer | undefined) {
    if (!player || !player.paused) {
      return interaction.reply({
        content: "The player is not paused.",
        ephemeral: true,
      })
    }
    await player.pause(false)
    await interaction.reply("▶️ Resumed the current song.")
  }

  private async handleSkip(interaction: ChatInputCommandInteraction, player: KazagumoPlayer | undefined) {
    if (!player || !player.queue.current) {
      return interaction.reply({
        content: "Nothing is currently playing.",
        ephemeral: true,
      })
    }
    const currentTrack = player.queue.current
    await player.skip()
    await interaction.reply(`⏭️ Skipped **${currentTrack.title}**.`)
  }

  private async handlePrevious(interaction: ChatInputCommandInteraction, player: KazagumoPlayer | undefined) {
    if (!player || !player.queue.previous.length) {
      return interaction.reply({
        content: "No previous track available.",
        ephemeral: true,
      })
    }
    const previousTrack = player.queue.previous[player.queue.previous.length - 1]
    player.queue.unshift(previousTrack)
    await player.skip()
    await interaction.reply("⏮️ Playing the previous song.")
  }

  private async handleStop(interaction: ChatInputCommandInteraction, player: KazagumoPlayer | undefined) {
    if (!player) {
      return interaction.reply({
        content: "No player found.",
        ephemeral: true,
      })
    }

    player.queue.clear()
    player.destroy()
    await interaction.reply("⏹️ Stopped playing and cleared the queue.")
  }

  private async handleQueue(interaction: ChatInputCommandInteraction, player: KazagumoPlayer | undefined) {
    if (!player || (!player.queue.current && !player.queue.size)) {
      return interaction.reply({
        content: "The queue is empty.",
        ephemeral: true,
      })
    }

    const queue = player.queue
    const current = queue.current
    const upcoming = queue.slice(0, 10)

    const embed = {
      title: "🎵 Current Queue",
      description: `**Now Playing:**\n${
        current ? `${current.title} - ${current.author}` : "Nothing"
      }\n\n**Up Next:**\n${
        upcoming.length > 0
          ? upcoming.map((track, i) => `${i + 1}. ${track.title} - ${track.author}`).join("\n")
          : "Nothing"
      }`,
      color: 0x00ff00,
      footer: {
        text: `${queue.size} songs in queue`,
      },
    }

    await interaction.reply({ embeds: [embed] })
  }

  private async handleNowPlaying(interaction: ChatInputCommandInteraction, player: KazagumoPlayer | undefined) {
    if (!player || !player.queue.current) {
      return interaction.reply({
        content: "Nothing is currently playing.",
        ephemeral: true,
      })
    }

    const track = player.queue.current
    const position = player.shoukaku.position ?? 0
    const duration = track.length ?? 0

    const embed = {
      title: "🎵 Now Playing",
      description:
        `**${track.title}**\nby **${track.author}**\n\n` +
        `Duration: ${this.formatTime(duration)}\n` +
        `Position: ${this.formatTime(position)}\n` +
        `Volume: ${player.volume}%`,
      color: 0x00ff00,
      thumbnail: {
        url: track.thumbnail || "",
      },
    }

    await interaction.reply({ embeds: [embed] })
  }

  private async handleVolume(interaction: ChatInputCommandInteraction, player: KazagumoPlayer | undefined) {
    if (!player) {
      return interaction.reply({
        content: "No player found.",
        ephemeral: true,
      })
    }

    const volume = interaction.options.getInteger("level", true)

    if (volume < 0 || volume > 100) {
      return interaction.reply({
        content: "Volume must be between 0 and 100.",
        ephemeral: true,
      })
    }

    player.setVolume(volume)
    await interaction.reply(`🔊 Set volume to **${volume}%**.`)
  }

  private async handleSeek(interaction: ChatInputCommandInteraction, player: KazagumoPlayer | undefined) {
    if (!player || !player.queue.current) {
      return interaction.reply({
        content: "Nothing is currently playing.",
        ephemeral: true,
      })
    }

    const position = interaction.options.getInteger("position", true) * 1000 // Convert to milliseconds
    const duration = player.queue.current.length || 0

    if (position < 0 || position > duration) {
      return interaction.reply({
        content: `Position must be between 0 and ${Math.floor(duration / 1000)} seconds.`,
        ephemeral: true,
      })
    }

    await player.shoukaku.seekTo(position)
    await interaction.reply(`⏩ Seeked to **${this.formatTime(position)}**.`)
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  public async start() {
    await this.client.login(process.env.DISCORD_TOKEN)
  }

  public getKazagumo() {
    return this.kazagumo
  }

  public getClient() {
    return this.client
  }

  public isOnline() {
    return this.isReady && this.client.isReady()
  }

  // Dashboard control methods
  public async searchAndPlay(guildId: string, query: string, userId = "dashboard") {
    const player = this.kazagumo.players.get(guildId)
    if (!player) {
      throw new Error("No active player found")
    }

    const result = await this.kazagumo.search(query, { requester: { id: userId } })
    if (!result.tracks.length) {
      throw new Error("No tracks found")
    }

    const track = result.tracks[0]
    player.queue.add(track)

    if (!player.playing && !player.paused) {
      await player.play()
    }

    return track
  }

  public async seekTo(guildId: string, position: number) {
    const player = this.kazagumo.players.get(guildId)
    if (!player) {
      throw new Error("No active player found")
    }

    await player.shoukaku.seekTo(position)
  }
}

// Singleton instance
let botInstance: DiscordMusicBot | null = null

export function hasBotInstance() {
  return botInstance !== null
}

export function getBotInstance(): DiscordMusicBot {
  if (!botInstance) {
    botInstance = new DiscordMusicBot()
  }
  return botInstance
}

export function setBotInstance(instance: DiscordMusicBot) {
  botInstance = instance
}

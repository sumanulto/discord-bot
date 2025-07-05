// src/lib/discord-bot.ts

import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type VoiceChannel,
} from "discord.js";
import { Connectors } from "shoukaku";
import { Kazagumo } from "kazagumo";
import KazagumoSpotify from "kazagumo-spotify";

// Command handlers
import { playCommand } from "@/lib/commands/play";
import { pauseCommand } from "@/lib/commands/pause";
import { resumeCommand } from "@/lib/commands/resume";
import { skipCommand } from "@/lib/commands/skip";
import { stopCommand } from "@/lib/commands/stop";
import { queueCommand } from "@/lib/commands/queue";
import { nowPlayingCommand } from "@/lib/commands/nowplaying";
import { volumeCommand } from "@/lib/commands/volume";
import { seekCommand } from "@/lib/commands/seek";

export class DiscordMusicBot {
  private client: Client;
  private kazagumo: Kazagumo;
  private rest: REST;
  private isReady = false;

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
    });

    this.rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

    this.kazagumo = new Kazagumo(
      {
        defaultSearchEngine: "youtube",
        send: (guildId, payload) => {
          const guild = this.client.guilds.cache.get(guildId);
          if (guild) guild.shard.send(payload);
        },
        plugins: [
          new KazagumoSpotify({
            clientId: process.env.SPOTIFY_CLIENT_ID!,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
          }),
        ],
      },
      new Connectors.DiscordJS(this.client),
      [
        {
          name: "Lavalink",
          url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
          auth: process.env.LAVALINK_PASSWORD!,
          secure: false,
        },
      ]
    );

    this.setupEvents();
    this.registerSlashCommands();
  }

  private setupEvents() {
    this.client.once("ready", () => {
      this.isReady = true;
      console.log(`✅ Logged in as ${this.client.user?.tag}`);
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleCommand(interaction);
    });
  }

  private async registerSlashCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song")
        .addStringOption((opt) => opt.setName("query").setDescription("Search query").setRequired(true)),
      new SlashCommandBuilder().setName("pause").setDescription("Pause current song"),
      new SlashCommandBuilder().setName("resume").setDescription("Resume current song"),
      new SlashCommandBuilder().setName("skip").setDescription("Skip current song"),
      new SlashCommandBuilder().setName("stop").setDescription("Stop and clear queue"),
      new SlashCommandBuilder().setName("queue").setDescription("Show current queue"),
      new SlashCommandBuilder().setName("nowplaying").setDescription("Show now playing"),
      new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Set volume")
        .addIntegerOption((opt) => opt.setName("level").setDescription("0-100").setRequired(true)),
      new SlashCommandBuilder()
        .setName("seek")
        .setDescription("Seek in current song")
        .addIntegerOption((opt) => opt.setName("position").setDescription("In seconds").setRequired(true)),
    ];

    const guildIds = process.env.DISCORD_GUILD_IDS?.split(',') || [];

    if (guildIds.length === 0) {
      console.warn("DISCORD_GUILD_IDS not set. Commands will not be registered in any guild.");
    }

    for (const guildId of guildIds) {
      await this.rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guildId.trim()),
        { body: commands.map((cmd) => cmd.toJSON()) });
    }
  }

  public async searchAndPlay(guildId: string, query: string, requester: any) {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      throw new Error("Guild not found.");
    }

    let player: any = this.kazagumo.players.get(guildId);

    // If no player, create one (assuming requester is a member object with voice channel)
    if (!player) {
      const member = requester as any;
      const voiceChannel: VoiceChannel | null = member?.voice?.channel?.type === 2 ? member.voice.channel : null;

      if (!voiceChannel) {
        throw new Error("Requester is not in a voice channel.");
      }

      // Find a suitable text channel (e.g., the first available text channel or a specified one)
      const textChannel = guild.channels.cache.find(
        (channel) => channel.type === 0 // Type 0 is GUILD_TEXT
      );
      if (!textChannel) {
        throw new Error("No text channel found in the guild.");
      }

      player = this.kazagumo.createPlayer({
        guildId: guild.id,
        textId: textChannel.id,
        voiceId: voiceChannel.id,
        volume: 100,
        deaf: true,
      });
    }

    const result = await this.kazagumo.search(query, { requester: requester });
    if (!result.tracks.length) throw new Error("No tracks found.");

    player.queue.add(result.tracks[0]);


    if (!player.playing && !player.paused) {
      // Ensure player is defined before attempting to connect and play
      if (!player) {
        return result.tracks[0]; // Or throw an error, depending on desired behavior
      }

      await player.connect();
      await player.play();
    }
    return result.tracks[0];
  }
  private async handleCommand(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const player = this.kazagumo.players.get(guild.id);
    const member = interaction.member as any;
    const voiceChannel: VoiceChannel | null = member?.voice?.channel?.type === 2 ? member.voice.channel : null;

    switch (interaction.commandName) {
      case "play":
        if (!voiceChannel) return interaction.reply({ content: "Join a voice channel first!", ephemeral: true });
        await playCommand(interaction, this.kazagumo, player, voiceChannel);
        break;
      case "pause":
        await pauseCommand(interaction, player);
        break;
      case "resume":
        await resumeCommand(interaction, player);
        break;
      case "skip":
        await skipCommand(interaction, player);
        break;
      case "stop":
        await stopCommand(interaction, player);
        break;
      case "queue":
        await queueCommand(interaction, player);
        break;
      case "nowplaying":
        await nowPlayingCommand(interaction, player);
        break;
      case "volume":
        await volumeCommand(interaction, player);
        break;
      case "seek":
        await seekCommand(interaction, player);
        break;
    }

    if (!player.playing && !player.paused) {
      await player.connect();
      await player.play();
    }
  }

  public async start() {
    await this.client.login(process.env.DISCORD_TOKEN);
  }

  public getKazagumo() {
    return this.kazagumo;
  }

  public getClient() {
    return this.client;
  }

  public isOnline() {
    return this.isReady && this.client.isReady();
  }
}

// Singleton
let botInstance: DiscordMusicBot | null = null;

export function getBotInstance(): DiscordMusicBot {
  if (!botInstance) {
    botInstance = new DiscordMusicBot();
  }
  return botInstance;
}

export function hasBotInstance() {
  return botInstance !== null;
}

export function setBotInstance(instance: DiscordMusicBot) {
  botInstance = instance;
}

import type { Guild } from "discord.js";
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
import { repeatCommand } from "@/lib/commands/repeat";
import { shuffleCommand } from "@/lib/commands/shuffle";
import { joinCommand } from "@/lib/commands/join";
import { playerControlsCommand, handlePlayerControls } from "@/lib/commands/playerControls";
import { buttonPlayPause } from "@/lib/buttons/buttonPlayPause";
import { buttonSkip } from "@/lib/buttons/buttonSkip";
import { buttonPrevious } from "@/lib/buttons/buttonPrevious";
import { buttonShuffle } from "@/lib/buttons/buttonShuffle";
import { buttonRepeat } from "@/lib/buttons/buttonRepeat";
import { buttonStop } from "@/lib/buttons/buttonStop";
import { buttonVolumeUp } from "@/lib/buttons/buttonVolumeUp";
import { buttonVolumeDown } from "@/lib/buttons/buttonVolumeDown";

export class DiscordMusicBot {
  getGuild(guildId: string): Guild | undefined {
    return this.client.guilds.cache.get(guildId);
  }
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
      // Set up auto-cycling statuses
      const status = process.env.BOT_STATUS || "online";
      const message1 = process.env.BOT_STATUS_MESSAGE_1 || "Listening to your commands!";
      const message2 = process.env.BOT_STATUS_MESSAGE_2 || "Ready to play music!";
      const message3 = process.env.BOT_STATUS_MESSAGE_3 || "Type /play to start music!";
      const message4 = process.env.BOT_STATUS_MESSAGE_4 || "Invite me to your server!";
      const activities = [
        { name: message1, type: 4 },
        { name: message2, type: 4 },
        { name: message3, type: 4 },
        { name: message4, type: 4 },
      ];
      let activityIndex = 0;
      // Set initial presence
      this.client.user?.setPresence({
        status: status as "online" | "idle" | "dnd" | "invisible",
        activities: [activities[activityIndex]],
      });
      // Cycle every 30 seconds
      setInterval(() => {
        activityIndex = (activityIndex + 1) % activities.length;
        this.client.user?.setPresence({
          status: status as "online" | "idle" | "dnd" | "invisible",
          activities: [activities[activityIndex]],
        });
      }, 4000);
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await this.handleCommand(interaction);
      } else if (interaction.isButton()) {
        switch (interaction.customId) {
          case "player_playpause":
            await buttonPlayPause(interaction, this.kazagumo);
            break;
          case "player_skip":
            await buttonSkip(interaction, this.kazagumo);
            break;
          case "player_previous":
            await buttonPrevious(interaction, this.kazagumo);
            break;
          case "player_shuffle":
            await buttonShuffle(interaction, this.kazagumo);
            break;
          case "player_repeat":
            await buttonRepeat(interaction, this.kazagumo);
            break;
          case "player_stop":
            await buttonStop(interaction, this.kazagumo);
            break;
          case "player_volumeup":
            await buttonVolumeUp(interaction, this.kazagumo);
            break;
          case "player_volumedown":
            await buttonVolumeDown(interaction, this.kazagumo);
            break;
        }
      }
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
      new SlashCommandBuilder()
        .setName("repeat")
        .setDescription("Toggle repeat mode for the current queue or track"),
      new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("Shuffle the current queue"),
      new SlashCommandBuilder()
        .setName("join")
        .setDescription("Join your voice channel without playing music"),
      playerControlsCommand,
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

  public async searchAndPlay(guildId: string, query: string, requester: import("discord.js").GuildMember) {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      throw new Error("Guild not found.");
    }

    let player = this.kazagumo.players.get(guildId);

    // If no player, create one (assuming requester is a member object with voice channel)
    if (!player) {
      const member = requester as import("discord.js").GuildMember;
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

      // Use persistent volume if available
      const { playerSettings } = await import("@/lib/playerSettings");
      const settings = playerSettings.get(guild.id);
      player = await this.kazagumo.createPlayer({
        guildId: guild.id,
        textId: textChannel.id,
        voiceId: voiceChannel.id,
        volume: settings?.volume ?? 100,
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
    const member = interaction.member as import("discord.js").GuildMember;
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
      case "repeat":
        await repeatCommand(interaction, player);
        break;
      case "shuffle":
        await shuffleCommand(interaction, player);
        break;
      case "join":
        await joinCommand(interaction, this.kazagumo, voiceChannel);
        break;
      case "player":
        await handlePlayerControls(interaction);
        break;
    }

    if (player && !player.playing && !player.paused) {
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

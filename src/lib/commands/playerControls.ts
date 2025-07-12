import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  Message,
  EmbedBuilder,
} from "discord.js";
import type { KazagumoPlayer } from "kazagumo";
import type { Client } from "discord.js";

// Extend KazagumoPlayer to allow a custom message property and message/channel IDs
interface KazagumoPlayerWithMessage extends KazagumoPlayer {
  message?: Message;
  messageId?: string;
  messageChannelId?: string;
}

export const playerControlsCommand = new SlashCommandBuilder()
  .setName("player")
  .setDescription("Show player controls (play/pause, skip, previous)")
  .addBooleanOption(opt =>
    opt.setName("playing")
      .setDescription("Set to true if music is playing, false if paused")
      .setRequired(false)
  );

function formatTime(ms: number | undefined): string {
  if (!ms) return "0:00";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function getPlayerControlsRows(
  isPlaying?: boolean,
  repeatMode?: "off" | "one" | "all"
) {
  let repeatEmoji = "➡️";
  if (repeatMode === "one") repeatEmoji = "🔂";
  else if (repeatMode === "all") repeatEmoji = "🔁";
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("player_previous")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏮️"),
      new ButtonBuilder()
        .setCustomId("player_playpause")
        .setStyle(isPlaying ? ButtonStyle.Primary : ButtonStyle.Success) // Pause = blue, Play = green
        .setEmoji(isPlaying ? "⏸️" : "▶️"),
      new ButtonBuilder()
        .setCustomId("player_skip")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏭️"),
      new ButtonBuilder()
        .setCustomId("player_stop")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⏹️")
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("player_shuffle")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔀"),
      new ButtonBuilder()
        .setCustomId("player_volumedown")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔉"),
      new ButtonBuilder()
        .setCustomId("player_volumeup")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔊"),
      new ButtonBuilder()
        .setCustomId("player_repeat")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(repeatEmoji)
    ),
  ];
}

// Store the last controls message per guild
const lastControlsMessage: Map<string, Message> = new Map();

export async function handlePlayerControls(
  interaction: ChatInputCommandInteraction,
  player?: KazagumoPlayer
) {
  const guildId = interaction.guildId;

  // Delete previous controls message if it exists
  if (guildId && lastControlsMessage.has(guildId)) {
    try {
      await lastControlsMessage.get(guildId)!.delete();
    } catch {}
    lastControlsMessage.delete(guildId);
  }

  // Build embed
  let embed;
  if (player && player.queue.current) {
    const track = player.queue.current;
    let requesterMention = "Unknown";
    if (
      track.requester &&
      typeof track.requester === "object" &&
      "id" in track.requester &&
      typeof track.requester.id === "string"
    ) {
      requesterMention = `<@${track.requester.id}>`;
    }
    embed = new EmbedBuilder()
      .setTitle("NOW PLAYING")
      .setDescription(`[${track.title}](${track.uri})`)
      .addFields(
        { name: "Author", value: track.author || "Unknown", inline: true },
        { name: "Requested by", value: requesterMention, inline: true },
        { name: "Duration", value: formatTime(track.length), inline: true },
        { name: "Volume", value: `${player.volume ?? 100}%`, inline: true },
        { name: "\u200B", value: `Queue Length ${player.queue.size} Tracks` }
      )
      .setThumbnail(track.thumbnail || null)
      .setColor(0x00ff99);
  }
  let isPlaying = false;
  if (typeof player?.paused === "boolean") {
    isPlaying = !player.paused;
  }
  let repeatMode: "off" | "one" | "all" = "off";
  if (player && player.guildId) {
    // Try to get repeatMode from playerSettings if available
    try {
      const { playerSettings } = await import("@/lib/playerSettings");
      const settings = playerSettings.get(player.guildId);
      if (settings && settings.repeatMode) repeatMode = settings.repeatMode as "off" | "one" | "all";
    } catch {}
  }
  const rows = getPlayerControlsRows(isPlaying, repeatMode);
  const options: InteractionReplyOptions = {
    embeds: embed ? [embed] : [],
    components: rows,
  };

  let sentMsg: Message;
  if (interaction.replied || interaction.deferred) {
    sentMsg = (await interaction.followUp(options)) as Message;
  } else {
    sentMsg = (await interaction.reply({
      ...options,
      fetchReply: true,
    })) as Message;
  }

  if (guildId) {
    lastControlsMessage.set(guildId, sentMsg);
  }
  // Assign the message and IDs to the player for later deletion
  if (player) {
    (player as KazagumoPlayerWithMessage).message = sentMsg;
    (player as KazagumoPlayerWithMessage).messageId = sentMsg.id;
    (player as KazagumoPlayerWithMessage).messageChannelId = sentMsg.channelId;
  }
}

// Utility to delete the player controls message for a guild
export async function deletePlayerControlsMessage(guildId: string, player?: KazagumoPlayer, client?: Client) {
  // Delete from lastControlsMessage map
  if (guildId && lastControlsMessage.has(guildId)) {
    try {
      await lastControlsMessage.get(guildId)!.delete();
    } catch {}
    lastControlsMessage.delete(guildId);
  }
  // Delete from player.message if present
  const p = player as KazagumoPlayerWithMessage | undefined;
  if (p && p.message) {
    try {
      await p.message.delete();
    } catch {}
    p.message = undefined;
  } else if (p && p.messageId && p.messageChannelId && client) {
    // Try to fetch and delete the message if not cached
    try {
      const channel = await client.channels.fetch(p.messageChannelId);
      if (channel && 'messages' in channel) {
        const msg = await channel.messages.fetch(p.messageId);
        await msg.delete();
      }
    } catch {}
    p.messageId = undefined;
    p.messageChannelId = undefined;
  }
}

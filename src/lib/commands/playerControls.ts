import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, InteractionReplyOptions, Message } from "discord.js";

export const playerControlsCommand = new SlashCommandBuilder()
  .setName("player")
  .setDescription("Show player controls (play/pause, skip, previous)");

export function getPlayerControlsRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("player_previous")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⏮️"),
    new ButtonBuilder()
      .setCustomId("player_playpause")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⏯️"),
    new ButtonBuilder()
      .setCustomId("player_skip")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⏭️")
  );
}

// Store the last controls message per guild
const lastControlsMessage: Map<string, Message> = new Map();

export async function handlePlayerControls(interaction: ChatInputCommandInteraction) {
  const row = getPlayerControlsRow();
  const options: InteractionReplyOptions = {
    content: "Player Controls:",
    components: [row]
  };
  const guildId = interaction.guildId;

  // Delete previous controls message if it exists
  if (guildId && lastControlsMessage.has(guildId)) {
    try {
      await lastControlsMessage.get(guildId)!.delete();
    } catch {}
    lastControlsMessage.delete(guildId);
  }

  let sentMsg: Message;
  if (interaction.replied || interaction.deferred) {
    sentMsg = await interaction.followUp(options) as Message;
  } else {
    sentMsg = await interaction.reply({ ...options, fetchReply: true }) as Message;
  }

  if (guildId) {
    lastControlsMessage.set(guildId, sentMsg);
  }
}

import type { ChatInputCommandInteraction, VoiceChannel } from "discord.js";
import type { Kazagumo } from "kazagumo";

export async function joinCommand(
  interaction: ChatInputCommandInteraction,
  kazagumo: Kazagumo,
  voiceChannel: VoiceChannel | null
) {
  if (!voiceChannel) {
    return interaction.reply({ content: "You must be in a voice channel to use this command!", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  let player = kazagumo.players.get(guildId);

  try {
    if (!player) {
      // Find a suitable text channel (e.g., the first available text channel or a specified one)
      const textChannel = interaction.guild?.channels.cache.find(
        (channel) => channel.type === 0 // Type 0 is GUILD_TEXT
      );
      if (!textChannel) {
        return interaction.editReply({ content: "No text channel found in the guild." });
      }
      player = await kazagumo.createPlayer({
        guildId,
        textId: textChannel.id,
        voiceId: voiceChannel.id,
        volume: 100,
        deaf: true,
      });
    } else {
      await player.setVoiceChannel(voiceChannel.id);
    }

    await player.connect();
    await interaction.editReply({ content: `Joined <#${voiceChannel.id}>!` });
  } catch (err: unknown) {
    let errorMessage = "Unknown error";
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === "string") {
      errorMessage = err;
    }
    await interaction.editReply({ content: `${errorMessage}` });
  }
}

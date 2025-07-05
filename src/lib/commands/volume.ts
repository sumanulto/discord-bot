// volume.ts
import { ChatInputCommandInteraction } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

export async function volumeCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player) {
    return interaction.reply({
      content: "No player found.",
      ephemeral: true,
    });
  }

  const volume = interaction.options.getInteger("level", true);

  if (volume < 0 || volume > 100) {
    return interaction.reply({
      content: "Volume must be between 0 and 100.",
      ephemeral: true,
    });
  }

  player.setVolume(volume);
  await interaction.reply(`🔊 Set volume to **${volume}%**.`);
}

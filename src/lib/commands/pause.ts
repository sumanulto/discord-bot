import { ChatInputCommandInteraction } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

export async function pauseCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player || !player.playing) {
    return interaction.reply({
      content: "⚠️ Nothing is currently playing.",
      ephemeral: true,
    });
  }

  await player.pause(true);
  await interaction.reply("⏸️ Paused the current track.");
}

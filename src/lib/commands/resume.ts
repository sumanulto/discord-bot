import { ChatInputCommandInteraction } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

export async function resumeCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player || !player.paused) {
    return interaction.reply({
      content: "⚠️ The player is not paused.",
      ephemeral: true,
    });
  }

  await player.pause(false);
  await interaction.reply("▶️ Resumed the current track.");
}

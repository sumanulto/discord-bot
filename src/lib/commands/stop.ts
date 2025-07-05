// stop.ts
import { ChatInputCommandInteraction } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

export async function stopCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player) {
    return interaction.reply({
      content: "No player found.",
      ephemeral: true,
    });
  }

  player.queue.clear();
  player.destroy();
  await interaction.reply("⏹️ Stopped playing and cleared the queue.");
}
import { ChatInputCommandInteraction } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

export async function previousCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player || player.queue.previous.length === 0) {
    return interaction.reply({
      content: "⚠️ No previous track available.",
      ephemeral: true,
    });
  }

  const previousTrack = player.queue.previous[player.queue.previous.length - 1];
  player.queue.unshift(previousTrack); // Move to front
  await player.skip();

  await interaction.reply("⏮️ Now playing the previous track.");
}

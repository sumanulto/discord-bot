import { ChatInputCommandInteraction } from "discord.js";
import type { KazagumoPlayer } from "kazagumo";
import { playerSettings } from "@/lib/playerSettings";

export async function shuffleCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player || !player.queue.length) {
    return interaction.reply({ content: "Queue is empty.", ephemeral: true });
  }
  player.queue.shuffle();
  // Update playerSettings for UI sync
  playerSettings.set(player.guildId, {
    ...(playerSettings.get(player.guildId) ?? { shuffleEnabled: false, repeatMode: "off" }),
    shuffleEnabled: true,
  });
  await interaction.reply({ content: "Queue shuffled!", ephemeral: true });
}

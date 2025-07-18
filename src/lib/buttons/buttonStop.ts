import type { ButtonInteraction } from "discord.js";
import type { Kazagumo } from "kazagumo";
import { deletePlayerControlsMessage } from "../commands/playerControls";

const MSGDEL_DELAY = parseInt(process.env.MSGDEL_DELAY || "1000", 10);

export async function buttonStop(interaction: ButtonInteraction, kazagumo: Kazagumo) {
  const guild = interaction.guild;
  if (!guild) return;
  const player = kazagumo.players.get(guild.id);
  if (!player) {
    const msg = await interaction.reply({ content: "No player found." });
    setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
    return;
  }
  // Delete the player controls message before destroying the player
  await deletePlayerControlsMessage(guild.id, player, interaction.client);
  player.queue.clear();
  player.destroy();
  const msg = await interaction.reply({ content: "⏹️ Stopped playing and cleared the queue." });
  setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
}

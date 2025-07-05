import type { ButtonInteraction } from "discord.js";
import type { Kazagumo } from "kazagumo";
import { handlePlayerControls } from "../commands/playerControls";

const MSGDEL_DELAY = parseInt(process.env.MSGDEL_DELAY || "1000", 10);

export async function buttonPlayPause(interaction: ButtonInteraction, kazagumo: Kazagumo) {
  const guild = interaction.guild;
  if (!guild) return;
  const player = kazagumo.players.get(guild.id);
  if (!player) {
    const msg = await interaction.reply({ content: "No player active." });
    setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
    return;
  }
  let msg;
  if (player.paused) {
    await player.pause(false);
    msg = await interaction.reply({ content: "▶️ Resumed." });
  } else {
    await player.pause(true);
    msg = await interaction.reply({ content: "⏸️ Paused." });
  }
  setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
  // @ts-expect-error: interaction may be ButtonInteraction or ChatInputCommandInteraction
  await handlePlayerControls(interaction, player);
}

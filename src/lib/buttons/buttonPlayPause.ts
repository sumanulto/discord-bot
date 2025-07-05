import type { ButtonInteraction } from "discord.js";
import type { Kazagumo } from "kazagumo";

export async function buttonPlayPause(interaction: ButtonInteraction, kazagumo: Kazagumo) {
  const guild = interaction.guild;
  if (!guild) return;
  const player = kazagumo.players.get(guild.id);
  if (!player) return interaction.reply({ content: "No player active.", ephemeral: true });
  if (player.paused) {
    await player.pause(false);
    await interaction.reply({ content: "▶️ Resumed.", ephemeral: true });
  } else {
    await player.pause(true);
    await interaction.reply({ content: "⏸️ Paused.", ephemeral: true });
  }
}

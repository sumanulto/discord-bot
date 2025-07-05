import type { ButtonInteraction } from "discord.js";
import type { Kazagumo } from "kazagumo";

export async function buttonSkip(interaction: ButtonInteraction, kazagumo: Kazagumo) {
  const guild = interaction.guild;
  if (!guild) return;
  const player = kazagumo.players.get(guild.id);
  if (!player) return interaction.reply({ content: "No player active.", ephemeral: true });
  await player.skip();
  await interaction.reply({ content: "⏭️ Skipped.", ephemeral: true });
}

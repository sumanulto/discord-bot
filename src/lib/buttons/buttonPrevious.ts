import type { ButtonInteraction } from "discord.js";
import type { Kazagumo } from "kazagumo";

export async function buttonPrevious(interaction: ButtonInteraction, kazagumo: Kazagumo) {
  const guild = interaction.guild;
  if (!guild) return;
  const player = kazagumo.players.get(guild.id) as unknown as {
    queue: { previous?: () => Promise<void> | void };
    play: () => Promise<void> | void;
  };
  if (!player) return interaction.reply({ content: "No player active.", ephemeral: true });
  // Implement previous logic (if your player supports it)
  if (typeof player.queue.previous === 'function') {
    await player.queue.previous!();
    await player.play();
    await interaction.reply({ content: "⏮️ Previous track.", ephemeral: true });
  } else {
    await interaction.reply({ content: "Previous not supported.", ephemeral: true });
  }
}

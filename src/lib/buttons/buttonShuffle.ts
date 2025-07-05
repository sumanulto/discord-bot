import type { ButtonInteraction } from "discord.js";
import type { Kazagumo } from "kazagumo";

const MSGDEL_DELAY = parseInt(process.env.MSGDEL_DELAY || "1000", 10);

export async function buttonShuffle(interaction: ButtonInteraction, kazagumo: Kazagumo) {
  const guild = interaction.guild;
  if (!guild) return;
  const player = kazagumo.players.get(guild.id);
  if (!player || !player.queue.length) {
    const msg = await interaction.reply({ content: "Queue is empty." });
    setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
    return;
  }
  player.queue.shuffle();
  const msg = await interaction.reply({ content: "Queue shuffled!" });
  setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
}

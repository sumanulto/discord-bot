import type { ButtonInteraction } from "discord.js";
import type { Kazagumo } from "kazagumo";
import { handlePlayerControls } from "../commands/playerControls";

const MSGDEL_DELAY = parseInt(process.env.MSGDEL_DELAY || "1000", 10);

export async function buttonPrevious(interaction: ButtonInteraction, kazagumo: Kazagumo) {
  const guild = interaction.guild;
  if (!guild) return;
  const player = kazagumo.players.get(guild.id) as unknown as {
    queue: { previous?: () => Promise<void> | void };
    play: () => Promise<void> | void;
  };
  if (!player) {
    const msg = await interaction.reply({ content: "No player active." });
    setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
    return;
  }
  if (typeof player.queue.previous === 'function') {
    await player.queue.previous!();
    await player.play();
    const msg = await interaction.reply({ content: "⏮️ Previous track." });
    setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
    // @ts-expect-error: interaction may be ButtonInteraction or ChatInputCommandInteraction
    await handlePlayerControls(interaction, player);
  } else {
    const msg = await interaction.reply({ content: "Previous not supported." });
    setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
  }
}

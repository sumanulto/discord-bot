import { ChatInputCommandInteraction } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

export async function skipCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player || !player.queue.current) {
    return interaction.reply({
      content: "⚠️ Nothing is currently playing.",
      ephemeral: true,
    });
  }

  const currentTrack = player.queue.current;
  await player.skip();

  await interaction.reply(`⏭️ Skipped **${currentTrack.title}**.`);
}

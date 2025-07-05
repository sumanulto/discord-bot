// seek.ts
import { ChatInputCommandInteraction } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

export async function seekCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player || !player.queue.current) {
    return interaction.reply({
      content: "Nothing is currently playing.",
      ephemeral: true,
    });
  }

  const position = interaction.options.getInteger("position", true) * 1000; // ms
  const duration = player.queue.current.length || 0;

  if (position < 0 || position > duration) {
    return interaction.reply({
      content: `Position must be between 0 and ${Math.floor(duration / 1000)} seconds.`,
      ephemeral: true,
    });
  }

  await player.shoukaku.seekTo(position);
  await interaction.reply(`⏩ Seeked to **${formatTime(position)}**.`);
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
// nowplaying.ts
import { ChatInputCommandInteraction } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

export async function nowPlayingCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player || !player.queue.current) {
    return interaction.reply({
      content: "Nothing is currently playing.",
      ephemeral: true,
    });
  }

  const track = player.queue.current;
  const position = player.shoukaku.position ?? 0;
  const duration = track.length ?? 0;

  const embed = {
    title: "🎵 Now Playing",
    description:
      `**${track.title}**\nby **${track.author}**\n\n` +
      `Duration: ${formatTime(duration)}\n` +
      `Position: ${formatTime(position)}\n` +
      `Volume: ${player.volume}%`,
    color: 0x00ff00,
    thumbnail: {
      url: track.thumbnail || "",
    },
  };

  await interaction.reply({ embeds: [embed] });
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
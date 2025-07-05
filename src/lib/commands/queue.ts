// queue.ts
import { ChatInputCommandInteraction } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

export async function queueCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player || (!player.queue.current && !player.queue.size)) {
    return interaction.reply({
      content: "The queue is empty.",
      ephemeral: true,
    });
  }

  const queue = player.queue;
  const current = queue.current;
  const upcoming = queue.slice(0, 50); // Show up to 50 tracks, or remove limit for all

  const embed = {
    title: "🎵 Current Queue",
    description: `**Now Playing:**\n$${
      current ? `${current.title} - ${current.author}` : "Nothing"
    }\n\n**Up Next:**\n$${
      upcoming.length > 0
        ? upcoming.map((track, i) => `${i + 1}. ${track.title} - ${track.author}`).join("\n")
        : "Nothing"
    }`,
    color: 0x00ff00,
    footer: {
      text: `${queue.size} songs in queue`,
    },
  };

  await interaction.reply({ embeds: [embed] });
}

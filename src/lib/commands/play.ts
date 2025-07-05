import { ChatInputCommandInteraction, VoiceChannel } from "discord.js";
import { Kazagumo, KazagumoPlayer } from "kazagumo";
import { handlePlayerControls } from "@/lib/commands/playerControls";

export async function playCommand(
  interaction: ChatInputCommandInteraction,
  kazagumo: Kazagumo,
  player: KazagumoPlayer | undefined,
  voiceChannel: VoiceChannel
) {
  await interaction.deferReply();
  const query = interaction.options.getString("query", true).replace("https://music.youtube.com", "https://www.youtube.com");

  if (!player) {
    player = await kazagumo.createPlayer({
      guildId: interaction.guild!.id,
      textId: interaction.channelId,
      voiceId: voiceChannel.id,
      volume: 100,
      deaf: true,
    });
  }

  const result = await kazagumo.search(query, { requester: interaction.user });

  if (!result.tracks.length) {
    return interaction.editReply({ content: "❌ No tracks found!" });
  }

  if (result.type === "PLAYLIST") {
    for (const track of result.tracks) player.queue.add(track);
    await interaction.editReply(`📂 Added **${result.tracks.length}** tracks from **${result.playlistName}**.`);
  } else {
    const track = result.tracks[0];
    player.queue.add(track);
    await interaction.editReply(`🎵 Added **${track.title}** by **${track.author}** to the queue.`);
  }

  if (!player.playing && !player.paused) {
    await player.play();
  }

  // Always show player controls after adding a song
  await handlePlayerControls(interaction, player);
}

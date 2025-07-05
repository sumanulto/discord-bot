import { ChatInputCommandInteraction } from "discord.js";
import type { KazagumoPlayer } from "kazagumo";
import { playerSettings } from "@/lib/playerSettings";

export async function repeatCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player) {
    return interaction.reply({ content: "Nothing is playing.", ephemeral: true });
  }
  // Cycle repeat mode: none -> track -> queue -> none
  let newLoop: "none" | "track" | "queue";
  if (player.loop === "none") {
    newLoop = "track";
  } else if (player.loop === "track") {
    newLoop = "queue";
  } else {
    newLoop = "none";
  }
  player.setLoop(newLoop);
  const modeLabel = newLoop === "none" ? "off" : newLoop === "track" ? "one" : "all";
  // Update playerSettings for UI sync
  playerSettings.set(player.guildId, {
    ...(playerSettings.get(player.guildId) ?? { shuffleEnabled: false, repeatMode: "off" }),
    repeatMode: modeLabel as "off" | "one" | "all",
  });
  await interaction.reply({
    content: `Repeat mode is now set to: ${modeLabel}.`,
    ephemeral: true,
  });
}

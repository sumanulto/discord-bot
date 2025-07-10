// stop.ts
import { ChatInputCommandInteraction, Message } from "discord.js";
import { KazagumoPlayer } from "kazagumo";

// Extend KazagumoPlayer to allow a custom message property
interface KazagumoPlayerWithMessage extends KazagumoPlayer {
  message?: Message;
}

export async function stopCommand(
  interaction: ChatInputCommandInteraction,
  player: KazagumoPlayer | undefined
) {
  if (!player) {
    return interaction.reply({
      content: "No player found.",
      ephemeral: true,
    });
  }

  player.queue.clear();
  // Attempt to delete the player message if it exists
  const playerWithMessage = player as KazagumoPlayerWithMessage;
  if (playerWithMessage.message) {
    try {
      await playerWithMessage.message.delete();
    } catch {
      // Ignore errors (e.g., message already deleted or missing permissions)
    }
  }
  player.destroy();
  await interaction.reply("⏹️ Stopped playing and cleared the queue. Player message deleted.");
}
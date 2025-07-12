// Utility to update the Discord player controls message from dashboard actions
import { handlePlayerControls } from "../src/lib/commands/playerControls";
import type { KazagumoPlayer } from "kazagumo";

/**
 * Updates the Discord player controls message for a given player/guild.
 * This creates a synthetic interaction object with just enough info for handlePlayerControls.
 */
export async function updateDiscordPlayerMessage(bot: any, player: KazagumoPlayer) {
  if (!player || !player.guildId) return;
  const guild = bot.getGuild(player.guildId);
  if (!guild) return;
  // Find a text channel to send the update (use the player's textId if possible)
  let channel = null;
  if (player.textId) {
    channel = guild.channels.cache.get(player.textId);
  }
  if (!channel) {
    // fallback: first text channel
    channel = guild.channels.cache.find((c: any) => c.type === 0);
  }
  if (!channel || !('send' in channel)) return;

  // Create a fake interaction with just enough for handlePlayerControls
  const fakeInteraction = {
    guildId: player.guildId,
    replied: true,
    deferred: false,
    followUp: (opts: any) => channel.send(opts),
    reply: (opts: any) => channel.send(opts),
  };
  await handlePlayerControls(fakeInteraction as any, player);
}

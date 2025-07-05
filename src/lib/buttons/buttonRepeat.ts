import type { ButtonInteraction } from "discord.js";
import type { Kazagumo } from "kazagumo";
import { playerSettings } from "@/lib/playerSettings";
import { handlePlayerControls } from "@/lib/commands/playerControls";

const MSGDEL_DELAY = parseInt(process.env.MSGDEL_DELAY || "1000", 10);

export async function buttonRepeat(interaction: ButtonInteraction, kazagumo: Kazagumo) {
  const guild = interaction.guild;
  if (!guild) return;
  const player = kazagumo.players.get(guild.id);
  if (!player) {
    const msg = await interaction.reply({ content: "Nothing is playing." });
    setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
    return;
  }
  let newLoop: "none" | "track" | "queue";
  let newRepeatMode: "off" | "one" | "all" = "off";
  if (player.loop === "none") {
    newLoop = "track";
    newRepeatMode = "one";
  } else if (player.loop === "track") {
    newLoop = "queue";
    newRepeatMode = "all";
  } else {
    newLoop = "none";
    newRepeatMode = "off";
  }
  player.setLoop(newLoop);
  // Update playerSettings for web UI sync
  playerSettings.set(guild.id, {
    ...(playerSettings.get(guild.id) || { shuffleEnabled: false, repeatMode: "off" }),
    repeatMode: newRepeatMode,
  });
  // Update Discord controls embed/buttons using a fake ChatInputCommandInteraction
  const textChannel = interaction.channel && 'send' in interaction.channel ? interaction.channel : null;
  if (textChannel) {
    const fakeInteraction = {
      guildId: guild.id,
      channel: textChannel,
      replied: false,
      deferred: false,
      reply: (options: any) => textChannel.send(options),
      followUp: (options: any) => textChannel.send(options),
    };
    await handlePlayerControls(fakeInteraction as any, player);
  }
  const msg = await interaction.reply({ content: `Repeat mode is now set to: ${newLoop}.` });
  setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
}

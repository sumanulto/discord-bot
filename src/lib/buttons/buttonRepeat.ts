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
  if (player.loop === "none") {
    newLoop = "track";
  } else if (player.loop === "track") {
    newLoop = "queue";
  } else {
    newLoop = "none";
  }
  player.setLoop(newLoop);
  // Update playerSettings for web UI sync (always use Kazagumo's values)
  // Map to UI value for playerSettings
  let uiRepeat: "off" | "one" | "all" = "off";
  if (newLoop === "track") uiRepeat = "one";
  else if (newLoop === "queue") uiRepeat = "all";
  else uiRepeat = "off";
  playerSettings.set(guild.id, {
    ...(playerSettings.get(guild.id) || { shuffleEnabled: false, repeatMode: "off" }),
    repeatMode: uiRepeat,
  });
  // Update Discord controls embed/buttons using a fake ChatInputCommandInteraction
  const textChannel = interaction.channel && 'send' in interaction.channel ? interaction.channel : null;
  if (textChannel) {
    const fakeInteraction = {
      guildId: guild.id,
      channel: textChannel,
      replied: false,
      deferred: false,
      reply: (options: string | import("discord.js").MessagePayload | import("discord.js").MessageCreateOptions) => textChannel.send(options),
      followUp: (options: string | import("discord.js").MessagePayload | import("discord.js").MessageCreateOptions) => textChannel.send(options),
    };
    await handlePlayerControls(fakeInteraction as unknown as import("discord.js").ChatInputCommandInteraction, player);
  }
  const msg = await interaction.reply({ content: `Repeat mode is now set to: ${uiRepeat}.` });
  setTimeout(() => msg.delete().catch(() => {}), MSGDEL_DELAY);
}

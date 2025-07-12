// For updating Discord player controls message after dashboard actions
import { updateDiscordPlayerMessage } from "./update-discord-player-message";
import { playerSettings } from "../src/lib/playerSettings";
import { getBotInstance, setBotInstance } from "../src/lib/bot-manager";
import { getBotInstance as createBotInstance } from "../src/lib/discord-bot";
import http from "http";

// Start the bot
async function startBot() {
  try {
    console.log("Starting Discord Music Bot (combined)...");
    const bot = createBotInstance();
    await bot.start();
    setBotInstance(bot);
    console.log("Discord Music Bot started successfully!");
  } catch (error) {
    console.error("Failed to start Discord Music Bot:", error);
    process.exit(1);
  }
}

// Start the status server
function startStatusServer() {
  const PORT = process.env.BOT_STATUS_PORT ? Number(process.env.BOT_STATUS_PORT) : 34567;
  // Use import for playerSettings
  const server = http.createServer((req, res) => {
    if (req.url === "/status") {
      const bot = getBotInstance();
      const status: {
        online: boolean;
        guilds: number;
        users: number;
        players: number;
        nodes: { identifier: string; connected: boolean; stats: any }[];
      } = {
        online: false,
        guilds: 0,
        users: 0,
        players: 0,
        nodes: [],
      };
      if (bot && bot.isOnline && bot.isOnline()) {
        const client = bot.getClient();
        const kazagumo = bot.getKazagumo();
        status.online = true;
        status.guilds = client.guilds.cache.size;
        status.users = client.users.cache.size;
        status.players = kazagumo.players.size;
        status.nodes = Array.from(kazagumo.shoukaku.nodes.values()).map((node) => ({
          identifier: node.name,
          connected: node.state === 2,
          stats: node.stats || {},
        }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(status));
    } else if (req.url === "/players") {
      const bot = getBotInstance();
      let players: unknown[] = [];
      if (bot && bot.isOnline && bot.isOnline()) {
        const kazagumo = bot.getKazagumo();
        players = Array.from(kazagumo.players.values())
          .filter((player) => !!player.voiceId)
          .map((player) => {
            // Always get current track
            const current = player.queue.current;
            // Get upcoming tracks (excluding current)
            let queue: any[] = [];
            // Kazagumo's queue class: .current (track), .previous (array), and usually .toArray() for queue
            if (Array.isArray(player.queue)) {
              queue = (player.queue as any[]).filter((t: any) => t !== player.queue.current);
            } else if (Array.isArray((player.queue as any).items)) {
              queue = (player.queue as any).items.filter((t: any) => t !== player.queue.current);
            }
            const settings = playerSettings.get(player.guildId) ?? { shuffleEnabled: false, repeatMode: "off", volume: 100 };
            return {
              guildId: player.guildId,
              voiceChannel: player.voiceId,
              textChannel: player.textId,
              connected: !!player.voiceId,
              playing: player.playing,
              paused: player.paused,
              position: player.shoukaku?.position || 0,
              volume: player.volume,
              current: current
                ? {
                    title: current.title,
                    author: current.author,
                    duration: current.length || 0,
                    uri: current.uri,
                    thumbnail: current.thumbnail,
                  }
                : null,
              queue: queue.map((track: any) => {
                const t = track as {
                  title?: string;
                  author?: string;
                  length?: number;
                  uri?: string;
                  thumbnail?: string;
                  identifier?: string;
                };
                return {
                  title: t.title,
                  author: t.author,
                  duration: t.length || 0,
                  uri: t.uri,
                  thumbnail: t.thumbnail,
                  identifier: t.identifier,
                };
              }),
              settings: {
                shuffleEnabled: settings.shuffleEnabled,
                repeatMode: settings.repeatMode,
                volume: settings.volume ?? player.volume,
              },
            };
          });
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(players));
    } else if (req.url === "/control" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body);
          const { action, guildId, query, index, enabled, mode } = data;
          const bot = getBotInstance();
          if (!bot) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Bot is not running" }));
            return;
          }
          const kazagumo = bot.getKazagumo();
          const player = kazagumo.players.get(guildId);
          if (!player) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "No active player found for this server. Please start playback from Discord first." }));
            return;
          }
          const settings = playerSettings.get(guildId) ?? { shuffleEnabled: false, repeatMode: "off", volume: 100 };
          playerSettings.set(guildId, settings);
          switch (action) {
            case "play":
              if (query) {
                try {
                  // Use the public getGuild method on DiscordMusicBot
                  const guild = bot.getGuild(guildId);
                  if (!guild) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Guild not found" }));
                    return;
                  }
                  // Use the bot's own member object in the guild
                  const botMember = guild.members.me || (await guild.members.fetchMe?.());
                  if (!botMember) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Bot member not found in guild" }));
                    return;
                  }
                  const track = await bot.searchAndPlay(guildId, query, botMember);
                  // Update Discord player controls message
                  try {
                    await updateDiscordPlayerMessage(bot, player);
                  } catch {}
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ success: true, message: `Added \"${track.title}\" to queue` }));
                } catch (error) {
                  res.writeHead(400, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to add track" }));
                }
              } else {
                if (player.paused) {
                  await player.pause(false);
                  try {
                    await updateDiscordPlayerMessage(bot, player);
                  } catch {}
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ success: true, message: "Resumed playback" }));
                } else {
                  res.writeHead(400, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: "Player is not paused or nothing to resume." }));
                }
              }
              break;
            case "pause":
              if (!player.paused && player.playing) {
                await player.pause(true);
                try {
                  await updateDiscordPlayerMessage(bot, player);
                } catch {}
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, message: "Paused playback" }));
              } else {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Player is already paused or nothing is playing." }));
              }
              break;
            case "skip":
              if (player.queue.current) {
                const currentTrack = player.queue.current.title;
                await player.skip();
                try {
                  await updateDiscordPlayerMessage(bot, player);
                } catch {}
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, message: `Skipped \"${currentTrack}\"` }));
              } else {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "No track to skip." }));
              }
              break;
            case "previous":
              if (player.queue.previous.length > 0) {
                const previousTrack = player.queue.previous[player.queue.previous.length - 1];
                player.queue.unshift(previousTrack);
                await player.skip();
                try {
                  await updateDiscordPlayerMessage(bot, player);
                } catch {}
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, message: "Playing previous track" }));
              } else {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "No previous track available to play." }));
              }
              break;
            case "stop":
              player.queue.clear();
              player.destroy();
              try {
                await updateDiscordPlayerMessage(bot, player);
              } catch {}
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, message: "Stopped and cleared queue" }));
              break;
            case "volume":
              const volume = Number.parseInt(query);
              if (volume >= 0 && volume <= 100) {
                player.setVolume(volume);
                playerSettings.set(guildId, { ...settings, volume });
                // Only update Discord after state is set
                try {
                  await updateDiscordPlayerMessage(bot, player);
                } catch {}
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, message: `Set volume to ${volume}%` }));
              } else {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Volume must be between 0 and 100" }));
              }
              break;
            case "seek":
              const position = Number.parseInt(query);
              if (
                player.queue.current &&
                typeof player.queue.current.length === "number" &&
                position >= 0 &&
                position <= player.queue.current.length
              ) {
                await player.shoukaku.seekTo(position);
                try {
                  await updateDiscordPlayerMessage(bot, player);
                } catch {}
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, message: `Seeked to position` }));
              } else {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid seek position" }));
              }
              break;
            case "playNext":
              if (typeof index !== "number" || index < 0 || index >= player.queue.length) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid track index" }));
                break;
              }
              const trackToMoveNext = player.queue[index];
              player.queue.splice(index, 1);
              player.queue.unshift(trackToMoveNext);
              try {
                await updateDiscordPlayerMessage(bot, player);
              } catch {}
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, message: `Moved \"${trackToMoveNext.title}\" to play next` }));
              break;
            case "remove":
              if (typeof index !== "number" || index < 0 || index >= player.queue.length) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid track index" }));
                break;
              }
              const trackToRemove = player.queue[index];
              player.queue.splice(index, 1);
              try {
                await updateDiscordPlayerMessage(bot, player);
              } catch {}
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, message: `Removed \"${trackToRemove.title}\" from queue` }));
              break;
            case "shuffle":
              if (typeof enabled !== "boolean") {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing or invalid 'enabled' flag for shuffle" }));
                break;
              }
              settings.shuffleEnabled = enabled;
              if (settings.shuffleEnabled) {
                for (let i = player.queue.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
                }
              } else {
                player.queue.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
              }
              playerSettings.set(guildId, settings);
              try {
                await updateDiscordPlayerMessage(bot, player);
              } catch {}
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, message: `Shuffle ${settings.shuffleEnabled ? "enabled" : "disabled"}` }));
              break;
            case "repeat":
              if (!["off", "one", "all"].includes(mode)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid repeat mode" }));
                break;
              }
              settings.repeatMode = mode;
              playerSettings.set(guildId, settings);
              let kazagumoMode: "none" | "track" | "queue" = "none";
              if (mode === "one") kazagumoMode = "track";
              else if (mode === "all") kazagumoMode = "queue";
              else kazagumoMode = "none";
              player.setLoop(kazagumoMode);
              // Only update Discord after state is set
              try {
                await updateDiscordPlayerMessage(bot, player);
              } catch {}
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, message: `Repeat mode set to ${settings.repeatMode}` }));
              break;
            default:
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Invalid action" }));
          }
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to control player" }));
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  server.listen(PORT, () => {
    console.log(`Bot status server listening on http://localhost:${PORT}/status`);
  });
}

// Run both
startBot();
startStatusServer();

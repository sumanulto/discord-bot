// Simple HTTP server to report bot status for dashboard API
import { getBotInstance } from "../src/lib/bot-manager";
import http from "http";

const PORT = process.env.BOT_STATUS_PORT ? Number(process.env.BOT_STATUS_PORT) : 34567;

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
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Bot status server listening on http://localhost:${PORT}/status`);
});

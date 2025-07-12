import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch status from the bot-status-server using env
    const baseUrl = process.env.BOT_STATUS_SERVER_URL || "http://localhost:34567";
    const endpoint = process.env.BOT_STATUS_SERVER_STATUS_ENDPOINT || "/status";
    const statusRes = await fetch(`${baseUrl}${endpoint}`);
    const statusJson = await statusRes.json();
    return NextResponse.json({
      botOnline: statusJson.online,
      guilds: statusJson.guilds,
      users: statusJson.users,
      players: statusJson.players,
      nodes: statusJson.nodes,
    });
  } catch (error) {
    console.error("Status endpoint error:", error);
    return NextResponse.json(
      {
        botOnline: false,
        error: error instanceof Error ? error.message : "Failed to get bot status",
      },
      { status: 200 },
    );
  }
}

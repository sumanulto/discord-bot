
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.BOT_STATUS_SERVER_URL || "http://localhost:34567";
    const endpoint = process.env.BOT_STATUS_SERVER_PLAYERS_ENDPOINT || "/players";
    const res = await fetch(`${baseUrl}${endpoint}`);
    if (!res.ok) {
      return NextResponse.json([]);
    }
    const text = await res.text();
    if (!text) {
      return NextResponse.json([]);
    }
    let players = [];
    try {
      players = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse players JSON:", err);
      return NextResponse.json([]);
    }
    return NextResponse.json(players);
  } catch (error) {
    console.error("Players endpoint error:", error);
    return NextResponse.json([]);
  }
}

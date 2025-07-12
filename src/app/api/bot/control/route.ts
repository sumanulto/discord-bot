
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const baseUrl = process.env.BOT_STATUS_SERVER_URL || "http://localhost:34567";
    const endpoint = process.env.BOT_STATUS_SERVER_CONTROL_ENDPOINT || "/control";
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!text) {
      return NextResponse.json({ error: "No response from bot server" }, { status: 500 });
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse control response JSON:", err);
      return NextResponse.json({ error: "Invalid response from bot server" }, { status: 500 });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Control endpoint error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to control player",
      },
      { status: 500 },
    );
  }
}
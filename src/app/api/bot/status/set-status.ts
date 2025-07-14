import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ENV_PATH = path.resolve(process.cwd(), ".env");

export async function POST(request: Request) {
  try {
    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }
    // Update .env
    let env = fs.readFileSync(ENV_PATH, "utf-8");
    if (env.match(/^BOT_STATUS=/m)) {
      env = env.replace(/^BOT_STATUS=.*/m, `BOT_STATUS=${status}`);
    } else {
      env += `\nBOT_STATUS=${status}`;
    }
    fs.writeFileSync(ENV_PATH, env, "utf-8");
    // Bot presence will update automatically from .env on next restart or reload
    return NextResponse.json({ success: true, status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update status" }, { status: 500 });
  }
}

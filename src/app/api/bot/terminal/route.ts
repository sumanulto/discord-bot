import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  // Adjust the log file path as needed
  const logPath = path.join(process.cwd(), "bot.log");
  try {
    const log = fs.readFileSync(logPath, "utf-8");
    return new NextResponse(log, { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch {
    return new NextResponse("Log file not found.", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
}


import { NextResponse } from "next/server"
import { getBotInstance } from "@/lib/bot-manager"

export async function POST() {
  try {
    console.log("Checking bot status via API...")
    const bot = getBotInstance()
    if (!bot) {
      return NextResponse.json({
        success: false,
        message: "Bot is not running",
        online: false,
      })
    }
    return NextResponse.json({
      success: true,
      message: "Bot is running",
      online: bot.isOnline(),
    })
  } catch (error) {
    console.error("Failed to check bot status:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check bot status",
      },
      { status: 500 },
    )
  }
}

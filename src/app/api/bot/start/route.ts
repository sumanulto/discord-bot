import { NextResponse } from "next/server"
import { botManager } from "@/lib/bot-manager"

export async function POST() {
  try {
    console.log("Starting bot via API...")
    const bot = await botManager.getBot()

    return NextResponse.json({
      success: true,
      message: "Bot started successfully",
      online: bot.isOnline(),
    })
  } catch (error) {
    console.error("Failed to start bot:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start bot",
      },
      { status: 500 },
    )
  }
}

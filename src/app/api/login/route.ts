import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (password === process.env.DASHBOARD_PASSWORD) {
    // Set a secure cookie for dashboard auth
    const response = NextResponse.json({ success: true });
    response.cookies.set("dashboard_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });
    return response;
  } else {
    return NextResponse.json({ success: false, error: "Incorrect password" }, { status: 401 });
  }
}

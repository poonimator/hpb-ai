import { NextRequest, NextResponse } from "next/server";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "hpbaleph";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== SITE_PASSWORD) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("hpb-auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

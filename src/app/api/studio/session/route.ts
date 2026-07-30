import { NextResponse } from "next/server";
import {
  createStudioSessionToken,
  isStudioConfigured,
  STUDIO_COOKIE,
  studioSessionMaxAge,
  validateStudioPassword,
} from "@/lib/studio-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStudioConfigured()) {
    return NextResponse.json(
      { error: "Studio 환경변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (!validateStudioPassword(body.password ?? "")) {
    return NextResponse.json(
      { error: "비밀번호가 일치하지 않습니다." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDIO_COOKIE, createStudioSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: studioSessionMaxAge,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDIO_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

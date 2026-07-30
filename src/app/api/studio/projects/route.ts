import { NextResponse } from "next/server";
import type { PortfolioSource } from "@/lib/archive";
import { isStudioAuthenticated } from "@/lib/studio-auth";
import {
  readPortfolioForStudio,
  savePortfolioForStudio,
} from "@/lib/portfolio-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorize() {
  return isStudioAuthenticated();
}

export async function GET() {
  if (!(await authorize())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  try {
    return NextResponse.json(await readPortfolioForStudio());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "콘텐츠를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await authorize())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as PortfolioSource;
    return NextResponse.json(await savePortfolioForStudio(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "저장하지 못했습니다." },
      { status: 400 }
    );
  }
}

// app/api/history/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.search;
  const backendUrl = `${BACKEND_URL}/api/history${params}`;
  const r = await fetch(backendUrl);
  const data = await r.json();
  return NextResponse.json(data);
}

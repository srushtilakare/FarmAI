// app/api/history/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.search;
  const backendUrl = `http://localhost:5000/api/history${params}`;
  const r = await fetch(backendUrl);
  const data = await r.json();
  return NextResponse.json(data);
}

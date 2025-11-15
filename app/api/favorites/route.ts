// app/api/favorites/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.search;
  const backendUrl = `http://localhost:5000/api/favorites${params}`;
  const r = await fetch(backendUrl);
  const data = await r.json();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const pathname = new URL(req.url).pathname; // e.g. /api/favorites/add
  // Map direct path to backend
  const backendUrl = `http://localhost:5000${pathname.replace("/api", "")}`;
  const body = await req.json();
  const r = await fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return NextResponse.json(data);
}

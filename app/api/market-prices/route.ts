import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.search;

  const resp = await fetch(`${BACKEND_URL}/api/market-prices${params}`);
  const data = await resp.json();

  return NextResponse.json(data);
}

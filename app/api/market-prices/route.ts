import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.search;

  const resp = await fetch(`http://localhost:5000/api/market-prices${params}`);
  const data = await resp.json();

  return NextResponse.json(data);
}

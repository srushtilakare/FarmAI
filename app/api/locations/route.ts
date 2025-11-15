// app/api/locations/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.search; // e.g. ?state=...
  const path = req.url.includes("/api/locations/states") ? "/api/locations/states" : "";
  // We'll simply forward to backend. Determine target path by reading pathname.
  const pathname = new URL(req.url).pathname;
  // map Next path to backend path
  const backendPath = pathname.replace("/api", "");
  const backendUrl = `http://localhost:5000${backendPath}${params}`;
  const r = await fetch(backendUrl);
  const data = await r.json();
  return NextResponse.json(data);
}

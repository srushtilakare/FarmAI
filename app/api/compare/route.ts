// app/api/compare/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.search;

    const res = await fetch(`${BACKEND_URL}/api/compare${params}`);
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching comparison:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch comparison data" },
      { status: 500 }
    );
  }
}


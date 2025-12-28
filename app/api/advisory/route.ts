// app/api/advisory/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = url.search;
    const token = req.headers.get("authorization");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = token;
    }

    const res = await fetch(`${BACKEND_URL}/api/advisory${params}`, {
      headers,
    });
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching advisory:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch advisory" },
      { status: 500 }
    );
  }
}


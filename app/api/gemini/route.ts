import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { message, location } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      The user is in location (lat: ${location.lat}, lon: ${location.lon}).
      You are "Farmii", an AI farming assistant.
      Provide short, helpful, farmer-friendly advice.
      User message: "${message}"
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error("Gemini route error:", error);
    return NextResponse.json({ error: "Gemini API request failed" }, { status: 500 });
  }
}
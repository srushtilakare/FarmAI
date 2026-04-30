import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { message, location } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      The user is in location (lat: ${location?.lat}, lon: ${location?.lon}).
      You are "Farmii", an AI farming assistant.
      Provide short, helpful, farmer-friendly advice.
      User message: "${message}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",   // ✅ latest working model
      contents: prompt,
    });

    return NextResponse.json({ reply: response.text });

  } catch (error: any) {
    console.error("Gemini route error:", error);
    return NextResponse.json({ error: "Gemini API request failed" }, { status: 500 });
  }
}
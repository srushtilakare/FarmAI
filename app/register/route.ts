import dbConnect from "@/backend/config/db";
import User from "@/backend/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await dbConnect();

  try {
    const data = await req.json();
    const { fullName, email, password } = data;

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...data,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return NextResponse.json({ message: "User registered successfully", userId: user._id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Registration failed" }, { status: 500 });
  }
}

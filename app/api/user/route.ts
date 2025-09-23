// /app/api/user/route.ts

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/backend/config/db";
import User from "@/backend/models/User";

// Ensure this route runs on the Node.js runtime to support 'jsonwebtoken'
export const runtime = "nodejs";

// ✅ GET user data
export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decoded.id;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // ✅ Remove password safely
    const { password, ...userWithoutPassword } = user.toObject();

    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error fetching user data:", error);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Error fetching user data." },
      { status: 500 }
    );
  }
}

// ✅ POST to update user data
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const data = await req.json();

    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decoded.id;

    const updatedUser = await User.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found or unable to update." },
        { status: 404 }
      );
    }

    // ✅ Remove password safely
    const { password, ...updatedUserWithoutPassword } = updatedUser.toObject();

    return NextResponse.json(updatedUserWithoutPassword);
  } catch (error: any) {
    console.error("Error updating user data:", error);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Error updating user data." },
      { status: 500 }
    );
  }
}

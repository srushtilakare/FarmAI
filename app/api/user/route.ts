// /app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/config/db";
import User from "@/backend/models/User";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

interface IUserUpdate {
  fullName?: string;
  email?: string;
  phone?: string;
  farmName?: string;
  farmSize?: number;
  farmLocation?: string;
  state?: string;
  district?: string;
  pincode?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  crops?: string[];
  primaryCrops?: string;
  farmingExperience?: string;
  farmingType?: string;
  irrigationType?: string;
  preferredLanguage?: string;
  communicationPreference?: string;
  profilePhoto?: string;
}

async function getUserFromToken(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;

  const secret = process.env.JWT_SECRET || "farmai_secret";

  try {
    const decoded = jwt.verify(token, secret) as { id: string };
    const user = await User.findById(decoded.id).lean();
    return user;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  await dbConnect();

  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Exclude password safely
  const { password, ...userWithoutPassword } = user;

  return NextResponse.json(userWithoutPassword);
}

export async function PUT(req: NextRequest) {
  await dbConnect();

  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const data: IUserUpdate = await req.json();

    const updatedUser = await User.findByIdAndUpdate(user._id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Exclude password safely
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

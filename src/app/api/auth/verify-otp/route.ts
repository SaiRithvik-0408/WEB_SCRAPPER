import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, otpCode, newPassword } = await req.json();

    if (!email || !otpCode || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.otpCode || user.otpCode !== otpCode) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    if (!user.otpExpires || new Date() > user.otpExpires) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // Hash the new password and update the user record
    const hashedPassword = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

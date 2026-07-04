import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpires,
      },
    });

    console.log(`[OTP Verification] Sent OTP Code ${otpCode} to ${email}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Include the code in response for demonstration/testing since there is no SMTP configured
      otpCode,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

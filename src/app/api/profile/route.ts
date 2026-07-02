import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preference = await prisma.preference.findUnique({
      where: { userId: session.userId },
    });

    return NextResponse.json({ preference });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, skills, education, experience, salary, location, remote, days } = await req.json();
    const userId = session.userId;

    const preference = await prisma.preference.upsert({
      where: { userId },
      update: {
        role,
        skills,
        education,
        experience,
        salary: parseFloat(salary),
        location,
        remote,
        days: parseInt(days, 10),
      },
      create: {
        userId,
        role,
        skills,
        education,
        experience,
        salary: parseFloat(salary),
        location,
        remote,
        days: parseInt(days, 10),
      },
    });

    return NextResponse.json({ success: true, preference });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

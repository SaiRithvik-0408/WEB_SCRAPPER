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
    const { role, skills, education, experience, salary, location, remote, days, country, timeWindow } = await req.json();
    const userId = session.userId;

    const cleanStr = (v: any) => (v === undefined || v === null || v === "" ? null : String(v));
    const cleanInt = (v: any) => (v === undefined || v === null || v === "" ? null : parseInt(v, 10));
    const cleanFloat = (v: any) => (v === undefined || v === null || v === "" ? null : parseFloat(v));

    const preference = await prisma.preference.upsert({
      where: { userId },
      update: {
        role: cleanStr(role),
        skills: cleanStr(skills),
        education: cleanStr(education),
        experience: cleanStr(experience),
        salary: cleanFloat(salary),
        location: cleanStr(location),
        remote: cleanStr(remote),
        days: cleanInt(days),
        country: cleanStr(country),
        timeWindow: cleanInt(timeWindow),
      },
      create: {
        userId,
        role: cleanStr(role),
        skills: cleanStr(skills),
        education: cleanStr(education),
        experience: cleanStr(experience),
        salary: cleanFloat(salary),
        location: cleanStr(location),
        remote: cleanStr(remote),
        days: cleanInt(days),
        country: cleanStr(country),
        timeWindow: cleanInt(timeWindow),
      },
    });

    return NextResponse.json({ success: true, preference });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

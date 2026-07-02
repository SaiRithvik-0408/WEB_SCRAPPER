import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, saved } = await req.json();
    const userId = session.userId;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    if (saved) {
      await prisma.savedJob.upsert({
        where: { userId_jobId: { userId, jobId } },
        update: { saved: true },
        create: { userId, jobId, saved: true },
      });
    } else {
      await prisma.savedJob.deleteMany({
        where: { userId, jobId },
      });
    }

    return NextResponse.json({ success: true, saved });
  } catch (error: any) {
    console.error("Save job error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

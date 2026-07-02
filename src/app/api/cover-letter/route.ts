import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    const preference = await prisma.preference.findUnique({
      where: { userId: session.userId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const skills = preference?.skills || "TypeScript, React, Node.js, SQL";
    const userName = session.email.split("@")[0].toUpperCase();
    const company = job.company;
    const title = job.title;

    const coverLetter = `Dear Hiring Manager at ${company},

I am writing to express my enthusiastic interest in the ${title} position at ${company}. With my background matching your requirement for a specialized engineering profile and my core skills including ${skills}, I am confident that I can add substantial value to your team.

At my previous role, I worked extensively on building high-scale features, designing robust API architectures, and optimizing data retrieval. I noticed that for the ${title} role, you emphasize ${job.description.split("\n")[0] || "product development and scale"}. My experience directly aligns with this, and I have a proven track record of shipping fast, reliable, and user-centric features.

I am particularly excited about ${company}'s mission and would love the opportunity to contribute to your engineering objectives. Thank you for your time and consideration. I look forward to discussing how my skills and experience align with your team's needs.

Sincerely,
${userName}
Email: ${session.email}`;

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error("Cover letter error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const questions = [
      {
        question: `Based on the ${job.title} role, how do you handle scale and high availability in your backend/frontend systems?`,
        tip: "Talk about caching (Redis), DB indexing, rate limiting, and optimizing components.",
      },
      {
        question: `How would you explain the differences between REST and GraphQL, and which would you recommend for ${job.company}'s services?`,
        tip: `Mention over-fetching, type-safety, and how ${job.company} could benefit from unified data endpoints.`,
      },
      {
        question: `Can you describe a challenging bug you encountered in a stack using React/Node/TypeScript, and how you solved it?`,
        tip: "Use the STAR method (Situation, Task, Action, Result). Discuss memory leaks, async race conditions, or build config issues.",
      },
      {
        question: `How do you approach writing clean, testable code and structuring your unit/integration tests?`,
        tip: "Mention mocking, integration testing with tools like Jest or Playwright, and maintaining a high test coverage threshold.",
      },
    ];

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Interview prep error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

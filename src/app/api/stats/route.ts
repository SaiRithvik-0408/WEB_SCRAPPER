import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    // Count statistics
    const totalJobs = await prisma.job.count();
    const appliedJobs = await prisma.appliedJob.count({ where: { userId } });
    const savedJobs = await prisma.savedJob.count({ where: { userId, saved: true } });
    
    // Recommended (simulated match >= 80%)
    const recommendedCount = Math.max(12, Math.round(totalJobs * 0.45));
    const newJobs = Math.max(4, Math.round(totalJobs * 0.15));

    // Prepare chart data
    const applicationsData = [
      { name: "Mon", count: 2 },
      { name: "Tue", count: 4 },
      { name: "Wed", count: 3 },
      { name: "Thu", count: appliedJobs > 0 ? appliedJobs : 1 },
      { name: "Fri", count: 0 },
      { name: "Sat", count: 0 },
      { name: "Sun", count: 0 },
    ];

    const skillsDemand = [
      { name: "TypeScript", value: 85 },
      { name: "Node.js", value: 70 },
      { name: "React", value: 90 },
      { name: "Python", value: 60 },
      { name: "PostgreSQL", value: 65 },
      { name: "Docker", value: 50 },
    ];

    const companiesHiring = [
      { name: "Stripe", jobs: 4 },
      { name: "Vercel", jobs: 3 },
      { name: "Supabase", jobs: 2 },
      { name: "OpenAI", jobs: 2 },
      { name: "Airbnb", jobs: 1 },
    ];

    const salaryTrends = [
      { name: "Frontend", min: 90, max: 140 },
      { name: "Backend", min: 100, max: 160 },
      { name: "Fullstack", min: 110, max: 170 },
      { name: "AI/ML", min: 130, max: 210 },
      { name: "DevOps", min: 100, max: 150 },
    ];

    return NextResponse.json({
      stats: {
        totalJobs: totalJobs > 0 ? totalJobs : 147,
        newJobs: newJobs > 0 ? newJobs : 18,
        applied: appliedJobs,
        saved: savedJobs,
        recommended: recommendedCount,
      },
      charts: {
        applications: applicationsData,
        skillsDemand,
        companiesHiring,
        salaryTrends,
      },
    });
  } catch (error) {
    console.error("Fetch stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

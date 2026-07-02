import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rankJobs } from "@/lib/agents/ranker";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filterSaved = searchParams.get("saved") === "true";
    const filterApplied = searchParams.get("applied") === "true";
    const location = searchParams.get("location") || "";
    const remoteOnly = searchParams.get("remote") === "true";

    const userId = session.userId;

    const preference = await prisma.preference.findUnique({
      where: { userId },
    });

    // Query filters
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { company: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (location) {
      whereClause.location = { contains: location };
    }

    if (remoteOnly) {
      whereClause.location = { contains: "Remote" };
    }

    if (filterSaved) {
      whereClause.savedBy = {
        some: { userId, saved: true },
      };
    }

    if (filterApplied) {
      whereClause.appliedBy = {
        some: { userId },
      };
    }

    // Fetch jobs
    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        savedBy: { where: { userId } },
        appliedBy: { where: { userId } },
      },
      orderBy: { scrapedTime: "desc" },
    });

    // Rank jobs using Preference Analyzer output if available
    let ranked = jobs.map(job => {
      let matchScore = 75; // default fallback match score
      
      if (preference) {
        const [singleRanked] = rankJobs(
          [
            {
              title: job.title,
              company: job.company,
              location: job.location,
              salary: job.salary,
              experience: job.experience,
              education: job.education,
              description: job.description,
              source: job.source,
              url: job.url,
              postedDate: job.postedDate,
            },
          ],
          preference
        );
        matchScore = singleRanked.matchScore;
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        experience: job.experience,
        education: job.education,
        description: job.description,
        source: job.source,
        url: job.url,
        postedDate: job.postedDate,
        scrapedTime: job.scrapedTime,
        saved: job.savedBy.length > 0 && job.savedBy[0].saved,
        applied: job.appliedBy.length > 0,
        matchScore,
      };
    });

    // Sort by matchScore desc if not filtering by saved/applied specifically
    if (!filterSaved && !filterApplied) {
      ranked.sort((a, b) => b.matchScore - a.matchScore);
    }

    return NextResponse.json({ jobs: ranked });
  } catch (error: any) {
    console.error("Fetch jobs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

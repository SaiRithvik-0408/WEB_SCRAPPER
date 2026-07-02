import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzePreferences } from "@/lib/agents/preference-analyzer";
import { generateSearchPlan } from "@/lib/agents/search-planner";
import { executeCrawling } from "@/lib/agents/crawler";
import { deduplicateJobs } from "@/lib/agents/deduplicator";
import { rankJobs } from "@/lib/agents/ranker";
import { sendNotifications } from "@/lib/agents/notification-agent";

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    // Fetch user preferences
    const preference = await prisma.preference.findUnique({
      where: { userId },
    });

    if (!preference) {
      return NextResponse.json({ error: "Preferences not set" }, { status: 400 });
    }

    // Step 1: Preference Analyzer Agent
    console.log("Running Preference Analyzer...");
    const searchQuery = analyzePreferences(preference);

    // Step 2: Search Planner Agent
    console.log("Running Search Planner...");
    const searchPlan = generateSearchPlan(searchQuery);

    // Step 3: Crawler Agent
    console.log("Running Crawlers...");
    const rawJobs = await executeCrawling(searchPlan);

    // Step 4: Deduplication Agent
    console.log("Running Deduplication...");
    const uniqueRawJobs = deduplicateJobs(rawJobs);

    // Step 5: AI Ranking Agent
    console.log("Running AI Ranker...");
    const rankedJobs = rankJobs(uniqueRawJobs, preference);

    // Save jobs to Database & record recommendations
    console.log("Saving scraped jobs to database...");
    const savedJobIds: string[] = [];

    for (const job of rankedJobs) {
      // Find if job already exists by URL
      let dbJob = await prisma.job.findFirst({
        where: { url: job.url },
      });

      if (!dbJob) {
        dbJob = await prisma.job.create({
          data: {
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
        });
      }

      // Check if user already has notifications or records for this job
      const existingNotification = await prisma.notification.findFirst({
        where: { userId, jobId: dbJob.id },
      });

      if (!existingNotification && job.matchScore >= 70) {
        savedJobIds.push(dbJob.id);
      }
    }

    // Step 6: Notification Agent
    if (savedJobIds.length > 0) {
      await sendNotifications(userId, savedJobIds);
    }

    return NextResponse.json({
      success: true,
      scrapedCount: rawJobs.length,
      savedCount: uniqueRawJobs.length,
      notifiedCount: savedJobIds.length,
    });
  } catch (error: any) {
    console.error("Scraper Agent Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

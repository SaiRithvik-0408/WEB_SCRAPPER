import { CrawledJob } from "./crawler";

export function deduplicateJobs(jobs: CrawledJob[]): CrawledJob[] {
  const seen = new Set<string>();
  const uniqueJobs: CrawledJob[] = [];

  for (const job of jobs) {
    // Generate a unique fingerprint for each job based on title, company, and location
    const fingerprint = `${job.title.toLowerCase().replace(/\s+/g, "")}|${job.company.toLowerCase().replace(/\s+/g, "")}`;
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      uniqueJobs.push(job);
    }
  }

  return uniqueJobs;
}

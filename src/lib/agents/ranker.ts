import { CrawledJob } from "./crawler";

export interface RankedJob extends CrawledJob {
  matchScore: number;
}

export function rankJobs(
  jobs: CrawledJob[],
  preference: {
    skills: string | null;
    role: string | null;
    experience: string | null;
  }
): RankedJob[] {
  const userSkills = (preference.skills || "")
    .toLowerCase()
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const userRoleKeywords = (preference.role || "").toLowerCase().split(/\s+/).filter(w => w.length > 0);

  return jobs.map(job => {
    let score = 50; // Base score

    const titleLower = job.title.toLowerCase();
    const descLower = job.description.toLowerCase();

    // Check title match
    let titleMatchCount = 0;
    userRoleKeywords.forEach(word => {
      if (titleLower.includes(word)) {
        titleMatchCount++;
      }
    });
    if (titleMatchCount > 0) {
      score += (titleMatchCount / userRoleKeywords.length) * 25;
    }

    // Check skills match
    let skillMatchCount = 0;
    userSkills.forEach(skill => {
      if (descLower.includes(skill) || titleLower.includes(skill)) {
        skillMatchCount++;
      }
    });

    if (userSkills.length > 0) {
      score += (skillMatchCount / userSkills.length) * 20;
    }

    // Check experience matches
    const userExpMatch = preference.experience ? preference.experience.match(/\d+/) : null;
    const jobExpMatch = job.experience ? job.experience.match(/\d+/) : null;
    if (userExpMatch && jobExpMatch) {
      const userYears = parseInt(userExpMatch[0], 10);
      const jobYears = parseInt(jobExpMatch[0], 10);
      if (userYears >= jobYears) {
        score += 5;
      } else {
        score -= (jobYears - userYears) * 3; // Subtract points for insufficient experience
      }
    }

    // Bound the score between 40 and 99
    score = Math.max(40, Math.min(99, Math.round(score)));

    return {
      ...job,
      matchScore: score,
    };
  });
}

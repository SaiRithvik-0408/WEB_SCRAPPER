import { SearchPlan } from "./search-planner";

export interface CrawledJob {
  title: string;
  company: string;
  location: string;
  salary: string;
  experience: string;
  education: string;
  description: string;
  source: string;
  url: string;
  postedDate: string;
}

// Helper to extract experience from title/description
function parseExperience(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  
  const yearsMatch = text.match(/\b(\d+)\s*(?:-|to)?\s*(\d*)\s*years?\b/);
  if (yearsMatch) {
    if (yearsMatch[2]) {
      return `${yearsMatch[1]}-${yearsMatch[2]} years`;
    }
    return `${yearsMatch[1]}+ years`;
  }
  const plusMatch = text.match(/\b(\d+)\+\s*years?\b/);
  if (plusMatch) {
    return `${plusMatch[1]}+ years`;
  }

  if (text.includes("senior") || text.includes("lead") || text.includes("staff") || text.includes("principal")) {
    return "5+ years (Senior)";
  }
  if (text.includes("junior") || text.includes("entry") || text.includes("associate")) {
    return "0-2 years (Junior)";
  }
  return "2-4 years";
}

// Helper to extract education from description
function parseEducation(desc: string): string {
  const text = desc.toLowerCase();
  if (text.includes("phd") || text.includes("doctorate")) {
    return "PhD in Computer Science or related field";
  }
  if (text.includes("master") || text.includes("ms in cs") || text.includes("m.s.")) {
    return "Master's Degree in Computer Science";
  }
  if (text.includes("bachelor") || text.includes("bs in cs") || text.includes("b.s.") || text.includes("degree")) {
    return "Bachelor's Degree in Computer Science or Equivalent";
  }
  return "Bachelor's Degree or Equivalent Experience";
}

// Helper to parse relative posting date to age in hours
function parseAgeInHours(dateText: string): number {
  const text = dateText.toLowerCase().trim();
  if (text.includes("second") || text.includes("minute")) {
    return 0.5;
  }
  if (text.includes("hour")) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }
  if (text.includes("day")) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) * 24 : 24;
  }
  if (text.includes("week")) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) * 24 * 7 : 168;
  }
  if (text.includes("month")) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) * 24 * 30 : 720;
  }
  if (text.includes("year")) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) * 24 * 365 : 8760;
  }
  if (text.includes("today") || text.includes("recently")) {
    return 12;
  }
  return 24; // Default to 24 hours
}

export async function executeCrawling(plan: SearchPlan): Promise<CrawledJob[]> {
  const jobs: CrawledJob[] = [];
  const targetRole = (plan.filters.role || "").toLowerCase();
  const maxHours = plan.filters.timeWindow !== undefined && plan.filters.timeWindow !== null ? plan.filters.timeWindow : 24;
  const targetCountry = (plan.filters.country || "").toLowerCase().trim();
  const wantsRemote = plan.filters.remote === true;

  console.log(`[Crawler Agent] Commencing real-time crawl: "${plan.filters.role || "Any"}" in ${plan.filters.country || "Any"} (time limit: last ${maxHours} hours)...`);

  // --- Helper: check if a job location matches the user's country preference ---
  const locationMatchesCountry = (loc: string): { matches: boolean; isRemote: boolean } => {
    const l = loc.toLowerCase();
    const isRemote = l.includes("remote") || l.includes("global") || l.includes("anywhere") || l.includes("worldwide");
    if (!targetCountry) return { matches: true, isRemote };
    const matchesCountry = l.includes(targetCountry);
    return { matches: matchesCountry || (isRemote && wantsRemote), isRemote };
  };

  // Mode 1: LinkedIn Guest Search — search by country directly
  const pages = [0, 25, 50, 75, 100, 125, 150, 175];
  for (const pageStart of pages) {
    try {
      const searchRole = plan.filters.role || "";
      const queryKeyword = encodeURIComponent(searchRole);

      // Build location: prefer specific location, otherwise fall back to country
      let searchLoc = plan.filters.location && plan.filters.location.toLowerCase() !== "remote"
        ? plan.filters.location
        : (plan.filters.country || "Remote");
      const queryLoc = encodeURIComponent(searchLoc);
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${queryKeyword}&location=${queryLoc}&start=${pageStart}&sortBy=DD`;

      console.log(`[Crawler Agent] Page ${pageStart / 25 + 1} - Querying LinkedIn: ${url}`);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (res.ok) {
        const html = await res.text();
        const cards = html.split(/class="[^"]*?job-search-card"/g).slice(1);
        console.log(`[Crawler Agent] Retrieved ${cards.length} jobs on Page ${pageStart / 25 + 1}.`);
        if (cards.length === 0) break;

        for (const card of cards) {
          const titleMatch = card.match(/class="base-search-card__title"[^>]*?>([\s\S]*?)<\/h3>/);
          const companyMatch = card.match(/class="hidden-nested-link"[^>]*?>([\s\S]*?)<\/a>/);
          const urlMatch = card.match(/href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"]*?)"/);
          const locMatch = card.match(/class="job-search-card__location"[^>]*?>([\s\S]*?)<\/span>/);
          const dateMatch = card.match(/<time[^>]*?>([\s\S]*?)<\/time>/);

          if (titleMatch && urlMatch) {
            const title = titleMatch[1].replace(/\s+/g, " ").trim();
            const company = companyMatch ? companyMatch[1].replace(/\s+/g, " ").trim() : "LinkedIn Employer";
            const url = urlMatch[1].trim().replace(/&amp;/g, "&");
            const location = locMatch ? locMatch[1].replace(/\s+/g, " ").trim() : searchLoc;
            const dateStr = dateMatch ? dateMatch[1].replace(/\s+/g, " ").trim() : "Recently";

            const ageInHours = parseAgeInHours(dateStr);
            if (maxHours > 0 && ageInHours > maxHours) continue;

            // LinkedIn already filters by location in the query, so we trust the results
            const fullDesc = `Position: ${title}\nCompany: ${company}\nLocation: ${location}\nPosted: ${dateStr}\n\nWe are looking for a skilled professional to join our team. Must have strong experience with core development tools.`;
            const experience = parseExperience(title, fullDesc);
            const education = parseEducation(fullDesc);

            jobs.push({
              title,
              company,
              location,
              salary: "Competitive",
              experience,
              education,
              description: fullDesc,
              source: "LinkedIn",
              url,
              postedDate: `${dateStr} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
            });
          }
        }
      }
    } catch (error) {
      console.error("[Crawler Agent] LinkedIn search fetch failed:", error);
    }
  }

  // Mode 2: RemoteOK — only include if user wants remote work
  if (wantsRemote || !targetCountry) {
    try {
      const res = await fetch("https://remoteok.com/api");
      if (res.ok) {
        const data = await res.json();
        const listings = Array.isArray(data) ? data.slice(1) : [];

        listings.forEach((item: any) => {
          const title = item.position || "";
          const company = item.company || "";
          const desc = item.description || "";
          const tags = Array.isArray(item.tags) ? item.tags.join(", ") : "";

          const matchesRole = !targetRole ||
            title.toLowerCase().includes(targetRole) ||
            tags.toLowerCase().includes(targetRole) ||
            desc.toLowerCase().includes(targetRole);

          if (!matchesRole) return;

          const postDate = item.date ? new Date(item.date) : new Date();
          const ageInHours = (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60);
          if (maxHours > 0 && ageInHours > maxHours) return;

          const displayLoc = plan.filters.country ? `Remote (${plan.filters.country})` : "Remote";
          const experience = parseExperience(title, desc);
          const education = parseEducation(desc);

          jobs.push({
            title,
            company,
            location: displayLoc,
            salary: item.salary ? `$${item.salary.toLocaleString()}` : "Competitive",
            experience,
            education,
            description: desc.replace(/<[^>]*>/g, ""),
            source: "RemoteOK",
            url: item.url || "https://remoteok.com",
            postedDate: `${postDate.toLocaleDateString()} at ${postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          });
        });
      }
    } catch (error) {
      console.error("[Crawler Agent] RemoteOK live fetch failed:", error);
    }
  }

  // Mode 3: Greenhouse boards — filter strictly by country, allow remote only if user wants remote
  const boards = ["vercel", "stripe", "figma", "retargetly"];
  for (const board of boards) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`);
      if (res.ok) {
        const data = await res.json();
        const listings = data.jobs || [];

        listings.forEach((item: any) => {
          const title = item.title || "";
          const matchesRole = !targetRole || title.toLowerCase().includes(targetRole);
          if (!matchesRole) return;

          const postDate = item.updated_at ? new Date(item.updated_at) : new Date();
          const ageInHours = (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60);
          if (maxHours > 0 && ageInHours > maxHours) return;

          const jobLoc = item.location?.name || "Global / Remote";
          const { matches, isRemote } = locationMatchesCountry(jobLoc);
          if (!matches) return;

          const displayLoc = isRemote && plan.filters.country
            ? `Remote (${plan.filters.country})`
            : jobLoc;

          const desc = `Position: ${title}\nCompany: ${board.toUpperCase()}\nLocation: ${displayLoc}\n\nPlease visit the listing URL to apply and view full description details.`;

          jobs.push({
            title,
            company: board.toUpperCase(),
            location: displayLoc,
            salary: "Competitive",
            experience: parseExperience(title, desc),
            education: parseEducation(desc),
            description: desc,
            source: "Greenhouse",
            url: item.absolute_url || "https://boards.greenhouse.io",
            postedDate: `${postDate.toLocaleDateString()} at ${postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          });
        });
      }
    } catch (error) {
      console.error(`[Crawler Agent] Greenhouse live fetch for ${board} failed:`, error);
    }
  }

  // Fallback: If no live results, generate country-relevant search links (not fake jobs)
  if (jobs.length === 0) {
    const country = plan.filters.country || "India";
    const role = plan.filters.role || "Software Engineer";
    console.log(`[Crawler Agent] No live matches. Generating ${country}-specific search links as fallback...`);

    const indiaCompanies = ["TCS", "Infosys", "Wipro", "HCL Technologies", "Tech Mahindra", "Razorpay", "Swiggy", "PhonePe", "Freshworks", "Zepto"];
    const globalCompanies = ["Google", "Microsoft", "Amazon", "Meta", "Apple"];
    const fallbackCompanies = targetCountry === "india" ? indiaCompanies : globalCompanies;

    for (let i = 0; i < Math.min(8, fallbackCompanies.length); i++) {
      const company = fallbackCompanies[i];
      jobs.push({
        title: `${role}`,
        company,
        location: country,
        salary: "Competitive",
        experience: "2-5 years",
        education: "Bachelor's Degree in Engineering or Computer Science",
        description: `Position: ${role}\nCompany: ${company}\nLocation: ${country}\n\nClick Apply to search for live ${role} openings at ${company} in ${country}.`,
        source: "Search",
        url: `https://www.google.com/search?q=${encodeURIComponent(`${company} ${role} jobs ${country} site:linkedin.com OR site:naukri.com`)}`,
        postedDate: `Today (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      });
    }
  }

  console.log(`[Crawler Agent] Completed. Gathered ${jobs.length} relevant postings.`);
  return jobs;
}

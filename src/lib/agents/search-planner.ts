import { SearchQuery } from "./preference-analyzer";

export interface SearchPlan {
  sources: string[];
  maxPages: number;
  filters: {
    role: string;
    remote: boolean;
    location: string;
  };
}

export function generateSearchPlan(query: SearchQuery): SearchPlan {
  // Plan which platforms to crawl based on location and preference.
  // Greenhouse, Lever, Ashby, company website, etc.
  const sources = ["Greenhouse", "Lever", "Ashby", "RemoteOK", "Greenhouse Careers"];

  return {
    sources,
    maxPages: 3,
    filters: {
      role: query.role,
      remote: query.remoteOnly,
      location: query.locations[0] || "Remote",
    },
  };
}

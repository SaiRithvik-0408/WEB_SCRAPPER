import { SearchQuery } from "./preference-analyzer";

export interface SearchPlan {
  sources: string[];
  maxPages: number;
  filters: {
    role: string;
    remote: boolean;
    location: string;
    country: string;
    timeWindow: number;
  };
}

export function generateSearchPlan(query: SearchQuery): SearchPlan {
  const sources = ["LinkedIn", "RemoteOK", "Greenhouse", "Lever"];

  return {
    sources,
    maxPages: 3,
    filters: {
      role: query.role,
      remote: query.remoteOnly,
      location: query.locations[0] || "Remote",
      country: query.country || "United States",
      timeWindow: query.timeWindow || 24,
    },
  };
}

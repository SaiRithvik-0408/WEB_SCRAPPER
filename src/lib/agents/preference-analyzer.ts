export interface SearchQuery {
  keywords: string[];
  role: string;
  locations: string[];
  remoteOnly: boolean;
  minSalary?: number;
  country: string;
  timeWindow: number;
}


export function analyzePreferences(preference: {
  skills: string | null;
  role: string | null;
  location: string | null;
  remote: string | null;
  salary: number | null;
  country: string | null;
  timeWindow: number | null;
}): SearchQuery {
  // Extract clean keywords from skills
  const skillsList = (preference.skills || "")
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Determine standard synonyms and related keywords based on target role
  const roleSynonyms: Record<string, string[]> = {
    "backend developer": ["node", "express", "java", "spring", "go", "python backend", "rest api", "microservices"],
    "frontend developer": ["react", "nextjs", "typescript", "tailwind", "vue", "angular", "javascript"],
    "fullstack developer": ["react", "node", "typescript", "nextjs", "postgres", "express"],
    "software engineer": ["software engineer", "developer", "backend", "frontend", "fullstack"],
    "ai engineer": ["llm", "openai", "python", "machine learning", "pytorch", "langchain", "rag"],
  };

  const normalizedRole = (preference.role || "").toLowerCase().trim();
  let keywords = [...skillsList];

  // Inject role-based keyword expansions
  if (normalizedRole) {
    Object.keys(roleSynonyms).forEach(key => {
      if (normalizedRole.includes(key) || key.includes(normalizedRole)) {
        keywords = Array.from(new Set([...keywords, ...roleSynonyms[key]]));
      }
    });
  }

  return {
    keywords,
    role: preference.role || "",
    locations: (preference.location || "Remote").split(",").map(l => l.trim()),
    remoteOnly: (preference.remote || "").toLowerCase() === "remote",
    minSalary: preference.salary || undefined,
    country: preference.country || "United States",
    timeWindow: preference.timeWindow !== undefined && preference.timeWindow !== null ? preference.timeWindow : 24,
  };
}

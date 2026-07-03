import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Basic regex/keyword parser to extract profile elements from resume text
function parseResumeText(text: string) {
  const skillsList = [
    "react", "node.js", "node", "python", "typescript", "javascript", "go", "golang", 
    "sql", "postgres", "mongodb", "aws", "docker", "kubernetes", "java", "c++", 
    "ruby", "rails", "php", "laravel", "vue", "angular", "tailwind", "next.js", 
    "nextjs", "pinecone", "langgraph", "llm", "llms", "rest api", "microservices"
  ];
  const foundSkills: string[] = [];
  const lower = text.toLowerCase();
  
  skillsList.forEach(s => {
    if (lower.includes(s)) {
      if (s === "node") foundSkills.push("Node.js");
      else if (s === "nextjs") foundSkills.push("Next.js");
      else if (s === "golang") foundSkills.push("Go");
      else foundSkills.push(s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
    }
  });

  const uniqueSkills = Array.from(new Set(foundSkills));

  let experience = "3 years";
  const expMatch = lower.match(/(\d+)\+?\s*years?\s*(?:of)?\s*experience/);
  if (expMatch) {
    experience = `${expMatch[1]} years`;
  } else {
    const simpleMatch = lower.match(/experience[:\s]+(\d+)\s*years?/);
    if (simpleMatch) {
      experience = `${simpleMatch[1]} years`;
    }
  }

  return {
    skills: uniqueSkills.length > 0 ? uniqueSkills.join(", ") : "React, Node.js, TypeScript",
    experience,
  };
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ resumes });
  } catch (error: any) {
    console.error("Fetch resumes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileContent } = await req.json();
    if (!fileName || !fileContent) {
      return NextResponse.json({ error: "Missing file name or content" }, { status: 400 });
    }

    const userId = session.userId;

    let textContent = "";
    try {
      if (fileContent.includes(";base64,")) {
        textContent = Buffer.from(fileContent.split(";base64,")[1], "base64").toString("utf-8");
      } else {
        textContent = Buffer.from(fileContent, "base64").toString("utf-8");
      }
    } catch (e) {
      textContent = fileContent;
    }

    const { skills, experience } = parseResumeText(textContent);

    await prisma.resume.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    const newResume = await prisma.resume.create({
      data: {
        userId,
        fileName,
        fileContent,
        skills,
        experience,
        isActive: true,
      },
    });

    const existingPreference = await prisma.preference.findUnique({
      where: { userId },
    });

    if (existingPreference) {
      await prisma.preference.update({
        where: { userId },
        data: {
          skills,
          experience,
        },
      });
    } else {
      await prisma.preference.create({
        data: {
          userId,
          skills,
          experience,
          role: "Software Engineer",
          education: "Bachelor's Degree",
          salary: 90000,
          location: "Remote",
          remote: "remote",
          days: 7,
        },
      });
    }

    return NextResponse.json({ success: true, resume: newResume });
  } catch (error: any) {
    console.error("Upload resume error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing resume ID" }, { status: 400 });
    }

    const userId = session.userId;

    const resume = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    await prisma.resume.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    const updatedResume = await prisma.resume.update({
      where: { id },
      data: { isActive: true },
    });

    const skills = resume.skills || "";
    const experience = resume.experience || "";

    const existingPreference = await prisma.preference.findUnique({
      where: { userId },
    });

    if (existingPreference) {
      await prisma.preference.update({
        where: { userId },
        data: {
          skills,
          experience,
        },
      });
    } else {
      await prisma.preference.create({
        data: {
          userId,
          skills,
          experience,
          role: "Software Engineer",
          education: "Bachelor's Degree",
          salary: 90000,
          location: "Remote",
          remote: "remote",
          days: 7,
        },
      });
    }

    return NextResponse.json({ success: true, resume: updatedResume });
  } catch (error: any) {
    console.error("Activate resume error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

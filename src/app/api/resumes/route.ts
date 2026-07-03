import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseResumeText(text: string) {
  const skillsConfig = [
    { pattern: /\breact\b/i, display: "React" },
    { pattern: /\bnode\.js\b|\bnode\b/i, display: "Node.js" },
    { pattern: /\bpython\b/i, display: "Python" },
    { pattern: /\btypescript\b|\bts\b/i, display: "TypeScript" },
    { pattern: /\bjavascript\b|\bjs\b/i, display: "JavaScript" },
    { pattern: /\bgo\b|\bgolang\b/i, display: "Go" },
    { pattern: /\bsql\b/i, display: "SQL" },
    { pattern: /\bpostgres\b|\bpostgresql\b/i, display: "PostgreSQL" },
    { pattern: /\bmongodb\b/i, display: "MongoDB" },
    { pattern: /\baws\b/i, display: "AWS" },
    { pattern: /\bdocker\b/i, display: "Docker" },
    { pattern: /\bkubernetes\b|\bk8s\b/i, display: "Kubernetes" },
    { pattern: /\bjava\b/i, display: "Java" },
    { pattern: /\bc\+\+\b/i, display: "C++" },
    { pattern: /\bruby\b/i, display: "Ruby" },
    { pattern: /\brails\b/i, display: "Rails" },
    { pattern: /\bphp\b/i, display: "PHP" },
    { pattern: /\blaravel\b/i, display: "Laravel" },
    { pattern: /\bvue\b|\bvue\.js\b/i, display: "Vue.js" },
    { pattern: /\bangular\b/i, display: "Angular" },
    { pattern: /\btailwind\b|\btailwindcss\b/i, display: "Tailwind CSS" },
    { pattern: /\bnext\.js\b|\bnextjs\b/i, display: "Next.js" },
    { pattern: /\bpinecone\b/i, display: "Pinecone" },
    { pattern: /\blanggraph\b/i, display: "LangGraph" },
    { pattern: /\bllm\b|\bllms\b/i, display: "LLM" },
    { pattern: /\brest api\b|\brestful api\b/i, display: "REST API" },
    { pattern: /\bmicroservices\b/i, display: "Microservices" }
  ];

  const foundSkills: string[] = [];
  skillsConfig.forEach(cfg => {
    if (cfg.pattern.test(text)) {
      foundSkills.push(cfg.display);
    }
  });

  const uniqueSkills = Array.from(new Set(foundSkills));

  let experience = "3 years";
  const lower = text.toLowerCase();
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

export async function DELETE(req: Request) {
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

    await prisma.resume.delete({
      where: { id },
    });

    if (resume.isActive) {
      const nextActive = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (nextActive) {
        await prisma.resume.update({
          where: { id: nextActive.id },
          data: { isActive: true },
        });

        await prisma.preference.update({
          where: { userId },
          data: {
            skills: nextActive.skills || "",
            experience: nextActive.experience || "",
          },
        });
      } else {
        await prisma.preference.update({
          where: { userId },
          data: {
            skills: "",
            experience: "",
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete resume error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

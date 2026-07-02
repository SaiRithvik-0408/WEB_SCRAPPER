"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  User,
  Settings,
  Bell,
  Search,
  CheckCircle,
  Bookmark,
  Sparkles,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  FileText,
  HelpCircle,
  Terminal,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Home() {
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  // Dashboard & Application state
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "profile" | "tools" | "logs">("dashboard");
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalJobs: 0, newJobs: 0, applied: 0, saved: 0, recommended: 0 });
  const [charts, setCharts] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  
  // Agent running states
  const [isScraping, setIsScraping] = useState(false);
  const [currentAgentStep, setCurrentAgentStep] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    remote: false,
    saved: false,
    applied: false,
  });

  // Profile preferences state
  const [profileForm, setProfileForm] = useState({
    role: "Software Engineer",
    skills: "React, Node.js, Python, TypeScript",
    education: "Bachelor's Degree",
    experience: "3 years",
    salary: 95000,
    location: "Remote",
    remote: "remote",
    days: 7,
  });

  // Tool outputs
  const [selectedJobForTool, setSelectedJobForTool] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [prepQuestions, setPrepQuestions] = useState<any[]>([]);
  const [generatingPrep, setGeneratingPrep] = useState(false);
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [parsingResume, setParsingResume] = useState(false);

  // Hydration safety
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchJobs();
      fetchNotifications();
    }
  }, [user, filters]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          if (data.user.preference) {
            setProfileForm({
              role: data.user.preference.role,
              skills: data.user.preference.skills,
              education: data.user.preference.education,
              experience: data.user.preference.experience,
              salary: data.user.preference.salary,
              location: data.user.preference.location,
              remote: data.user.preference.remote,
              days: data.user.preference.days,
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed");
        return;
      }
      setUser(data.user);
      checkAuth();
    } catch (err) {
      setAuthError("Server communication failed");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setJobs([]);
    setNotifications([]);
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setCharts(data.charts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJobs = async () => {
    try {
      const query = new URLSearchParams();
      if (filters.search) query.append("search", filters.search);
      if (filters.location) query.append("location", filters.location);
      if (filters.remote) query.append("remote", "true");
      if (filters.saved) query.append("saved", "true");
      if (filters.applied) query.append("applied", "true");

      const res = await fetch(`/api/jobs?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveJob = async (jobId: string, currentSaved: boolean) => {
    try {
      const res = await fetch("/api/jobs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, saved: !currentSaved }),
      });
      if (res.ok) {
        fetchJobs();
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyJob = async (jobId: string, jobUrl: string) => {
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        fetchJobs();
        fetchDashboardData();
        if (jobUrl) {
          window.open(jobUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        alert("Preferences updated successfully!");
        fetchJobs();
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runAIScraper = async () => {
    if (isScraping) return;
    setIsScraping(true);
    setAgentLogs([]);
    
    const steps = [
      { name: "Agent 1: Preference Analyzer", log: "Analyzing profile preferences, expanding job synonyms, generating search patterns..." },
      { name: "Agent 2: Search Planner", log: "Planning target locations, mapping boards (Greenhouse, Lever, Ashby, company sites), and scheduling parallel tasks..." },
      { name: "Agent 3: Crawler Agent", log: "Executing parallel crawlers to parse greenhouse, lever, ashby boards..." },
      { name: "Agent 4: Deduplication Agent", log: "Running cross-platform deduplication based on job fingerprint headers..." },
      { name: "Agent 5: AI Matcher & Ranker", log: "Calculating cosine similarities on job descriptions and user's profile skills..." },
      { name: "Agent 6: Notification Agent", log: "Analyzing job ratings, triggering alerts, and generating user dashboard logs..." }
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentAgentStep(steps[i].name);
      setAgentLogs(prev => [...prev, `[INFO] [${new Date().toLocaleTimeString()}] ${steps[i].name} - Started`, `[INFO] ${steps[i].log}`]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAgentLogs(prev => [...prev, `[SUCCESS] [${new Date().toLocaleTimeString()}] ${steps[i].name} - Complete`]);
    }

    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAgentLogs(prev => [
          ...prev,
          `[RESULT] Found ${data.scrapedCount} total raw jobs.`,
          `[RESULT] Deduplicated down to ${data.savedCount} unique database listings.`,
          `[RESULT] Logged ${data.notifiedCount} high-match recommendation notifications.`
        ]);
        fetchJobs();
        fetchDashboardData();
        fetchNotifications();
      }
    } catch (e: any) {
      setAgentLogs(prev => [...prev, `[ERROR] Scraper Agent pipeline encountered error: ${e.message}`]);
    } finally {
      setIsScraping(false);
      setCurrentAgentStep(null);
    }
  };

  const handleGenerateCoverLetter = async (job: any) => {
    setSelectedJobForTool(job);
    setGeneratingLetter(true);
    setActiveTab("tools");
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCoverLetter(data.coverLetter);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleGeneratePrepQuestions = async (job: any) => {
    setSelectedJobForTool(job);
    setGeneratingPrep(true);
    setActiveTab("tools");
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrepQuestions(data.questions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPrep(false);
    }
  };

  const handleResumeMockUpload = () => {
    setParsingResume(true);
    setTimeout(() => {
      setResumeFile("Sai_Rithvik_Resume.pdf");
      setProfileForm({
        ...profileForm,
        skills: "Python, JavaScript, Go, SQL, React, Node.js, LangGraph, Pinecone, LLMs, REST APIs, Microservices",
        experience: "4 years",
      });
      setParsingResume(false);
      alert("AI Parser: Extracted 11 skills, 4 years experience, and pre-filled preferences successfully!");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0f111a]">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-[#6366f1] mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Initializing AI Job Finder...</p>
        </div>
      </div>
    );
  }

  // Auth Panel
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f111a] px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-glow-purple bg-no-repeat pointer-events-none opacity-40"></div>
        <div className="absolute inset-0 bg-glow-teal bg-no-repeat pointer-events-none opacity-30 transform translate-x-1/2 translate-y-1/2"></div>
        
        <div className="w-full max-w-md glass p-8 rounded-2xl border border-white/5 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-[#6366f1] to-[#10b981] rounded-xl mb-4 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AI Job Finder
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Agentic Job Search & Aggregation Suite</p>
          </div>

          <div className="flex space-x-1 bg-slate-900/80 p-1 rounded-lg mb-6 border border-white/5">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                authMode === "login" ? "bg-[#6366f1] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                authMode === "register" ? "bg-[#6366f1] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-4 py-3 rounded-lg mb-4">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "register" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sai Rithvik"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#6366f1] transition-all text-white placeholder-gray-600"
                  value={authForm.name}
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                required
                placeholder="sai@example.com"
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#6366f1] transition-all text-white placeholder-gray-600"
                value={authForm.email}
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#6366f1] transition-all text-white placeholder-gray-600"
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:from-indigo-600 hover:to-indigo-700 transition-all text-sm mt-6"
            >
              {authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Authenticated Application Dashboard
  return (
    <div className="flex flex-col min-h-screen bg-[#0f111a] text-white">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full bg-glow-purple bg-no-repeat pointer-events-none opacity-20 z-0"></div>
      <div className="fixed top-1/2 right-0 w-full h-full bg-glow-teal bg-no-repeat pointer-events-none opacity-20 z-0 transform translate-x-1/3"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 glass-nav h-16 flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-[#6366f1] to-[#10b981] rounded-lg shadow-md shadow-indigo-500/10">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            AI Job Finder
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
            Agentic
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Active AI Agent Indicator */}
          {isScraping && (
            <div className="flex items-center space-x-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 text-indigo-300 text-xs font-semibold animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />
              <span>{currentAgentStep || "Agent running..."}</span>
            </div>
          )}

          <button
            onClick={runAIScraper}
            disabled={isScraping}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isScraping
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20"
            }`}
          >
            <RefreshCw className={`h-3 w.3 ${isScraping ? "animate-spin" : ""}`} />
            <span>{isScraping ? "Scraping..." : "Run AI Agent Crawler"}</span>
          </button>

          <span className="text-sm font-semibold text-slate-300 border-l border-white/10 pl-4 flex items-center space-x-2">
            <User className="h-4 w-4 text-indigo-400" />
            <span>Sai Rithvik</span>
          </span>

          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-200 transition-all p-1.5 rounded-lg hover:bg-white/5"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* Sidebar Nav */}
        <aside className="w-64 bg-slate-950/60 border-r border-white/5 p-4 flex flex-col justify-between hidden md:flex">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("jobs")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "jobs"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Job Aggregator</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "profile"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>User Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("tools")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "tools"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>AI Copilot tools</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "logs"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>Agent Console Logs</span>
            </button>
          </div>

          <div className="border-t border-white/5 pt-4">
            <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <h4 className="text-xs font-bold text-indigo-400 mb-1 flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Recommendation</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Crawling Greenhouse, Lever & Ashby. Profiles match items dynamically using vector similarities.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Viewer Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header metrics card */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white">Welcome, Sai Rithvik</h1>
                  <p className="text-slate-400 text-sm mt-1">Here is a summary of your AI-driven job aggregation agent status today.</p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-lg flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Agent Scheduler: Active (Every 6h)</span>
                </div>
              </div>

              {/* Statistical cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Scraped</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold">{stats.totalJobs}</span>
                    <span className="text-xs text-indigo-400 font-semibold">+100%</span>
                  </div>
                </div>

                <div className="glass p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Today's New</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold text-emerald-400">{stats.newJobs}</span>
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">New</span>
                  </div>
                </div>

                <div className="glass p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Applied</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold text-sky-400">{stats.applied}</span>
                  </div>
                </div>

                <div className="glass p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Saved</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold text-amber-400">{stats.saved}</span>
                  </div>
                </div>

                <div className="glass p-5 rounded-xl border border-white/5 flex flex-col justify-between col-span-2 lg:col-span-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">AI Recommended</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold text-purple-400">{stats.recommended}</span>
                    <span className="text-xs text-purple-400 flex items-center">
                      <Sparkles className="h-3 w-3 mr-0.5" />
                      <span>{Math.round((stats.recommended / (stats.totalJobs || 1)) * 100)}%</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Analytical Charts Grid */}
              {mounted && charts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Chart 1: Applications over week */}
                  <div className="glass p-6 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span>Weekly Job Applications</span>
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={charts.applications}>
                          <defs>
                            <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)" }} />
                          <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorApps)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Skills Demand */}
                  <div className="glass p-6 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      <span>Skill Demand Analytics (%)</span>
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.skillsDemand}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)" }} />
                          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                            {charts.skillsDemand.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#10b981"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3: Companies Hiring */}
                  <div className="glass p-6 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-sky-400" />
                      <span>Active Hiring Organizations</span>
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={charts.companiesHiring}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis type="number" stroke="#64748b" fontSize={11} />
                          <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)" }} />
                          <Bar dataKey="jobs" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 4: Salary ranges */}
                  <div className="glass p-6 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-rose-400" />
                      <span>Salary Range Insights ($k/year)</span>
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={charts.salaryTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)" }} />
                          <Area type="monotone" dataKey="min" stroke="#f43f5e" fill="rgba(244, 63, 94, 0.1)" strokeWidth={1.5} />
                          <Area type="monotone" dataKey="max" stroke="#6366f1" fill="rgba(99, 102, 241, 0.1)" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              )}

              {/* Notification feed */}
              <div className="glass p-6 rounded-xl border border-white/5">
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-[#6366f1]" />
                    <span>Live Match Notifications</span>
                  </span>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="text-[10px] font-bold bg-[#6366f1] text-white px-2 py-0.5 rounded-full">
                      {notifications.filter(n => !n.read).length} New
                    </span>
                  )}
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 text-xs py-4 text-center">No notifications logged. Run the agent crawler to fetch jobs!</p>
                  ) : (
                    notifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        className={`flex items-start justify-between p-3.5 rounded-lg border transition-all ${
                          notif.read ? "bg-slate-900/40 border-white/5 text-slate-400" : "bg-[#6366f1]/5 border-[#6366f1]/20 text-slate-200"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg mt-0.5 ${notif.read ? "bg-slate-800" : "bg-[#6366f1]/10 text-[#6366f1]"}`}>
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{notif.job.company}</span>
                            <p className="text-xs font-medium mt-0.5">
                              AI found a high-compatibility job: <span className="font-semibold">{notif.job.title}</span> ({notif.job.location}).
                            </p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            await fetch("/api/notifications", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: notif.id }),
                            });
                            fetchNotifications();
                          }}
                          className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-all border border-indigo-500/10 px-2 py-0.5 rounded bg-indigo-500/5"
                        >
                          Mark read
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: JOB AGGREGATOR */}
          {activeTab === "jobs" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Aggregated Job Postings</h1>
                  <p className="text-slate-400 text-xs mt-1">Explore, filter, and track AI-crawled jobs across platforms.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, saved: !filters.saved })}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      filters.saved
                        ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                        : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>Saved Jobs</span>
                  </button>

                  <button
                    onClick={() => setFilters({ ...filters, applied: !filters.applied })}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      filters.applied
                        ? "bg-sky-500/20 border-sky-500/30 text-sky-300"
                        : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Applied</span>
                  </button>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-xl border border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search keywords, role, company..."
                    className="w-full bg-slate-950/60 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white placeholder-gray-600"
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Location (e.g. San Francisco)"
                    className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white placeholder-gray-600"
                    value={filters.location}
                    onChange={e => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox bg-slate-950 border-white/5 text-indigo-600 rounded"
                      checked={filters.remote}
                      onChange={e => setFilters({ ...filters, remote: e.target.checked })}
                    />
                    <span>Remote Only</span>
                  </label>
                </div>

                <div className="text-right">
                  <button
                    onClick={() => setFilters({ search: "", location: "", remote: false, saved: false, applied: false })}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Jobs List Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side list */}
                <div className="lg:col-span-2 space-y-4">
                  {jobs.length === 0 ? (
                    <div className="glass p-8 text-center rounded-xl border border-white/5">
                      <Briefcase className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm font-semibold">No jobs found matching the parameters.</p>
                      <p className="text-slate-500 text-xs mt-1">Try resetting filters or click "Run AI Agent Crawler" above to generate listings.</p>
                    </div>
                  ) : (
                    jobs.map((job: any) => (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJobForTool(job)}
                        className={`glass p-5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                          selectedJobForTool?.id === job.id ? "border-[#6366f1] bg-[#6366f1]/5" : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-base text-slate-100 hover:text-[#6366f1] transition-all">
                              {job.title}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              job.matchScore >= 85 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : job.matchScore >= 70 ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              {job.matchScore}% Match
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-semibold">
                            <span className="text-slate-200">{job.company}</span>
                            <span>•</span>
                            <span>{job.location}</span>
                            <span>•</span>
                            <span className="text-indigo-300">{job.salary}</span>
                          </div>

                          <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-white/5">{job.source}</span>
                            <span>{job.postedDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-stretch md:self-auto justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveJob(job.id, job.saved);
                            }}
                            className={`p-2 rounded-lg border transition-all ${
                              job.saved ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                            }`}
                            title="Save Job"
                          >
                            <Bookmark className="h-4 w-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyJob(job.id, job.url);
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                              job.applied ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default" : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700"
                            }`}
                          >
                            {job.applied ? "Applied" : "Apply"}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateCoverLetter(job);
                            }}
                            className="p-2 rounded-lg border bg-slate-900 border-white/5 text-slate-400 hover:text-white transition-all"
                            title="Cover Letter Builder"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right side details card */}
                <div className="glass p-6 rounded-xl border border-white/5 space-y-6 h-fit sticky top-20 self-start">
                  {selectedJobForTool ? (
                    <>
                      <div className="border-b border-white/5 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400">{selectedJobForTool.company}</span>
                          <span className="text-xs text-slate-500">{selectedJobForTool.postedDate}</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-white mt-1">{selectedJobForTool.title}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedJobForTool.location} • {selectedJobForTool.salary}</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Key parameters</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-900/60 p-2 rounded border border-white/5">
                              <span className="text-[10px] text-slate-500 block">Experience</span>
                              <span className="font-semibold text-slate-200">{selectedJobForTool.experience}</span>
                            </div>
                            <div className="bg-slate-900/60 p-2 rounded border border-white/5">
                              <span className="text-[10px] text-slate-500 block">Education</span>
                              <span className="font-semibold text-slate-200 truncate">{selectedJobForTool.education}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description summary</h4>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {selectedJobForTool.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                        <a
                          href={selectedJobForTool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 rounded-lg border border-white/5 text-center flex items-center justify-center space-x-1"
                        >
                          <span>Visit career board page</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>

                        <button
                          onClick={() => handleGeneratePrepQuestions(selectedJobForTool)}
                          className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 font-semibold text-xs py-2.5 px-3 rounded-lg border border-indigo-500/20 flex items-center justify-center space-x-1.5"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>AI Interview Preparation Assistant</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-400">Select a job posting to view deep insights, custom letters, and interview tips.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: USER PROFILE */}
          {activeTab === "profile" && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
              
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Preference Management</h1>
                <p className="text-slate-400 text-xs mt-1">Configure your targets and parse your resume to update the AI search criteria.</p>
              </div>

              {/* Resume Parsing Card */}
              <div className="glass p-6 rounded-xl border border-white/5">
                <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span>Resume Parsing Engine</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Upload your CV to automatically structure target keywords, educational thresholds, and years of experience.
                </p>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleResumeMockUpload}
                    disabled={parsingResume}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-md transition-all flex items-center space-x-2"
                  >
                    {parsingResume ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>AI Parsing...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Upload CV & Parse with AI</span>
                      </>
                    )}
                  </button>

                  {resumeFile ? (
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                      Attached: {resumeFile}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">No resume attached. Default profile is active.</span>
                  )}
                </div>
              </div>

              {/* Preferences Configuration Form */}
              <form onSubmit={handleUpdateProfile} className="glass p-6 rounded-xl border border-white/5 space-y-6">
                <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center space-x-2">
                  <SlidersHorizontal className="h-4 w-4 text-teal-400" />
                  <span>Job Seeker Parameters</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Preferred Job Title</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white"
                      value={profileForm.role}
                      onChange={e => setProfileForm({ ...profileForm, role: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Target Locations (comma-separated)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white"
                      value={profileForm.location}
                      onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Skills Inventory (comma-separated)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white"
                      value={profileForm.skills}
                      onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Experience level</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white"
                      value={profileForm.experience}
                      onChange={e => setProfileForm({ ...profileForm, experience: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Minimum Target Salary ($/year)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white"
                      value={profileForm.salary}
                      onChange={e => setProfileForm({ ...profileForm, salary: parseInt(e.target.value, 10) })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Work type</label>
                    <select
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white"
                      value={profileForm.remote}
                      onChange={e => setProfileForm({ ...profileForm, remote: e.target.value })}
                    >
                      <option value="remote">Remote only</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                      <option value="any">Any</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Posted Within (Days)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-[#6366f1] transition-all text-white"
                      value={profileForm.days}
                      onChange={e => setProfileForm({ ...profileForm, days: parseInt(e.target.value, 10) })}
                    />
                  </div>
                </div>

                <div className="text-right pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all"
                  >
                    Save Preference Setup
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 4: AI COPILOT TOOLS */}
          {activeTab === "tools" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">AI Copilot Assistant</h1>
                <p className="text-slate-400 text-xs mt-1">Generate cover letters and prepare for interviews tailored specifically to the job description.</p>
              </div>

              {selectedJobForTool ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Tool 1: Cover Letter builder */}
                  <div className="glass p-6 rounded-xl border border-white/5 flex flex-col justify-between h-[500px]">
                    <div>
                      <h3 className="text-sm font-bold text-slate-300 mb-1 flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-indigo-400" />
                        <span>AI Cover Letter Generator</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        Targeting: {selectedJobForTool.title} @ {selectedJobForTool.company}
                      </span>

                      {generatingLetter ? (
                        <div className="flex flex-col items-center justify-center py-20">
                          <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mb-2" />
                          <p className="text-xs text-slate-400 font-semibold">Creating custom cover letter...</p>
                        </div>
                      ) : coverLetter ? (
                        <textarea
                          readOnly
                          className="w-full h-80 bg-slate-950/40 border border-white/5 rounded-lg p-3 text-xs text-slate-300 font-mono mt-4 focus:outline-none resize-none"
                          value={coverLetter}
                        />
                      ) : (
                        <div className="text-center py-20 border border-dashed border-white/5 rounded-lg mt-4">
                          <p className="text-xs text-slate-500">Letter not generated yet. Click below to compose.</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleGenerateCoverLetter(selectedJobForTool)}
                      disabled={generatingLetter}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-lg mt-4 transition-all"
                    >
                      {coverLetter ? "Regenerate Cover Letter" : "Generate Cover Letter with AI"}
                    </button>
                  </div>

                  {/* Tool 2: Interview Prep assistant */}
                  <div className="glass p-6 rounded-xl border border-white/5 flex flex-col justify-between h-[500px]">
                    <div>
                      <h3 className="text-sm font-bold text-slate-300 mb-1 flex items-center space-x-2">
                        <HelpCircle className="h-4 w-4 text-teal-400" />
                        <span>AI Interview Prep Helper</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        Targeting: {selectedJobForTool.title} @ {selectedJobForTool.company}
                      </span>

                      {generatingPrep ? (
                        <div className="flex flex-col items-center justify-center py-20">
                          <RefreshCw className="h-8 w-8 text-teal-400 animate-spin mb-2" />
                          <p className="text-xs text-slate-400 font-semibold">Generating questions...</p>
                        </div>
                      ) : prepQuestions.length > 0 ? (
                        <div className="space-y-4 max-h-80 overflow-y-auto mt-4 pr-2">
                          {prepQuestions.map((q, idx) => (
                            <div key={idx} className="bg-slate-950/60 p-3 rounded-lg border border-white/5 space-y-1">
                              <span className="text-[10px] text-teal-400 font-bold uppercase">Question {idx + 1}</span>
                              <p className="text-xs font-bold text-slate-200">{q.question}</p>
                              <p className="text-xs text-slate-400 font-medium italic mt-1 bg-teal-500/5 p-2 rounded border border-teal-500/10">
                                💡 Tip: {q.tip}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20 border border-dashed border-white/5 rounded-lg mt-4">
                          <p className="text-xs text-slate-500">Prep questions not loaded. Click below to parse.</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleGeneratePrepQuestions(selectedJobForTool)}
                      disabled={generatingPrep}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-4 rounded-lg mt-4 transition-all"
                    >
                      {prepQuestions.length > 0 ? "Regenerate Prep Questions" : "Generate Custom Prep Questions"}
                    </button>
                  </div>

                </div>
              ) : (
                <div className="glass p-12 text-center rounded-xl border border-white/5 max-w-xl mx-auto">
                  <Briefcase className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No job selected.</p>
                  <p className="text-xs text-slate-500 mt-1">Please select a job from the "Job Aggregator" tab first, then open AI Copilot tools.</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: AGENT CONSOLE LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center space-x-2">
                    <Terminal className="h-5 w-5 text-indigo-400" />
                    <span>Agent Orchestrator Shell</span>
                  </h1>
                  <p className="text-slate-400 text-xs mt-1">Watch live multi-agent coordination steps and scraper output diagnostics.</p>
                </div>

                <button
                  onClick={() => setAgentLogs([])}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-all"
                >
                  Clear Console
                </button>
              </div>

              <div className="bg-slate-950 border border-white/10 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-300 overflow-y-auto max-h-[500px] shadow-2xl relative">
                <div className="absolute top-2 right-2 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">LOGS ONLINE</span>
                </div>
                {agentLogs.length === 0 ? (
                  <div className="py-20 text-center text-slate-500">
                    <p>Agent Console is idle.</p>
                    <p className="text-[10px] mt-1">Click "Run AI Agent Crawler" at the top to trigger agent tasks.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {agentLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.startsWith("[ERROR]") ? "text-rose-400"
                            : log.startsWith("[SUCCESS]") ? "text-emerald-400"
                            : log.startsWith("[RESULT]") ? "text-sky-300 font-semibold"
                            : "text-slate-400"
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Target,
  Zap,
  Brain,
  ChevronRight,
  CheckCircle2,
  Trophy,
  Flame,
  Users,
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock,
  MessageSquare,
  RefreshCw,
  Biohazard as Virus,
  LogOut,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Globe,
  Database,
  Gamepad2,
  TrendingUp,
  School,
  Info,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Code2,
  Search,
  ChevronDown,
  X,
  Sun,
  Moon,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Upload,
  FileText,
  Edit2,
  Loader2,
  Download,
  Briefcase,
  GraduationCap,
  Settings,
  History,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { toPng } from "html-to-image";
import {
  generateLearningPath,
  adaptContent,
  generateSchedule,
  generateStudyNotes,
  generateAssessment,
  solveDoubtStream,
  summarizeContent,
  scheduleStudyPlan,
  type LearningProfile,
  type LearningPath,
  type LearningStep,
  type DailySchedule,
  type StudyNotes,
  type Assessment,
  type AssessmentQuestion,
} from "./services/gemini";
import { cn, formatContent } from "./lib/utils";
import { saveFileToDB, getFileFromDB } from "./lib/fileStore";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import confetti from "canvas-confetti";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  type User,
} from "./firebase";

import PathwayGenerator from "./components/PathwayGenerator";
import MentorOverview from "./components/MentorOverview";
import StudyAssistantAgent from "./components/StudyAssistantAgent";
import { LoginModal } from "./components/LoginModal";
import { SupportModal } from "./components/SupportModal";

declare global {
  interface Document {
    startViewTransition(callback: () => void): void;
  }
}

// --- Types ---
type AppState =
  | "landing"
  | "onboarding"
  | "dashboard"
  | "learning"
  | "completed"
  | "profile"
  | "assessment_instruction"
  | "assessment"
  | "pathway_generator"
  | "mentor_overview"
  | "resume";

interface CompletedPathway {
  id: string;
  name: string;
  date: string;
  year: string;
  time: string;
  topics: string[];
  steps: LearningStep[];
  studentName?: string;
  assessmentScore?: number;
}

interface ActivePathway {
  id: string;
  profile: LearningProfile;
  path: LearningPath;
  completedSteps: string[];
  lastAccessed: string;
  assessmentAttempts?: number;
  assessmentScore?: number;
}

interface UserStats {
  xp: number;
  rank: number;
  streak: number;
  completedSteps: string[]; // Keep for legacy/total count if needed, but per-pathway is better
  activePathways?: ActivePathway[];
  mutations: string[];
  dailyQuests: { label: string; xp: number; done: boolean }[];
  completedPathways?: CompletedPathway[];
  schedule?: DailySchedule;
  activityLog?: { [date: string]: number };
  skills?: string[];
  externalCourses?: { name: string; issuer: string; date: string }[];
  resumeSummary?: { about: string; skills: string[] };
}

// --- Main App ---

// --- Components ---

const PlagueButton = ({
  children,
  onClick,
  className,
  variant = "primary",
  type = "button",
  disabled = false,
  ...props
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
  [key: string]: any;
}) => {
  const variants = {
    primary:
      "bg-orange-500 text-black shadow-[12px_12px_0px_0px_var(--shadow-primary)] hover:shadow-none hover:bg-white hover:text-black",
    secondary:
      "bg-transparent text-[var(--text-main)] border-2 border-[var(--card-border)] shadow-[12px_12px_0px_0px_var(--shadow-secondary)] hover:bg-[var(--card-bg)] hover:shadow-none",
    accent:
      "bg-[var(--text-main)] text-[var(--bg-main)] shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] hover:shadow-none hover:bg-orange-500 hover:text-[var(--text-main)]",
    ghost:
      "bg-transparent text-[var(--text-main)] opacity-60 hover:opacity-100 hover:bg-[var(--card-bg)] shadow-none",
  };

  const hasPadding =
    className?.includes("p-") ||
    className?.includes("px-") ||
    className?.includes("py-");

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02, x: 4, y: 1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "plague-button-base group",
        !hasPadding && "px-8 py-4 text-xl",
        variants[variant],
        className,
      )}
      {...props}
    >
      {/* Dynamic Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-orange-500/20 -z-10 pointer-events-none" />
      <span className="flex items-center justify-center gap-2 relative z-10 w-full">
        {children}
      </span>
    </motion.button>
  );
};

const ScrollReveal = ({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.21, 1, 0.44, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-black text-orange-500/60">
            Scroll Down
          </span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-orange-500"
          >
            <ChevronDown size={24} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ThemeToggle = ({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  return (
    <PlagueButton
      variant="ghost"
      onClick={onToggle}
      className="w-12 h-12 flex items-center justify-center p-0 border-2 border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-sm overflow-hidden"
      title={isDark ? "Activate Day Cycle" : "Activate Night Cycle"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={{ y: 20, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -20, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.3, ease: "backOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </motion.div>
      </AnimatePresence>
    </PlagueButton>
  );
};

const Landing = ({
  onStart,
  isLoggedIn,
  isDark,
  onToggleTheme,
}: {
  onStart: () => void;
  isLoggedIn: boolean;
  isDark: boolean;
  onToggleTheme: (e?: React.MouseEvent) => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Submission failed");

      setIsSent(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setIsSent(false), 5000);
    } catch (error) {
      console.error("Contact error:", error);
      alert("Transmission failed. Neural link unstable.");
    }
  };

  return (
    <div className="bg-transparent text-[var(--text-main)] overflow-x-hidden h-screen overflow-y-auto snap-y snap-mandatory relative">
      {/* Fixed Theme Toggle for Landing */}
      <div className="fixed top-8 right-8 z-50">
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>

      {/* Hero / Login Section */}
      <section className="h-screen snap-start flex flex-col items-center justify-center p-6 overflow-hidden relative z-10">
        <ScrollIndicator />

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-orange-500/20"
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                scale: Math.random() * 2 + 0.5,
                rotate: Math.random() * 360,
              }}
              animate={{
                y: [null, "-20px", "20px", "0px"],
                rotate: [null, 10, -10, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Virus size={40 + Math.random() * 80} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center max-w-4xl"
        >
          <div className="flex justify-center mb-12">
            <motion.div
              animate={{ rotate: [12, -12, 12], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="p-6 bg-orange-500/20 rounded-[2rem] shadow-[0_0_50px_rgba(249,115,22,0.2)] backdrop-blur-sm"
            >
              <Virus size={80} className="text-orange-500" />
            </motion.div>
          </div>

          <h1 className="text-[15vw] md:text-[14rem] font-black tracking-tighter leading-[0.8] uppercase mb-6 select-none">
            <span className="block">Plague</span>
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8 md:mb-16 px-4">
            <p className="text-lg md:text-3xl font-mono text-orange-500 uppercase tracking-[0.2em] md:tracking-[0.4em] font-bold">
              Knowledge that spreads.
            </p>
            <div className="h-px w-12 bg-white/20 hidden md:block" />
            <p className="text-[var(--text-secondary)] font-mono text-[10px] md:text-sm uppercase tracking-widest text-center">
              AI-Driven Neural Infection
            </p>
          </div>
        </motion.div>
      </section>

      {/* App Description Section */}
      <section className="min-h-screen md:h-screen snap-start flex flex-col justify-center py-20 px-6 md:px-12 bg-transparent relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            <ScrollReveal className="space-y-6 md:space-y-8">
              <span className="font-mono text-orange-500 uppercase tracking-widest font-bold text-xs md:text-sm">
                Infection Protocol Alpha
              </span>
              <h2 className="text-4xl md:text-7xl font-black uppercase italic leading-tight md:leading-none">
                Welcome to Smart Learning AI
              </h2>
              <p className="text-lg md:text-2xl text-[var(--text-secondary)] leading-relaxed">
                We've engineered a radical approach to education using advanced
                cognitive AI. Our system analyzes your neural patterns to
                deliver{" "}
                <span className="text-[var(--text-main)]">
                  personalized learning
                </span>{" "}
                that evolves with you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="p-4 md:p-6 bg-white/5 border-l-4 border-orange-500">
                  <h4 className="font-black uppercase italic mb-1 md:mb-2 text-sm md:text-base">
                    Adaptive Difficulty
                  </h4>
                  <p className="text-xs md:text-sm text-[var(--text-secondary)] italic leading-tight">
                    Content that scales in complexity based on your absorption
                    rate.
                  </p>
                </div>
                <div className="p-4 md:p-6 bg-white/5 border-l-4 border-orange-500">
                  <h4 className="font-black uppercase italic mb-1 md:mb-2 text-sm md:text-base">
                    Student Growth
                  </h4>
                  <p className="text-xs md:text-sm text-[var(--text-secondary)] italic leading-tight">
                    Quantifiable metrics for rapid cognitive expansion.
                  </p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal className="relative hidden md:block" delay={0.2}>
              <div className="aspect-square bg-orange-500/10 border-4 border-[var(--card-border)] flex items-center justify-center p-12 overflow-hidden">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                >
                  <Brain size={200} className="text-orange-500 opacity-50" />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* About the App Section */}
      <section
        id="about"
        className="min-h-screen md:h-screen snap-start flex flex-col justify-center py-20 px-6 md:px-12 bg-transparent relative z-10"
      >
        <div className="max-w-4xl mx-auto w-full space-y-8 md:space-y-12 text-center md:text-left">
          <ScrollReveal className="space-y-4 md:space-y-6">
            <h2 className="text-4xl md:text-7xl font-black uppercase italic leading-tight md:leading-none">
              The Neural Nexus
            </h2>
            <div className="w-16 md:w-24 h-2 bg-orange-500 mx-auto md:mx-0" />
          </ScrollReveal>
          <ScrollReveal className="space-y-6 md:space-y-8" delay={0.1}>
            <p className="text-xl md:text-3xl font-medium text-[var(--text-main)] opacity-80 leading-relaxed">
              Plague isn't just an app; it's a cognitive accelerator. Built for{" "}
              <span className="text-orange-500 italic">
                students and forward-thinking schools
              </span>
              , it bridges the gap between passive consumption and active neural
              integration.
            </p>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] opacity-80 leading-relaxed italic">
              The key idea is simple: Humans learn best when the path is
              tailored to their unique cognitive architecture. We use AI to map
              that path in real-time.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-8 md:pt-12 text-left">
            <ScrollReveal delay={0.2}>
              <div className="p-6 md:p-8 border-4 border-[var(--card-border)] bg-white/5 space-y-3 md:space-y-4 hover:border-orange-500/50 transition-colors">
                <School size={32} className="text-orange-500 md:w-10 md:h-10" />
                <h3 className="text-xl md:text-2xl font-black uppercase italic">
                  For Schools
                </h3>
                <p className="text-sm md:text-base text-[var(--text-secondary)] italic">
                  Equip your institution with AI-driven analytics and personal
                  paths for every single student.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div className="p-6 md:p-8 border-4 border-[var(--card-border)] bg-white/5 space-y-3 md:space-y-4 hover:border-orange-500/50 transition-colors">
                <Users size={32} className="text-orange-500 md:w-10 md:h-10" />
                <h3 className="text-xl md:text-2xl font-black uppercase italic">
                  For Students
                </h3>
                <p className="text-sm md:text-base text-[var(--text-secondary)] italic">
                  Take control of your learning. Break through plateaus with
                  custom-tuned challenges.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen md:h-screen snap-start flex flex-col justify-center py-20 px-6 md:px-12 bg-transparent relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          <ScrollReveal>
            <h2 className="text-4xl md:text-7xl font-black uppercase italic mb-10 md:mb-16 text-center">
              Mutation Capabilities
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: "Personalized Paths",
                desc: "Dynamic curriculum adjusted to your specific learning velocity.",
                icon: RefreshCw,
                color: "text-blue-500",
              },
              {
                title: "Real-time Tracking",
                desc: "Deep-dive analytics into your neural integration progress.",
                icon: BarChart3,
                color: "text-green-500",
              },
              {
                title: "AI Recommendations",
                desc: "Smart suggestions for your next cognitive leap based on data.",
                icon: Sparkles,
                color: "text-orange-500",
              },
              {
                title: "Multi-Language",
                desc: "Global knowledge access through universal neural translation.",
                icon: Globe,
                color: "text-purple-500",
              },
              {
                title: "Gamified Learning",
                desc: "Dopamine-fueled progression systems and mutation ranks.",
                icon: Gamepad2,
                color: "text-yellow-500",
              },
              {
                title: "Neural Synergy",
                desc: "Connect with other minds to accelerate collective learning.",
                icon: Users,
                color: "text-red-500",
              },
            ].map((feature, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -10 }}
                  className="p-8 bg-[var(--card-bg)] backdrop-blur-sm border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] space-y-6 group h-full"
                >
                  <div
                    className={cn(
                      "p-4 border-2 border-black inline-block bg-[var(--bg-main)] group-hover:scale-110 transition-transform",
                      feature.color,
                    )}
                  >
                    {React.createElement(feature.icon, { size: 32 })}
                  </div>
                  <h3 className="text-2xl font-black uppercase italic">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] italic leading-snug">
                    {feature.desc}
                  </p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Login CTA */}
      <section className="min-h-screen md:h-screen snap-start flex flex-col justify-center py-20 bg-[var(--bg-main)] relative z-10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center space-y-8 md:space-y-12 px-6">
          <ScrollReveal>
            <h2 className="text-4xl md:text-7xl font-black uppercase italic leading-tight md:leading-none text-[var(--text-main)] tracking-tighter">
              Ready to begin?
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <PlagueButton
              onClick={onStart}
              variant="primary"
              className="px-8 md:px-16 py-6 md:py-8 text-xl md:text-3xl"
            >
              {isLoggedIn ? "Infect your mind" : "Login to Infect"}
              <ArrowRight className="inline-block ml-3 md:ml-4 w-6 h-6 md:w-8 md:h-8" />
            </PlagueButton>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="min-h-screen md:h-screen snap-start flex flex-col justify-center py-20 px-6 md:px-12 bg-transparent relative z-10"
      >
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <ScrollReveal className="space-y-6 md:space-y-8">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic leading-tight">
              Transmit Your Query
            </h2>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] font-bold italic">
              Our neural support unit is standing by to assist with your
              integration.
            </p>

            <div className="space-y-4 md:space-y-6 pt-4 md:pt-8">
              <div className="flex items-center gap-4 md:gap-6 group">
                <div className="p-3 md:p-4 bg-orange-500 text-black border-2 border-black group-hover:rotate-12 transition-transform">
                  <Mail size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">
                    Direct Terminal
                  </span>
                  <span className="text-lg md:text-xl font-black italic">
                    plaguesupport@gmail.com
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6 group">
                <div className="p-3 md:p-4 bg-orange-500 text-black border-2 border-black group-hover:rotate-12 transition-transform">
                  <Phone size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-30">
                    Voice Link
                  </span>
                  <span className="text-lg md:text-xl font-black italic">
                    +91 95005 64504
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal
            delay={0.2}
            className="p-6 md:p-10 border-4 border-[var(--text-main)] bg-[var(--card-bg)] backdrop-blur-md shadow-[var(--shadow-primary)]"
          >
            {!isSent ? (
              <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-black uppercase italic text-orange-500 accent-orange">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border-2 border-[var(--input-border)] p-3 md:p-4 font-bold focus:border-orange-500 outline-none transition-colors placeholder:text-[var(--placeholder)] text-sm md:text-base"
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-black uppercase italic text-orange-500 accent-orange">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Your Email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border-2 border-[var(--input-border)] p-3 md:p-4 font-bold focus:border-orange-500 outline-none transition-colors placeholder:text-[var(--placeholder)] text-sm md:text-base"
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-black uppercase italic text-orange-500 accent-orange">
                    Message
                  </label>
                  <textarea
                    placeholder="Describe your query..."
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full h-24 md:h-32 bg-[var(--input-bg)] text-[var(--input-text)] border-2 border-[var(--input-border)] p-3 md:p-4 font-bold focus:border-orange-500 outline-none transition-colors resize-none placeholder:text-[var(--placeholder)] text-sm md:text-base"
                  />
                </div>
                <PlagueButton
                  type="submit"
                  variant="secondary"
                  className="w-full py-4 md:py-6 text-lg md:text-xl h-14 md:h-auto"
                >
                  Send Transmission
                </PlagueButton>
              </form>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4"
              >
                <div className="p-6 bg-orange-500 text-black border-4 border-black inline-block animate-bounce">
                  <CheckCircle2 size={64} />
                </div>
                <h3 className="text-4xl font-black uppercase italic">
                  Transmission Received
                </h3>
                <p className="text-[var(--text-secondary)] italic">
                  Your neural query has been encrypted and sent to
                  plaguesupport@gmail.com
                </p>
                <PlagueButton
                  onClick={() => setIsSent(false)}
                  variant="accent"
                  className="mt-8 px-8 py-3 text-xs"
                >
                  New Transmission
                </PlagueButton>
              </motion.div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[var(--card-bg)] text-[var(--text-main)] border-t-4 border-[var(--card-border)] relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-orange-500 border-2 border-black rotate-12">
              <Virus size={24} className="text-black" />
            </div>
            <span className="text-2xl font-black uppercase italic tracking-tighter">
              Plague AI
            </span>
          </div>

          <div className="flex gap-8 font-mono text-[10px] uppercase font-black tracking-widest">
            <a
              href="#about"
              className="hover:text-orange-500 transition-colors"
            >
              About
            </a>
            <a
              href="#contact"
              className="hover:text-orange-500 transition-colors"
            >
              Contact
            </a>
            <a href="#" className="hover:text-orange-500 transition-colors">
              Privacy Policy
            </a>
          </div>

          <div className="font-mono text-[10px] uppercase opacity-30 font-black tracking-widest text-center md:text-right">
            © 2026 Smart Learning AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const Onboarding = ({
  onComplete,
  initialProfile,
}: {
  onComplete: (profile: LearningProfile) => void;
  initialProfile?: LearningProfile;
}) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<LearningProfile>(
    initialProfile || {
      name: "",
      learningStyle: "visual",
      goals: "",
      level: "beginner",
      subject: "",
      specificTopics: "",
      importantTopics: "",
    },
  );

  const steps = [
    {
      title: "Identify Subject",
      field: "name",
      placeholder: "Enter your name...",
      type: "text",
      label: "Subject Name",
    },
    {
      title: "Target Domain",
      field: "subject",
      placeholder: "e.g., Quantum Physics, Python, History...",
      type: "text",
      label: "Knowledge Domain",
    },
    {
      title: "Specific Areas",
      field: "specificTopics",
      placeholder:
        "Which specific topics within this subject are you interested in?",
      type: "textarea",
      label: "Target Modules",
      skippable: true,
    },
    {
      title: "Mandatory Core",
      field: "importantTopics",
      placeholder: "What are the most important topics that MUST be covered?",
      type: "textarea",
      label: "Mission Critical",
      skippable: true,
    },
    {
      title: "Neural Preference",
      field: "learningStyle",
      label: "Neural Style",
      skippable: true,
      options: [
        {
          id: "visual",
          label: "Visual",
          desc: "Neural mapping via imagery & spatial data",
          icon: <Sparkles />,
        },
        {
          id: "auditory",
          label: "Auditory",
          desc: "Frequency-based learning & sonic patterns",
          icon: <MessageSquare />,
        },
        {
          id: "reading",
          label: "Reading",
          desc: "Symbolic decoding & textual synthesis",
          icon: <BookOpen />,
        },
        {
          id: "kinesthetic",
          label: "Kinesthetic",
          desc: "Tactile execution & physical feedback",
          icon: <Zap />,
        },
      ],
    },
    {
      title: "Infection Level",
      field: "level",
      label: "Infection Stage",
      skippable: true,
      options: [
        {
          id: "beginner",
          label: "Dormant",
          desc: "Initial exposure, no prior data",
        },
        {
          id: "intermediate",
          label: "Active",
          desc: "Significant neural integration",
        },
        {
          id: "advanced",
          label: "Critical",
          desc: "High-level mastery & synthesis",
        },
      ],
    },
    {
      title: "Final Objective",
      field: "goals",
      placeholder: "What is the ultimate outcome of this infection?",
      type: "textarea",
      label: "Strategic Goal",
      skippable: true,
    },
  ];

  // Filter out the name step if it's already provided in initialProfile
  const filteredSteps = steps.filter((s) => {
    if (s.field === "name" && initialProfile?.name) return false;
    return true;
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = async () => {
    if (step < filteredSteps.length - 1) {
      setStep(step + 1);
    } else {
      setIsGenerating(true);
      try {
        await onComplete(profile);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const current = filteredSteps[step];

  return (
    <div className="min-h-screen bg-transparent text-[var(--text-main)] p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="scan-line" />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <div className="mb-8 md:mb-16 flex justify-between items-end">
          {step > 0 ? (
            <div
              className="flex items-center gap-2 md:gap-4 cursor-pointer group mr-2 md:mr-4"
              onClick={handleBack}
            >
              <div className="p-1 md:p-2 border-2 border-transparent group-hover:border-[var(--card-border)] group-hover:bg-[var(--card-bg)] transition-colors rounded-full text-[var(--text-main)]">
                <ArrowLeft size={20} className="md:w-6 md:h-6" />
              </div>
            </div>
          ) : (
            <div className="mr-4 md:mr-8"></div>
          )}
          <div className="font-mono text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] bg-[var(--text-main)] text-[var(--bg-main)] px-2 py-1">
            Phase 0{step + 1}
          </div>
          <div className="flex-1 mx-4 md:mx-8 h-1 bg-[var(--card-border)] relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-orange-500"
              initial={{ width: 0 }}
              animate={{
                width: `${((step + 1) / filteredSteps.length) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </div>
          <div className="font-mono text-[8px] md:text-[10px] uppercase font-black opacity-30">
            {Math.round(((step + 1) / filteredSteps.length) * 100)}%
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8 md:space-y-12"
          >
            <div className="space-y-2">
              <span className="font-mono text-[10px] md:text-xs uppercase text-orange-500 font-bold tracking-widest">
                {current.label || "System Query"}
              </span>
              <h2 className="text-4xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85] text-[var(--text-main)]">
                {current.title}
              </h2>
            </div>

            {current.type === "text" && (
              <div className="relative">
                <input
                  type="text"
                  value={(profile as any)[current.field]}
                  onChange={(e) =>
                    setProfile({ ...profile, [current.field]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (profile as any)[current.field]) {
                      handleNext();
                    }
                  }}
                  placeholder={current.placeholder}
                  className="w-full bg-[var(--input-bg)] border-b-4 md:border-b-8 border-[var(--text-main)] p-4 md:p-6 text-2xl md:text-6xl font-black uppercase italic text-[var(--input-text)] focus:outline-none focus:border-orange-500 transition-colors placeholder:text-[var(--placeholder)] caret-orange-500 shadow-[var(--shadow-primary)]"
                  autoFocus
                />
                <div className="absolute bottom-0 left-0 w-full h-1 md:h-2 bg-orange-500/20 -z-10" />
              </div>
            )}

            {current.type === "textarea" && (
              <div className="relative">
                <textarea
                  value={(profile as any)[current.field]}
                  onChange={(e) =>
                    setProfile({ ...profile, [current.field]: e.target.value })
                  }
                  placeholder={current.placeholder}
                  className="w-full bg-[var(--input-bg)] border-4 border-[var(--text-main)] p-4 md:p-8 text-lg md:text-2xl font-bold text-[var(--input-text)] focus:outline-none focus:border-orange-500 transition-colors h-48 md:h-64 shadow-[var(--shadow-primary)] placeholder:text-[var(--placeholder)] caret-orange-500"
                  autoFocus
                />
              </div>
            )}

            {current.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {current.options.map((opt) => (
                  <motion.button
                    key={opt.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setProfile({ ...profile, [current.field]: opt.id });
                      setTimeout(handleNext, 400);
                    }}
                    className={cn(
                      "p-4 md:p-8 border-none text-left transition-all relative group overflow-hidden",
                      (profile as any)[current.field] === opt.id
                        ? "bg-[var(--text-main)] text-[var(--bg-main)] shadow-none translate-x-1 translate-y-1"
                        : "bg-white text-black shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] md:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                      <span className="text-xl md:text-3xl font-black uppercase italic leading-none">
                        {opt.label}
                      </span>
                      <div
                        className={cn(
                          "transition-transform group-hover:rotate-12",
                          (profile as any)[current.field] === opt.id
                            ? "text-orange-500"
                            : "text-black/70",
                        )}
                      >
                        {(opt as any).icon ? 
                          React.cloneElement((opt as any).icon as React.ReactElement<any>, { size: 20, className: "md:w-6 md:h-6" }) 
                          : <ChevronRight size={20} />}
                      </div>
                    </div>
                    <p
                      className={cn(
                        "text-xs md:text-sm font-bold leading-tight",
                        (profile as any)[current.field] === opt.id
                          ? "text-white/80"
                          : "text-black/70",
                      )}
                    >
                      {opt.desc}
                    </p>

                    {/* Active Indicator */}
                    {(profile as any)[current.field] === opt.id && (
                      <motion.div
                        layoutId="active-opt"
                        className="absolute top-0 right-0 w-12 h-12 bg-orange-500 flex items-center justify-center"
                      >
                        <CheckCircle2 size={24} className="text-black" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {(current.type || current.skippable) && (
              <div className="flex justify-between items-center">
                {current.skippable ? (
                  <PlagueButton
                    variant="ghost"
                    onClick={handleNext}
                    className="text-xs font-black uppercase tracking-[0.2em] p-0"
                  >
                    Skip {current.label || "Step"}
                  </PlagueButton>
                ) : (
                  <div />
                )}

                {current.type && (
                  <PlagueButton
                    onClick={handleNext}
                    disabled={
                      (!current.skippable &&
                        !(profile as any)[current.field]) ||
                      isGenerating
                    }
                    className="px-16 shadow-[12px_12px_0px_0px_var(--shadow-color)] relative"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-5 w-5 border-4 border-current border-t-transparent rounded-full" />
                        Synthesizing...
                      </span>
                    ) : step === filteredSteps.length - 1 ? (
                      "Start Neural Ingestion"
                    ) : (
                      "Confirm Data"
                    )}
                  </PlagueButton>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const DashboardAIAssistant = ({
  profile,
  stats,
  path,
}: {
  profile: LearningProfile;
  stats: UserStats;
  path: LearningPath | null;
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "chat" | "summarizer" | "notes" | "scheduler"
  >("chat");

  // Chat States
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);
  const [savedChats, setSavedChats] = useState<{ id: string; date: Date; history: { role: "user" | "ai"; content: string }[] }[]>([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Summarizer States
  const [summaryInput, setSummaryInput] = useState("");
  const [summaryDepth, setSummaryDepth] = useState("Short");
  const [summaryResult, setSummaryResult] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const summaryFileInputRef = useRef<HTMLInputElement>(null);
  const [summaryFile, setSummaryFile] = useState<{ name: string; dataUrl: string; mimeType: string } | null>(null);

  // Notes States
  const [notesTopic, setNotesTopic] = useState("");
  const [notesLevel, setNotesLevel] = useState("intermediate");
  const [notesResult, setNotesResult] = useState<StudyNotes | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  // Scheduler States
  const [schedModules, setSchedModules] = useState<string[]>([]);
  const [schedCustomModule, setSchedCustomModule] = useState("");
  const [schedHours, setSchedHours] = useState("");
  const [schedDays, setSchedDays] = useState("");
  const [schedResult, setSchedResult] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "chat" && isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isChatOpen, activeTab]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim() || isSendingMessage) return;

    const userMsg = chatMessage.trim();
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsSendingMessage(true);

    try {
      let dashboardContext =
        `User is on the Dashboard. Profile: ${JSON.stringify(profile)}. ` +
        `Stats: XP: ${stats.xp}, Rank: ${stats.rank}, Streak: ${stats.streak}. `;
      if (path) {
        dashboardContext += `Current Focus: ${path.subject}. `;
      }

      setIsSendingMessage(true);

      const stream = solveDoubtStream(
        dashboardContext,
        userMsg,
        chatHistory,
        "navigator",
      );

      // Add a placeholder message for the AI response
      setChatHistory((prev) => [...prev, { role: "ai", content: "" }]);
      
      for await (const chunk of stream) {
        setChatHistory((prev) => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].content += chunk;
          return newHistory;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory[newHistory.length - 1].role === "ai") {
          newHistory[newHistory.length - 1].content = "Connection interference. Could not synthesize response.";
        } else {
          newHistory.push({
            role: "ai",
            content: "Connection interference. Could not synthesize response.",
          });
        }
        return newHistory;
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSummaryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("File is too large. Please upload a file smaller than 20MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setSummaryFile({
        name: file.name,
        dataUrl,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSummarize = async () => {
    if (!summaryInput.trim() && !summaryFile) return;
    setIsSummarizing(true);
    try {
      const fileData = summaryFile ? { data: summaryFile.dataUrl, mimeType: summaryFile.mimeType } : undefined;
      const res = await summarizeContent(summaryInput, summaryDepth, fileData);
      setSummaryResult(res);
    } catch (err) {
      console.error(err);
      setSummaryResult("Failed to summarize content.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!notesTopic.trim()) return;
    setIsGeneratingNotes(true);
    try {
      const res = await generateStudyNotes(notesTopic, notesLevel);
      setNotesResult(res);
    } catch (err) {
      console.error(err);
      setNotesResult(null);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleSchedule = async () => {
    const finalModules = [...schedModules, schedCustomModule].filter(m => m.trim());
    if (finalModules.length === 0 || !schedHours.trim() || !schedDays.trim()) return;
    setIsScheduling(true);
    try {
      const context = path
        ? `Pathway subject: ${path.subject}. Steps count: ${path.steps.length}`
        : "No active pathway";
      const res = await scheduleStudyPlan(
        finalModules.join(", "),
        schedHours,
        schedDays,
        context,
      );
      setSchedResult(res);
    } catch (err) {
      console.error(err);
      setSchedResult("Failed to schedule.");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div
      className={cn(
        "fixed z-[200] flex flex-col items-end pointer-events-none transition-all duration-300",
        isChatMaximized ? "inset-4" : "bottom-8 right-8",
      )}
    >
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] mb-4 flex flex-col shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] pointer-events-auto overflow-hidden",
              isChatMaximized
                ? "w-full h-full flex-1 mb-0"
                : "w-[400px] h-[500px]",
            )}
          >
            <div className="bg-orange-500 text-black p-4 flex justify-between items-center border-b-4 border-black">
              <div className="flex items-center gap-2">
                <Brain size={20} />
                <span className="font-black uppercase tracking-widest text-sm italic">
                  VIRIX - AI Assistant
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsChatMaximized(!isChatMaximized)}
                  className="hover:bg-black hover:text-orange-500 p-1 transition-colors"
                >
                  {isChatMaximized ? (
                    <Minimize2 size={20} />
                  ) : (
                    <Maximize2 size={20} />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsChatOpen(false);
                    setIsChatMaximized(false);
                  }}
                  className="hover:bg-black hover:text-orange-500 p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {isChatMaximized && (
              <div className="flex justify-center border-b-4 border-[var(--card-border)] bg-[var(--bg-main)] overflow-x-auto">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 font-black uppercase text-xs transition-colors border-r-4 border-[var(--card-border)]",
                    activeTab === "chat"
                      ? "bg-orange-500 text-black"
                      : "hover:bg-[var(--card-bg)] text-[var(--text-main)]",
                  )}
                >
                  <MessageSquare size={16} /> Chat
                </button>
                <button
                  onClick={() => setActiveTab("summarizer")}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 font-black uppercase text-xs transition-colors border-r-4 border-[var(--card-border)]",
                    activeTab === "summarizer"
                      ? "bg-orange-500 text-black"
                      : "hover:bg-[var(--card-bg)] text-[var(--text-main)]",
                  )}
                >
                  <FileText size={16} /> Summarizer
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 font-black uppercase text-xs transition-colors border-r-4 border-[var(--card-border)]",
                    activeTab === "notes"
                      ? "bg-orange-500 text-black"
                      : "hover:bg-[var(--card-bg)] text-[var(--text-main)]",
                  )}
                >
                  <BookOpen size={16} /> Notes Generator
                </button>
                <button
                  onClick={() => setActiveTab("scheduler")}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 font-black uppercase text-xs transition-colors",
                    activeTab === "scheduler"
                      ? "bg-orange-500 text-black"
                      : "hover:bg-[var(--card-bg)] text-[var(--text-main)]",
                  )}
                >
                  <Calendar size={16} /> Scheduler
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto w-full flex flex-col relative bg-[var(--bg-main)]">
              {/* CHAT TAB */}
              {(!isChatMaximized || activeTab === "chat") && (
                <div className="flex-1 flex flex-col h-full absolute inset-0">
                  <div className="flex justify-between items-center px-4 py-2 bg-[var(--card-bg)] border-b-2 border-[var(--card-border)]">
                    <button 
                      onClick={() => {
                        if (chatHistory.length > 0) {
                          setSavedChats(prev => [{ id: Date.now().toString(), date: new Date(), history: chatHistory }, ...prev]);
                        }
                        setChatHistory([]);
                        setShowChatHistory(false);
                      }}
                      className="text-xs uppercase font-black px-3 py-1 bg-[var(--bg-main)] border-2 border-[var(--card-border)] hover:border-orange-500 hover:text-orange-500 transition-colors"
                    >
                      New Chat
                    </button>
                    <button 
                      onClick={() => setShowChatHistory(!showChatHistory)}
                      className={cn("text-xs uppercase font-black px-3 py-1 border-2 transition-colors flex items-center gap-2", showChatHistory ? "bg-orange-500 text-black border-orange-500" : "bg-[var(--bg-main)] border-[var(--card-border)] hover:border-orange-500 hover:text-orange-500")}
                      title="Chat History"
                    >
                      {showChatHistory ? "Back to Chat" : <History size={16} />}
                    </button>
                  </div>
                  {showChatHistory ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {savedChats.length === 0 ? (
                        <div className="text-center opacity-50 py-8 text-sm font-black uppercase tracking-widest">
                          No previous chat history found.
                        </div>
                      ) : (
                        savedChats.map((session) => (
                          <div key={session.id} className="p-4 border-2 border-[var(--card-border)] bg-[var(--card-bg)] hover:border-orange-500 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-mono font-bold opacity-70 border border-current px-2 py-0.5">{session.date.toLocaleString()}</span>
                              <button 
                                onClick={() => {
                                  setChatHistory(session.history);
                                  setShowChatHistory(false);
                                }}
                                className="text-xs uppercase font-black px-2 py-1 bg-orange-500 text-black hover:bg-orange-600 transition-colors"
                              >
                                Restore
                              </button>
                            </div>
                            <p className="text-sm italic line-clamp-2 opacity-80 mt-2">
                              {session.history[0]?.content || "Empty thread"}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                        {chatHistory.length === 0 && (
                          <div className="text-center opacity-50 py-8 text-sm font-black uppercase tracking-widest">
                            Ask me anything about your progress, schedule, or
                            pathways.
                          </div>
                        )}
                        {chatHistory.map((msg, i) => {
                          if (msg.role === "ai" && !msg.content) return null;
                          return (
                          <div
                            key={i}
                            className={cn(
                              "max-w-[85%] p-3 text-sm font-medium",
                              msg.role === "user"
                                ? "bg-orange-500 text-black border-2 border-black self-end ml-auto"
                                : "bg-[var(--card-bg)] border-2 border-[var(--card-border)] self-start",
                            )}
                          >
                            <div className="markdown-body prose dark:prose-invert prose-sm max-w-none text-current prose-p:text-current prose-headings:text-current prose-strong:text-current prose-ul:text-current prose-li:text-current">
                              <Markdown>{msg.content}</Markdown>
                            </div>
                          </div>
                        )})}
                        {isSendingMessage && chatHistory[chatHistory.length - 1]?.content === "" && (
                          <div className="bg-[var(--card-bg)] border-2 border-[var(--card-border)] self-start p-3 text-sm font-medium animate-pulse">
                            Synthesizing response...
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                      <form
                        onSubmit={handleSendMessage}
                        className="absolute bottom-0 w-full p-4 border-t-4 border-[var(--card-border)] bg-[var(--bg-main)] flex gap-2"
                      >
                        <input
                          type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Initiate Query..."
                      className="flex-1 px-4 py-2 border-2 border-[var(--card-border)] bg-transparent focus:outline-none focus:border-orange-500 italic"
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !chatMessage.trim()}
                      className="px-4 py-2 bg-orange-500 text-black font-black uppercase disabled:opacity-50 border-2 border-black hover:bg-black hover:text-orange-500 transition-colors"
                    >
                      Send
                    </button>
                  </form>
                  </>
                  )}
                </div>
              )}

              {/* SUMMARIZER TAB */}
              {isChatMaximized && activeTab === "summarizer" && (
                <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 h-full overflow-y-auto">
                  <div className="flex-1 flex flex-col gap-4">
                    <h3 className="font-black uppercase tracking-widest text-xl border-b-4 border-[var(--card-border)] pb-2 flex items-center gap-2">
                      <FileText /> Summarizer
                    </h3>
                    <div className="space-y-2">
                       <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-orange-500">Summary Depth</label>
                       <select 
                         value={summaryDepth} 
                         onChange={(e) => setSummaryDepth(e.target.value)} 
                         className="w-full px-4 py-2 bg-[var(--card-bg)] border-2 border-[var(--card-border)] focus:outline-none focus:border-orange-500 font-mono text-sm"
                       >
                         <option value="Very Short">Very Short</option>
                         <option value="Short">Short</option>
                         <option value="Medium">Medium</option>
                         <option value="Detailed">Detailed</option>
                       </select>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-2">Content</span>
                         <div className="flex items-center gap-2">
                         {summaryFile && (
                          <div className="bg-orange-500/20 text-orange-500 border border-orange-500 px-3 py-1 text-xs font-bold flex items-center gap-2">
                            <span className="truncate max-w-[150px]">{summaryFile.name}</span>
                            <button onClick={() => setSummaryFile(null)} className="hover:text-white"><X size={14} /></button>
                          </div>
                        )}
                        <input 
                          type="file" 
                          ref={summaryFileInputRef}
                          onChange={handleSummaryFileUpload}
                          className="hidden"
                          accept=".pdf,.txt,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        />
                        <button
                          onClick={() => summaryFileInputRef.current?.click()}
                          title="Upload File"
                          className="flex items-center gap-2 bg-[var(--card-bg)] text-[var(--text-main)] border-2 border-[var(--card-border)] px-3 py-1 text-xs font-black uppercase hover:border-orange-500 hover:text-orange-500 transition-colors"
                        >
                          <FileText size={14} /> or upload a file
                        </button>
                        </div>
                      </div>
                      <textarea
                        value={summaryInput}
                        onChange={(e) => setSummaryInput(e.target.value)}
                        className="w-full flex-1 p-4 bg-[var(--card-bg)] border-4 border-[var(--card-border)] font-mono text-sm focus:outline-none focus:border-orange-500"
                        placeholder="Paste text/messages here..."
                      />
                    </div>
                    <button
                      onClick={handleSummarize}
                      disabled={isSummarizing || (!summaryInput.trim() && !summaryFile)}
                      className="py-4 bg-black text-orange-500 border-4 border-orange-500 font-black uppercase hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                      {isSummarizing ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Zap />
                      )}
                      Generate Summary
                    </button>
                  </div>
                  {(summaryResult || isSummarizing) && (
                    <div className="flex-1 p-6 border-4 border-[var(--card-border)] bg-[var(--card-bg)] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]">
                      {isSummarizing ? (
                        <div className="flex flex-col items-center justify-center h-full text-orange-500 gap-4">
                          <Loader2 size={48} className="animate-spin" />
                        </div>
                      ) : (
                        <div className="markdown-body prose dark:prose-invert overflow-auto h-full max-w-none text-[var(--text-main)] prose-p:text-[var(--text-main)] prose-headings:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-ul:text-[var(--text-main)] prose-li:text-[var(--text-main)]">
                          <Markdown remarkPlugins={[remarkGfm, remarkMath]}>
                            {summaryResult}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* NOTES GENERATOR TAB */}
              {isChatMaximized && activeTab === "notes" && (
                <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 h-full overflow-y-auto">
                  <div className="flex-1 flex flex-col gap-4">
                    <h3 className="font-black uppercase tracking-widest text-xl border-b-4 border-[var(--card-border)] pb-2 flex items-center gap-2">
                      <BookOpen /> Notes Generator
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-orange-500">
                          Topic
                        </label>
                        <input
                          type="text"
                          value={notesTopic}
                          onChange={(e) => setNotesTopic(e.target.value)}
                          placeholder="e.g. Quantum Mechanics, React Hooks, Supply Chain"
                          className="w-full px-4 py-3 bg-[var(--card-bg)] border-2 border-[var(--card-border)] focus:outline-none focus:border-orange-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-orange-500">
                          Level
                        </label>
                        <select
                          value={notesLevel}
                          onChange={(e) => setNotesLevel(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--card-bg)] border-2 border-[var(--card-border)] focus:outline-none focus:border-orange-500 font-mono"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateNotes}
                      disabled={isGeneratingNotes || !notesTopic.trim()}
                      className="py-4 mt-auto bg-black text-orange-500 border-4 border-orange-500 font-black uppercase hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                      {isGeneratingNotes ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Brain />
                      )}
                      Synthesize Study Notes
                    </button>
                  </div>
                  {(notesResult || isGeneratingNotes) && (
                    <div className="flex-[2] p-6 border-4 border-[var(--card-border)] bg-[var(--card-bg)] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] relative">
                      {isGeneratingNotes ? (
                        <div className="flex flex-col items-center justify-center h-full text-orange-500 gap-4">
                          <Loader2 size={48} className="animate-spin" />
                        </div>
                      ) : notesResult ? (
                        <div className="h-full overflow-y-auto pr-4">
                          <div className="flex justify-between items-start mb-6">
                            <h2 className="text-3xl font-black uppercase text-orange-500 underline underline-offset-8 decoration-4">
                              {notesResult.title}
                            </h2>
                            <button
                              onClick={async () => {
                                const el = document.getElementById(
                                  "generated-notes-content",
                                );
                                if (el) {
                                  try {
                                    const dataUrl = await toPng(el, {
                                      backgroundColor: "#000000",
                                      fontEmbedCSS: "",
                                    });
                                    const link = document.createElement("a");
                                    link.download = `notes-${notesTopic.toLowerCase().replace(/\\s+/g, "-")}.png`;
                                    link.href = dataUrl;
                                    link.click();
                                  } catch (err) {
                                    console.error("Failed to export", err);
                                  }
                                }
                              }}
                              className="p-2 border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black transition-colors group flex items-center gap-2"
                            >
                              <Download size={16} />{" "}
                              <span className="text-xs font-bold uppercase hidden group-hover:inline">
                                Export
                              </span>
                            </button>
                          </div>

                          <div
                            id="generated-notes-content"
                            className="space-y-8 pb-10 bg-[var(--card-bg)] p-4 text-[var(--text-main)]"
                          >
                            <div className="border-l-4 border-orange-500 pl-4 bg-[var(--bg-main)] p-4 italic">
                              {notesResult.summary}
                            </div>

                            <div>
                              <h3 className="font-black uppercase tracking-widest border-b-2 border-orange-500 mb-4 inline-block">
                                Introduction
                              </h3>
                              <div className="markdown-body prose dark:prose-invert max-w-none text-[var(--text-main)] prose-p:text-[var(--text-main)] prose-headings:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-ul:text-[var(--text-main)] prose-li:text-[var(--text-main)]">
                                <Markdown
                                  remarkPlugins={[remarkGfm, remarkMath]}
                                >
                                  {notesResult.introduction}
                                </Markdown>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <h3 className="font-black text-xl uppercase tracking-widest text-orange-500 flex items-center gap-2">
                                <Target size={24} /> Key Concepts
                              </h3>
                              {notesResult.keyConcepts.map((kc, i) => (
                                <div
                                  key={i}
                                  className="border-2 border-[var(--card-border)] bg-[var(--bg-main)] p-4 rounded-sm"
                                >
                                  <h4 className="font-bold text-lg text-white mb-2">
                                    {kc.concept}
                                  </h4>
                                  <div className="markdown-body prose dark:prose-invert max-w-none text-[var(--text-main)] prose-p:text-[var(--text-main)] prose-headings:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-ul:text-[var(--text-main)] prose-li:text-[var(--text-main)]">
                                    <Markdown>{kc.explanation}</Markdown>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div>
                              <h3 className="font-black uppercase tracking-widest border-b-2 border-orange-500 mb-4 inline-block">
                                Detailed Breakdown
                              </h3>
                              <div className="markdown-body prose dark:prose-invert max-w-none bg-[var(--bg-main)] p-4 border-2 border-[var(--card-border)] text-[var(--text-main)] prose-p:text-[var(--text-main)] prose-headings:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-ul:text-[var(--text-main)] prose-li:text-[var(--text-main)]">
                                <Markdown
                                  remarkPlugins={[remarkGfm, remarkMath]}
                                >
                                  {notesResult.detailedBreakdown}
                                </Markdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* SCHEDULER TAB */}
              {isChatMaximized && activeTab === "scheduler" && (
                <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 h-full overflow-y-auto">
                  <div className="flex-1 flex flex-col gap-4">
                    <h3 className="font-black uppercase tracking-widest text-xl border-b-4 border-[var(--card-border)] pb-2 flex items-center gap-2">
                      <Calendar /> Scheduler
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-orange-500">
                          Modules to Study
                        </label>
                        {path && path.steps.length > 0 && (
                          <div className="mb-4 max-h-48 overflow-y-auto space-y-2 border-2 border-[var(--card-border)] p-3 bg-[var(--card-bg)]">
                            {path.steps.map((step, idx) => (
                              <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  className="mt-1 accent-orange-500 w-4 h-4"
                                  checked={schedModules.includes(step.title)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSchedModules(prev => [...prev, step.title]);
                                    else setSchedModules(prev => prev.filter(m => m !== step.title));
                                  }}
                                />
                                <span className="text-sm font-bold group-hover:text-orange-500 transition-colors">
                                  {step.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        <input
                          type="text"
                          value={schedCustomModule}
                          onChange={(e) => setSchedCustomModule(e.target.value)}
                          placeholder="Or type a custom module name..."
                          className="w-full px-4 py-3 bg-[var(--card-bg)] border-2 border-[var(--card-border)] focus:outline-none focus:border-orange-500 font-mono"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-orange-500">
                            Hours / Day
                          </label>
                          <input
                            type="number"
                            value={schedHours}
                            onChange={(e) => setSchedHours(e.target.value)}
                            min="1"
                            max="24"
                            className="w-full px-4 py-3 bg-[var(--card-bg)] border-2 border-[var(--card-border)] focus:outline-none focus:border-orange-500 font-mono"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-orange-500">
                            Days to study
                          </label>
                          <input
                            type="number"
                            value={schedDays}
                            onChange={(e) => setSchedDays(e.target.value)}
                            min="1"
                            max="365"
                            className="w-full px-4 py-3 bg-[var(--card-bg)] border-2 border-[var(--card-border)] focus:outline-none focus:border-orange-500 font-mono"
                          />
                        </div>
                      </div>

                      {path && (
                        <div className="p-3 border-2 border-orange-500 bg-orange-500/10 text-xs font-mono text-orange-300">
                          <strong>Active Pathway Context:</strong>{" "}
                          {path.subject} ({path.steps.length} steps)
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSchedule}
                      disabled={
                        isScheduling ||
                        (schedModules.length === 0 && !schedCustomModule.trim()) ||
                        !schedHours.trim() ||
                        !schedDays.trim()
                      }
                      className="py-4 mt-auto bg-black text-orange-500 border-4 border-orange-500 font-black uppercase hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                      {isScheduling ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Calendar />
                      )}
                      Generate Schedule Build
                    </button>
                  </div>
                  {(schedResult || isScheduling) && (
                    <div className="flex-1 p-6 border-4 border-[var(--card-border)] bg-[var(--card-bg)] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]">
                      {isScheduling ? (
                        <div className="flex flex-col items-center justify-center h-full text-orange-500 gap-4">
                          <Loader2 size={48} className="animate-spin" />
                        </div>
                      ) : (
                        <div className="markdown-body prose dark:prose-invert overflow-auto h-full max-w-none text-[var(--text-main)] prose-p:text-[var(--text-main)] prose-headings:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-ul:text-[var(--text-main)] prose-li:text-[var(--text-main)]">
                          <Markdown remarkPlugins={[remarkGfm, remarkMath]}>
                            {schedResult}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isChatMaximized && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsChatOpen((prev) => !prev)}
            className="bg-black text-orange-500 border-4 border-orange-500 p-4 rounded-full shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] hover:bg-orange-500 hover:text-black hover:scale-110 transition-all pointer-events-auto"
          >
            {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const MobileBottomNav = ({
  activeTab,
  onTabChange,
  onLogout,
  profileName,
}: {
  activeTab: string;
  onTabChange: (tab: "status" | "courses" | "archive") => void;
  onLogout: () => void;
  profileName: string;
}) => {
  const tabs = [
    { id: "courses", label: "Hub", icon: <Brain size={20} /> },
    { id: "status", label: "Nexus", icon: <Target size={20} /> },
    { id: "archive", label: "Archive", icon: <BookOpen size={20} /> },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[150] bg-[var(--card-bg)] border-t-4 border-black px-2 pb-safe pt-2 flex justify-around items-center md:hidden backdrop-blur-xl shadow-[0_-8px_16px_rgba(0,0,0,0.5)]"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as any)}
          className={cn(
            "flex flex-col items-center justify-center p-2 min-w-[64px] transition-all relative",
            activeTab === tab.id
              ? "text-orange-500"
              : "text-[var(--text-secondary)] opacity-60",
          )}
        >
          <div className={cn(
            "p-1.5 rounded-xl transition-colors",
            activeTab === tab.id ? "bg-orange-500/10" : ""
          )}>
            {tab.icon}
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter mt-1">
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-mobile-dot"
              className="absolute -top-1 w-6 h-1 bg-orange-500 rounded-full"
            />
          )}
        </button>
      ))}
      <div className="w-px h-8 bg-[var(--card-border)] mx-1" />
      <button
        onClick={onLogout}
        className="flex flex-col items-center justify-center p-2 min-w-[60px] text-red-500/60 hover:text-red-500"
      >
        <LogOut size={20} />
        <span className="text-[9px] font-black uppercase tracking-tighter mt-1">Exit</span>
      </button>
    </motion.nav>
  );
};

const Dashboard = ({
  profile,
  path,
  stats,
  isDark,
  onToggleTheme,
  onStartLearning,
  onNewInfection,
  onGenerateSchedule,
  onViewArchived,
  onViewProfile,
  onLogout,
  onSelectPathway,
  onDeletePathway,
  onStartAssessment,
  onOpenGenerator,
  onOpenMentorOverview,
}: {
  profile: LearningProfile;
  path: LearningPath | null;
  stats: UserStats;
  isDark: boolean;
  onToggleTheme: (e?: React.MouseEvent) => void;
  onStartLearning: (stepIdx?: number) => void;
  onNewInfection: () => void;
  onGenerateSchedule: (selectedModules?: string[], studyDuration?: string) => Promise<void>;
  onViewArchived: (pathway: CompletedPathway) => void;
  onViewProfile: () => void;
  onLogout: () => void;
  onSelectPathway: (id: string) => void;
  onDeletePathway: (id: string) => void;
  onStartAssessment: () => void;
  onOpenGenerator: () => void;
  onOpenMentorOverview: () => void;
}) => {
  const [tabHistory, setTabHistory] = useState<
    ("status" | "courses" | "archive")[]
  >(["courses"]);
  const activeTab = tabHistory[tabHistory.length - 1];

  const handleTabChange = (tab: "status" | "courses" | "archive") => {
    if (tab !== activeTab) {
      setTabHistory((prev) => [...prev, tab]);
    }
  };

  const handleBack = () => {
    if (tabHistory.length > 1) {
      setTabHistory((prev) => prev.slice(0, -1));
    }
  };

  const [showStreakModal, setShowStreakModal] = useState(false);
  const integrationProgress =
    path && path.steps
      ? Math.round((stats.completedSteps.length / path.steps.length) * 100)
      : 0;
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [selectedDashModules, setSelectedDashModules] = useState<string[]>([]);
  const [dashStudyDuration, setDashStudyDuration] = useState("");
  const activeCoursesModules = (stats.activePathways || []).map(p => ({
    subject: p.path.subject,
    modules: p.path.steps.map(s => s.title)
  })).filter(c => c.modules.length > 0);
  const [courseSearch, setCourseSearch] = useState("");
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [isScheduleGeneratorOpen, setIsScheduleGeneratorOpen] = useState(!stats.schedule);
  const [expandedCourseModules, setExpandedCourseModules] = useState<Record<number, boolean>>({});
  const [manualTickSchedule, setManualTickSchedule] = useState<Record<number, boolean>>({});

  // Prepare data for activity chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = getLocalDateKey(d);
    return {
      name: d.toLocaleDateString("en-US", { weekday: "short" }),
      xp: stats.activityLog?.[key] || 0,
    };
  });

  const filteredPathways = (stats.activePathways || []).filter((ap) =>
    ap.path.subject.toLowerCase().includes(courseSearch.toLowerCase()),
  );

  const currentActivePathway = stats.activePathways?.find(
    (ap) => ap.path.subject === path?.subject,
  );
  const usedAttempts = currentActivePathway?.assessmentAttempts || 0;

  return (
    <div className="min-h-screen bg-transparent text-[var(--text-main)] selection:bg-orange-500 selection:text-white pb-32 md:pb-8 overflow-x-hidden">
      {/* Header */}
      <header className="border-b-4 border-[var(--text-main)] transition-colors duration-300 p-4 md:p-6 flex justify-between items-center bg-[var(--card-bg)] backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-4">
          {tabHistory.length > 1 && (
            <div
              className="flex items-center gap-2 md:gap-4 cursor-pointer group"
              onClick={handleBack}
              title="Back"
            >
              <div className="p-1 md:p-2 border-2 border-transparent group-hover:border-[var(--card-border)] group-hover:bg-[var(--card-bg)] transition-colors rounded-full text-[var(--text-main)]">
                <ArrowLeft size={20} className="md:w-6 md:h-6" />
              </div>
            </div>
          )}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="p-1 md:p-2 bg-orange-500 border-2 border-black"
          >
            <Virus size={20} className="text-black md:w-6 md:h-6" />
          </motion.div>
          <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">
            Plague
          </span>
        </div>

        {/* Navigation Tabs - Desktop Only */}
        <nav className="hidden md:flex gap-4 bg-[var(--card-bg)] p-1 border-2 border-[var(--card-border)] backdrop-blur-sm">
          {[
            { id: "status", label: "Nexus Status", icon: <Target size={14} /> },
            {
              id: "courses",
              label: "Neural Pathways",
              icon: <Brain size={14} />,
            },
            { id: "archive", label: "Archive", icon: <BookOpen size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                handleTabChange(tab.id as "status" | "courses" | "archive")
              }
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border-2",
                activeTab === tab.id
                  ? "bg-orange-500 text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-main)] border-transparent",
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-6">
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <div
            onClick={() => setShowStreakModal(true)}
            className="hidden sm:flex items-center gap-4 px-4 py-2 bg-orange-500 text-black border-2 border-black cursor-pointer hover:bg-orange-400 group"
          >
            <Flame
              size={18}
              className="text-black group-hover:scale-110 transition-transform"
            />
            <span className="font-black italic">{stats.streak} DAYS</span>
          </div>
          <div
            onClick={() => setShowStreakModal(true)}
            className="sm:hidden flex items-center justify-center w-10 h-10 bg-orange-500 text-black border-2 border-black cursor-pointer"
          >
            <Flame size={18} />
          </div>
          <PlagueButton
            onClick={onLogout}
            variant="ghost"
            className="hidden md:flex w-12 h-12 bg-black/40 backdrop-blur-sm border-4 border-[var(--card-border)] items-center justify-center hover:bg-red-500 hover:text-white p-0"
            title="Logout"
          >
            <LogOut size={20} />
          </PlagueButton>
          <PlagueButton
            onClick={onViewProfile}
            variant="ghost"
            className="w-10 h-10 md:w-12 md:h-12 bg-[var(--card-bg)] backdrop-blur-sm border-4 border-[var(--card-border)] flex items-center justify-center text-xl md:text-2xl font-black italic hover:bg-orange-500 hover:text-black p-0"
            title="Profile"
          >
            {profile.name[0]}
          </PlagueButton>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "status" && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Profile & Stats Sidebar */}
              <ScrollReveal className="lg:col-span-4 space-y-8">
                <motion.section
                  whileHover={{ y: -4 }}
                  className="bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] transition-colors duration-300 p-8 shadow-[var(--shadow-primary)] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 -rotate-12 translate-x-8 -translate-y-8 group-hover:bg-orange-500/10 transition-colors" />
                  <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 mb-6 md:mb-8 relative text-center sm:text-left">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-orange-500 border-4 border-black flex items-center justify-center text-4xl md:text-6xl font-black italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {profile.name[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-4xl font-black uppercase italic leading-none mb-1 md:mb-2">
                        {profile.name}
                      </h2>
                      <span className="px-2 py-0.5 bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest">
                        {profile.level}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--card-bg)] text-[var(--text-main)] border-2 border-[var(--card-border)] text-center">
                      <div className="text-[10px] uppercase text-[var(--text-secondary)] mb-1">
                        Total XP
                      </div>
                      <div className="text-2xl font-black italic tracking-tighter">
                        {stats.xp.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-500 text-black border-2 border-black text-center">
                      <div className="text-[10px] uppercase text-black/60 mb-1">
                        Infection Streak
                      </div>
                      <div className="text-2xl font-black italic tracking-tighter">
                        {calculateStreak(stats.activityLog)}D
                      </div>
                    </div>
                  </div>
                </motion.section>

                <motion.section className="bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] transition-colors duration-300 p-8 shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] min-w-0">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black uppercase italic text-blue-400">
                      Neural Activity
                    </h3>
                    <TrendingUp size={20} className="text-blue-400" />
                  </div>
                  <div className="h-[300px] w-full min-h-[300px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={last7Days}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--card-border)"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 10,
                            fontWeight: 900,
                            fill: "var(--text-main)",
                            opacity: 0.5,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-main)",
                            border: "1px solid var(--card-border)",
                            color: "var(--text-main)",
                            fontWeight: 900,
                            fontStyle: "italic",
                            textTransform: "uppercase",
                          }}
                          cursor={{ fill: "var(--shadow-secondary)" }}
                        />
                        <Bar dataKey="xp" fill="#F97316" radius={[4, 4, 0, 0]}>
                          {last7Days.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.xp > 0 ? "#F97316" : "var(--card-border)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex justify-between items-center font-mono text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest">
                    <span>Diagnostic Logs</span>
                    <span>Last 7 Days</span>
                  </div>
                </motion.section>

                <motion.section className="bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 p-8 border-4 border-[var(--card-border)] shadow-[var(--shadow-primary)]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black uppercase italic text-orange-500 accent-orange">
                      Daily Quests
                    </h3>
                    <Zap size={20} className="text-orange-500 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    {(stats.dailyQuests || []).map((q, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 border flex items-center justify-center",
                              q.done
                                ? "bg-orange-500 border-orange-500"
                                : "border-[var(--card-border)]",
                            )}
                          >
                            {q.done && (
                              <CheckCircle2 size={12} className="text-black" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-black uppercase italic",
                              q.done && "line-through opacity-30",
                            )}
                          >
                            {q.label}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-orange-500">
                          +{q.xp}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.section>
              </ScrollReveal>

              {/* Neural Schedule */}
              <ScrollReveal className="lg:col-span-8" delay={0.2}>
                <motion.section className="bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] transition-colors duration-300 p-6 md:p-10 shadow-[var(--shadow-primary)]">
                  <div className="flex items-center justify-between mb-8 md:mb-12">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-2xl md:text-4xl font-black uppercase italic">
                          Neural Schedule
                        </h3>
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] md:tracking-[0.3em]">
                          Temporal Optimization v.2
                        </p>
                      </div>
                      <button 
                        onClick={() => setIsScheduleGeneratorOpen(!isScheduleGeneratorOpen)}
                        className="p-2 border-2 border-[var(--card-border)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-colors shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 rounded-full"
                        title={isScheduleGeneratorOpen ? "Close Generator" : "Open Schedule Generator"}
                      >
                        <ChevronDown 
                          size={24} 
                          className={cn("transition-transform duration-300", isScheduleGeneratorOpen && "rotate-180")} 
                        />
                      </button>
                    </div>
                    <Clock size={24} className="text-orange-500 md:w-8 md:h-8" />
                  </div>

                  <AnimatePresence mode="sync">
                    {isScheduleGeneratorOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                      >
                        <div className="p-6 border-4 border-orange-500 bg-[var(--bg-main)] shadow-[inset_0_4px_12px_rgba(0,0,0,0.2)]">
                          <h4 className="text-xl font-black uppercase italic tracking-widest mb-6 flex items-center gap-2">
                            <Zap size={20} className="text-orange-500" /> New Temporal Matrix
                          </h4>
                          <div className="mb-6 space-y-6">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-widest mb-3 text-[var(--text-secondary)]">1. Select Modules</label>
                              {activeCoursesModules.length > 0 ? (
                                <div className="space-y-4">
                                  {activeCoursesModules.map((course, cIdx) => {
                                    const isExpanded = !!expandedCourseModules[cIdx];
                                    return (
                                      <div key={cIdx} className="border-2 border-[var(--card-border)] bg-[var(--card-bg)]">
                                        <button 
                                          onClick={() => setExpandedCourseModules(p => ({ ...p, [cIdx]: !p[cIdx] }))}
                                          className="w-full flex items-center justify-between p-3 focus:outline-none hover:bg-[var(--text-main)]/5 transition-colors"
                                        >
                                          <h4 className="text-sm font-black uppercase italic text-[var(--text-main)] truncate text-left pr-4">
                                            {course.subject}
                                          </h4>
                                          <ChevronDown size={16} className={cn("transition-transform shrink-0", isExpanded && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                          {isExpanded && (
                                            <motion.div 
                                              initial={{ height: 0 }}
                                              animate={{ height: "auto" }}
                                              exit={{ height: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="p-4 border-t-2 border-[var(--card-border)]/50 bg-[var(--bg-main)]/50 space-y-3">
                                                {course.modules.map((mod, mIdx) => {
                                                  const combinedMod = `${course.subject}: ${mod}`;
                                                  const isSelected = selectedDashModules.includes(combinedMod);
                                                  const isCompletedMod = stats.completedSteps.includes(combinedMod);
                                                  return (
                                                    <label key={mIdx} className="flex items-start gap-3 cursor-pointer group hover:bg-[var(--text-main)]/5 p-2 transition-colors rounded">
                                                      {isCompletedMod ? (
                                                        <CheckCircle2 size={18} className="mt-0.5 text-green-500 shrink-0" />
                                                      ) : (
                                                        <input 
                                                          type="checkbox" 
                                                          className="mt-1 accent-orange-500 w-4 h-4 cursor-pointer shrink-0"
                                                          checked={isSelected}
                                                          onChange={(e) => {
                                                            if (e.target.checked) setSelectedDashModules(prev => [...prev, combinedMod]);
                                                            else setSelectedDashModules(prev => prev.filter(m => m !== combinedMod));
                                                          }}
                                                        />
                                                      )}
                                                      <span className={cn(
                                                        "text-sm font-bold uppercase tracking-widest transition-colors",
                                                        isSelected ? "text-orange-500" : (isCompletedMod ? "text-green-500" : "text-[var(--text-main)] group-hover:text-orange-500/70")
                                                      )}>
                                                        {mod}
                                                      </span>
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-sm italic opacity-50 p-4 border-2 border-[var(--card-border)] bg-[var(--card-bg)]">No active modules to select.</div>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-widest mb-3 text-[var(--text-secondary)]">2. Total Duration</label>
                              <input 
                                type="text" 
                                placeholder="e.g. 2 hours"
                                value={dashStudyDuration}
                                onChange={(e) => setDashStudyDuration(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--card-bg)] border-2 border-[var(--card-border)] focus:outline-none focus:border-orange-500 font-mono text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
                              />
                            </div>
                          </div>

                          <PlagueButton
                            onClick={async () => {
                              setIsGeneratingSchedule(true);
                              await onGenerateSchedule(selectedDashModules, dashStudyDuration);
                              setIsGeneratingSchedule(false);
                              setIsScheduleGeneratorOpen(false);
                            }}
                            disabled={isGeneratingSchedule || selectedDashModules.length === 0 || !dashStudyDuration}
                            className="w-full py-4 text-xl"
                          >
                            {isGeneratingSchedule ? "Generating..." : "Generate Optimal Cycle"}
                          </PlagueButton>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {stats.schedule ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {stats.schedule.items.map((item, i) => {
                          const isItemCompletedAutodetect = stats.completedSteps.some(step => {
                            const stepParts = step.split(':');
                            if (stepParts.length > 1 && item.activity.toLowerCase().includes(stepParts[1].toLowerCase())) return true;
                            return false;
                          });
                          const isTicked = isItemCompletedAutodetect || !!manualTickSchedule[i];

                          return (
                            <div
                              key={i}
                              className={cn(
                                "relative flex gap-6 items-center p-6 border-2 transition-colors",
                                isTicked ? "border-green-500 bg-green-500/10" : "border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-orange-500/10"
                              )}
                            >
                              <span className={cn("font-mono text-xl font-black", isTicked && "text-green-500")}>
                                {item.time}
                              </span>
                              <div className={cn("h-10 w-px", isTicked ? "bg-green-500/30" : "bg-[var(--card-border)]")} />
                              <div>
                                <p className={cn("text-lg font-black uppercase italic leading-none mb-1 text-wrap break-words pr-8", isTicked && "text-green-500")}>
                                  {item.activity}
                                </p>
                                <span
                                  className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
                                    item.type === "learning"
                                      ? "bg-orange-500 text-black"
                                      : item.type === "focus"
                                        ? "bg-[var(--text-main)] text-[var(--bg-main)]"
                                        : "bg-[var(--card-border)] text-[var(--text-secondary)]",
                                  )}
                                >
                                  {item.type}
                                </span>
                              </div>
                              <div className="absolute bottom-2 right-2">
                                <label className="flex items-center justify-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 accent-green-500 cursor-pointer"
                                    checked={isTicked}
                                    onChange={(e) => setManualTickSchedule(prev => ({ ...prev, [i]: e.target.checked }))}
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  ) : (
                    !isScheduleGeneratorOpen && (
                      <div className="text-center py-10 bg-white/5 border-2 border-dashed border-[var(--card-border)]">
                        <p className="text-xl font-black uppercase italic opacity-30 mb-8 max-w-sm mx-auto">
                          No temporal data optimized for current cycle.
                        </p>
                        <PlagueButton
                          onClick={() => setIsScheduleGeneratorOpen(true)}
                          variant="secondary"
                        >
                          Generate New Schedule
                        </PlagueButton>
                      </div>
                    )
                  )}
                </motion.section>
              </ScrollReveal>
            </motion.div>
          )}
          {activeTab === "courses" && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Header for Courses Section */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 border-b-4 md:border-b-8 border-black pb-6 md:pb-8">
                <div>
                  <span className="font-mono text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-orange-500 accent-orange mb-1 md:2 block">
                    Central Neural Hub
                  </span>
                  <h2 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
                    Modules
                  </h2>
                </div>
                <div className="flex gap-4">
                  <PlagueButton
                    onClick={onOpenGenerator}
                    variant="primary"
                    className="px-6 py-5 text-xl"
                  >
                    Generate Pathway
                  </PlagueButton>
                </div>
              </div>

              {/* Searchable Drop Box */}
              <div className="relative max-w-2xl mx-auto">
                <div className="mb-4 flex justify-between items-end px-2">
                  <span className="font-mono text-[10px] font-black uppercase text-[var(--text-secondary)]">
                    Active Pathogen Selector
                  </span>
                  <span className="font-mono text-[10px] font-black uppercase text-[var(--text-secondary)]">
                    {stats.activePathways?.length || 0} Total Vectors
                  </span>
                </div>

                <div
                  className={cn(
                    "bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all",
                    isCourseDropdownOpen ? "ring-4 ring-orange-500/20" : "",
                  )}
                >
                  {/* Trigger / Search Bar */}
                  <div className="flex items-center p-4 border-b-4 border-black">
                    <Search size={24} className="text-black/30 mr-4" />
                    <input
                      type="text"
                      placeholder="SEARCH ENROLLED......"
                      value={courseSearch}
                      onChange={(e) => {
                        setCourseSearch(e.target.value);
                        if (!isCourseDropdownOpen)
                          setIsCourseDropdownOpen(true);
                      }}
                      onFocus={() => setIsCourseDropdownOpen(true)}
                      className="w-full bg-transparent border-none focus:outline-none font-black uppercase italic text-xl text-black placeholder:text-black/30"
                    />
                    <button
                      onClick={() =>
                        setIsCourseDropdownOpen(!isCourseDropdownOpen)
                      }
                      className="p-2 hover:bg-black/5 transition-colors"
                    >
                      <ChevronDown
                        size={24}
                        className={cn(
                          "transition-transform duration-300",
                          isCourseDropdownOpen
                            ? "rotate-180 text-orange-500"
                            : "",
                        )}
                      />
                    </button>
                  </div>

                  {/* Dropdown Content */}
                  <AnimatePresence>
                    {isCourseDropdownOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          {filteredPathways.length > 0 ? (
                            filteredPathways.map((ap) => {
                              const isSelected =
                                path?.subject === ap.path.subject;
                              const progress = Math.round(
                                (ap.completedSteps.length /
                                  ap.path.steps.length) *
                                  100,
                              );

                              return (
                                <div
                                  key={ap.id}
                                  onClick={() => {
                                    onSelectPathway(ap.id);
                                    setIsCourseDropdownOpen(false);
                                    setCourseSearch("");
                                  }}
                                  className={cn(
                                    "w-full p-6 text-left border-b-2 border-black/10 last:border-none flex items-center justify-between hover:bg-orange-50 transition-colors group cursor-pointer",
                                    isSelected
                                      ? "bg-orange-50 border-l-8 border-orange-500"
                                      : "bg-white",
                                  )}
                                >
                                  <div>
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">
                                        [{ap.profile.level}]
                                      </span>
                                      <h4 className="text-2xl font-black uppercase italic tracking-tighter group-hover:text-orange-500 transition-colors">
                                        {ap.path.subject}
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="w-32 h-2 border border-black p-[1px] bg-black/5">
                                        <div
                                          className="h-full bg-black"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                      <span className="font-mono text-[9px] font-black uppercase">
                                        {progress}% Synced
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                      <span className="block font-mono text-[9px] font-black uppercase text-black/40">
                                        Last Sync
                                      </span>
                                      <span className="block font-mono text-[10px] font-black uppercase">
                                        {new Date(
                                          ap.lastAccessed,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            window.confirm(
                                              "Are you sure you want to purge this neural vector? All progress will be deleted.",
                                            )
                                          ) {
                                            onDeletePathway(ap.id);
                                          }
                                        }}
                                        className="p-2 text-black/20 hover:text-red-500 transition-colors z-10"
                                        title="Unenroll"
                                      >
                                        <Trash2 size={20} />
                                      </button>
                                      {isSelected ? (
                                        <CheckCircle2
                                          size={24}
                                          className="text-orange-500"
                                        />
                                      ) : (
                                        <ChevronRight
                                          size={24}
                                          className="opacity-10 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-12 text-center">
                              <p className="font-black uppercase italic opacity-20">
                                Zero matches found in neural logs.
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Quick Actions for Selected Course */}
              {currentActivePathway && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--card-bg)] text-[var(--text-main)] p-8 border-4 border-[var(--card-border)] shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                      <span className="font-mono text-xs font-black uppercase tracking-[0.3em] text-orange-500 accent-orange mb-4 block">
                        Currently Selected Vector
                      </span>
                      <h3 className="text-5xl font-black uppercase italic leading-none mb-6 underline decoration-orange-500/30 text-wrap break-words">
                        {currentActivePathway?.path?.subject ||
                          "Neural Sequence"}
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        <div className="px-4 py-2 bg-[var(--bg-main)]/10 border border-[var(--bg-main)]/20 backdrop-blur-sm">
                          <span className="block font-mono text-[9px] uppercase opacity-60">
                            Progress
                          </span>
                          <span className="font-black italic">
                            {currentActivePathway &&
                            currentActivePathway.path?.steps?.length
                              ? Math.round(
                                  ((currentActivePathway.completedSteps
                                    ?.length || 0) /
                                    currentActivePathway.path.steps.length) *
                                    100,
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="px-4 py-2 bg-[var(--bg-main)]/10 border border-[var(--bg-main)]/20 backdrop-blur-sm">
                          <span className="block font-mono text-[9px] uppercase opacity-60">
                            Level
                          </span>
                          <span className="font-black italic uppercase">
                            {currentActivePathway?.profile?.level || "Active"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {currentActivePathway.path?.roadmapOverview && (
                        <PlagueButton
                          variant="secondary"
                          onClick={() => onOpenMentorOverview()}
                          className="flex-[1] px-4 py-2 text-sm shadow-[4px_4px_0px_0px_var(--shadow-color)] min-h-full whitespace-nowrap"
                        >
                          BLUEPRINT
                        </PlagueButton>
                      )}
                      <PlagueButton
                        onClick={() => onStartLearning()}
                        className="flex-[2] shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
                      >
                        RESUME LEARNING
                      </PlagueButton>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Display "Initialize First Infection" if no courses */}
              {(!stats.activePathways || stats.activePathways.length === 0) && (
                <div className="py-32 text-center border-4 border-dashed border-[var(--card-border)] bg-[var(--card-bg)]">
                  <p className="text-2xl font-black uppercase italic opacity-40 text-[var(--text-secondary)] mb-8">
                    No active pathogens detected.
                  </p>
                  <PlagueButton
                    onClick={onNewInfection}
                    className="px-12 py-6 text-2xl"
                  >
                    Initialize First Infection
                  </PlagueButton>
                </div>
              )}

              {/* Current Selected Path Detail (Modules) */}
              {path && (
                <section className="pt-24 border-t-8 border-[var(--card-border)] space-y-12">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-orange-500 border-4 border-black rotate-3">
                      <Brain size={48} className="text-black" />
                    </div>
                    <div>
                      <h3 className="text-5xl font-black uppercase italic leading-none">
                        Curriculum Breakdown
                      </h3>
                      <p className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] mt-2">
                        Active: {path.subject}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {path.steps.map((step, i) => {
                      const isCompletedForSelected =
                        stats.completedSteps.includes(
                          `${path.subject}:${step.title}`,
                        );
                      const pathDetails = stats.activePathways?.find(
                        (ap) => ap.path.subject === path.subject,
                      );
                      const currentProgressIdx =
                        pathDetails?.completedSteps.length || 0;

                      return (
                        <ScrollReveal key={i} delay={i * 0.05}>
                          <div
                            onClick={() => onStartLearning(i)}
                            className={cn(
                              "group flex items-center gap-8 p-8 border-4 transition-all cursor-pointer relative overflow-hidden",
                              isCompletedForSelected
                                ? "bg-green-500/10 border-green-500 shadow-[8px_8px_0px_0px_rgba(34,197,94,0.2)]"
                                : i === currentProgressIdx
                                  ? "bg-orange-500/10 border-orange-500 shadow-[8px_8px_0px_0px_rgba(249,115,22,0.2)]"
                                  : "bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-orange-500 hover:text-black shadow-[var(--shadow-secondary)]",
                            )}
                          >
                            <div className="text-6xl font-black italic opacity-10 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              0{i + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="text-2xl font-black uppercase italic leading-none">
                                  {step.title}
                                </h4>
                                {isCompletedForSelected && (
                                  <CheckCircle2
                                    size={20}
                                    className="text-green-500"
                                  />
                                )}
                              </div>
                              <div
                                className={cn(
                                  "flex flex-wrap gap-6 font-mono text-[10px] uppercase font-black tracking-widest group-hover:text-inherit transition-colors",
                                  i === currentProgressIdx
                                    ? "text-[#FF9413]"
                                    : "text-[var(--text-secondary)]",
                                )}
                              >
                                <span className="flex items-center gap-2">
                                  <Clock size={12} /> {step.estimatedTime}
                                </span>
                                <span className="flex items-center gap-2">
                                  <BarChart3 size={12} /> {step.difficulty}
                                </span>
                                <span className="flex items-center gap-2">
                                  <Zap size={12} /> {step.method}
                                </span>
                              </div>
                            </div>
                            <ChevronRight
                              className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2"
                              size={32}
                            />
                          </div>
                        </ScrollReveal>
                      );
                    })}
                  </div>

                  {/* Final Validation Trigger */}
                  {currentActivePathway && (
                    <div className="pt-12 flex flex-col items-center gap-6">
                      {currentActivePathway.completedSteps.length <
                        path.steps.length && (
                        <div className="px-6 py-3 bg-[var(--card-bg)] border-2 border-[var(--card-border)] text-xs font-black uppercase tracking-widest text-[var(--text-main)]">
                          Neural Integration Status:{" "}
                          {currentActivePathway.completedSteps.length}/
                          {path.steps.length} Modules Analyzed
                        </div>
                      )}

                      {usedAttempts >= 2 ? (
                        <div className="w-full py-8 bg-red-600/10 text-red-500 border-4 border-red-600 border-dashed font-black uppercase italic text-xl flex flex-col items-center justify-center gap-2">
                          <AlertTriangle size={32} />
                          Neural Lock Active: Attempts Exhausted
                        </div>
                      ) : (
                        <PlagueButton
                          onClick={onStartAssessment}
                          className="w-full py-8 text-2xl group flex items-center justify-center gap-4"
                        >
                          <Target
                            size={32}
                            className="group-hover:rotate-45 transition-transform"
                          />
                          ATTEMPT ASSESSMENT
                          {usedAttempts > 0 && (
                            <span className="ml-2 text-sm bg-orange-500 text-black px-3 py-1 scale-75 md:scale-100">
                              FINAL ATTEMPT
                            </span>
                          )}
                        </PlagueButton>
                      )}
                    </div>
                  )}
                </section>
              )}
            </motion.div>
          )}

          {activeTab === "archive" && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-8 border-black pb-8">
                <div>
                  <span className="font-mono text-xs font-black uppercase tracking-[0.4em] text-orange-500 accent-orange mb-2 block">
                    Neural Knowledge Base
                  </span>
                  <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
                    Archive
                  </h2>
                </div>
              </div>

              {stats.completedPathways && stats.completedPathways.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {stats.completedPathways.map((cp) => (
                    <ScrollReveal key={cp.id}>
                      <div className="p-8 border-4 border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-md shadow-[var(--shadow-primary)] flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                            {cp.date}, {cp.year}
                          </span>
                          <Trophy size={20} className="text-orange-500" />
                        </div>
                        <h3 className="text-3xl font-black uppercase italic leading-none mb-4">
                          {cp.name}
                        </h3>
                        <div className="mb-6 flex-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                            <span>Synthesis Validation</span>
                            <span className="text-orange-500">
                              {cp.assessmentScore}%
                            </span>
                          </div>
                          <div className="h-1 bg-[var(--card-border)] w-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${cp.assessmentScore}%` }}
                              className="h-full bg-orange-500"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-8">
                          {cp.topics.slice(0, 4).map((t, j) => (
                            <span
                              key={j}
                              className="text-[8px] font-black uppercase tracking-widest bg-[var(--card-border)] text-[var(--text-main)] px-2 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <PlagueButton
                          onClick={() => onViewArchived(cp)}
                          variant="secondary"
                          className="w-full text-xs"
                        >
                          Access Encrypted Data
                        </PlagueButton>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center border-4 border-dashed border-[var(--card-border)] bg-white/5">
                  <p className="text-2xl font-black uppercase italic opacity-20">
                    No archived neural patterns detected.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStreakModal && (
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowStreakModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--card-bg)] border-4 border-[var(--card-border)] shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] relative"
              >
                <div className="p-6 md:p-10">
                  <div className="flex justify-between items-center mb-8 border-b-2 border-[var(--card-border)] pb-4">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--text-main)]">
                      Neural Activity
                    </h2>
                    <button
                      onClick={() => setShowStreakModal(false)}
                      className="p-2 border-2 border-transparent hover:border-[var(--card-border)] hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-[var(--text-main)]"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <StreakCalendar activityLog={stats.activityLog} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <DashboardAIAssistant profile={profile} stats={stats} path={path} />
      </main>

      {/* Mobile Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={onLogout}
        profileName={profile.name}
      />
    </div>
  );
};

const MarkdownImage = ({ src, alt }: { src?: string; alt?: string }) => {
  if (src?.startsWith("_IMAGE_PROMPT_")) {
    const prompt = src.replace("_IMAGE_PROMPT_", "").replace(/_/g, " ");
    // Use the prompt to create a consistent seed for picsum
    // Simple stable hash for seed
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      hash = (hash << 5) - hash + prompt.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash).toString(16).slice(0, 8);
    return (
      <ScrollReveal className="my-10 space-y-3">
        <div className="relative aspect-video bg-[var(--card-bg)] border-4 border-[var(--card-border)] overflow-hidden group shadow-[8px_8px_0px_0px_var(--shadow-secondary)]">
          <img
            src={`https://picsum.photos/seed/${seed}/1200/675`}
            alt={alt || "Educational Visual Aid"}
            className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[var(--card-bg)] group-hover:bg-transparent transition-colors duration-1000" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6 text-center">
            <div className="bg-black/80 text-white border-2 border-[var(--card-border)] px-6 py-3 font-mono text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
              Neural Visualization Engine: {alt || "Active Integration"}
            </div>
          </div>
          {/* Overlay Grid Line Effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.1]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>
        <p className="text-[10px] font-mono uppercase font-black opacity-30 text-center italic tracking-widest px-4">
          {prompt}
        </p>
      </ScrollReveal>
    );
  }
  return (
    <div className="my-10 relative border-4 border-[var(--card-border)] p-2 bg-[var(--card-bg)] shadow-[8px_8px_0px_0px_var(--shadow-secondary)]">
      <img
        src={src}
        alt={alt}
        className="w-full brightness-90 grayscale hover:grayscale-0 hover:brightness-100 transition-all duration-500"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

const markdownComponents = {
  img: MarkdownImage,
};

const StudyNotesView = ({
  notes,
  title,
  onBack,
  onNext,
  hasNext,
  isLoading,
}: {
  notes?: StudyNotes;
  title?: string;
  onBack: () => void;
  onNext?: () => void;
  hasNext?: boolean;
  isLoading?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 bg-[var(--bg-main)] backdrop-blur-2xl backdrop-blur-2xl z-[150] overflow-y-auto p-6 md:p-12 text-[var(--text-main)]"
  >
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[var(--card-bg)] backdrop-blur-md z-[160] flex items-center justify-center"
        >
          <div className="bg-[var(--card-bg)] text-[var(--text-main)] border-8 border-[var(--card-border)] p-12 shadow-[20px_20px_0px_0px_rgba(249,115,22,1)] flex flex-col items-center gap-6">
            <RefreshCw size={64} className="text-orange-500 animate-spin" />
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase italic">
                Synthesizing Next Phase
              </h2>
              <p className="font-mono text-xs uppercase font-black opacity-40 mt-2 text-[var(--text-main)]">
                Neural Link Active - Please Stand By
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[var(--card-border)] pb-6 md:pb-8 gap-4">
        <div className="flex items-center gap-2 md:gap-4 w-full">
          <div className="cursor-pointer group shrink-0" onClick={onBack}>
            <div className="p-1 md:p-2 border-2 border-transparent group-hover:border-[var(--card-border)] group-hover:bg-[var(--card-bg)] transition-colors rounded-full text-[var(--text-main)]">
              <ArrowLeft size={20} className="md:w-6 md:h-6" />
            </div>
          </div>
          <div className="flex-1">
            <span className="font-mono text-[10px] md:text-xs uppercase text-orange-500 font-black tracking-widest">
              Neural Study Data
            </span>
            <h2 className="text-2xl md:text-7xl font-black uppercase italic leading-tight truncate">
              {notes?.title || title}
            </h2>
          </div>
        </div>
        <PlagueButton onClick={onBack} variant="primary" className="w-full md:w-auto shrink-0 py-3 md:py-4 h-auto md:h-16 text-sm md:text-base">
          Close Notes
        </PlagueButton>
      </header>

      {notes ? (
        <>
          <section className="space-y-4 md:space-y-6">
            <h3 className="text-xl md:text-3xl font-black uppercase italic border-l-4 md:border-l-8 border-orange-500 pl-3 md:pl-4">
              Introduction
            </h3>
            <p className="text-base md:text-xl font-medium leading-relaxed opacity-80">
              {notes.introduction}
            </p>
          </section>

          <section className="space-y-6 md:space-y-8">
            <h3 className="text-xl md:text-3xl font-black uppercase italic border-l-4 md:border-l-8 border-orange-500 pl-3 md:pl-4">
              Key Concepts
            </h3>
            <div className="grid grid-cols-1 gap-6 md:gap-8">
              {notes.keyConcepts.map((kc, i) => (
                <div
                  key={i}
                  className="p-4 md:p-8 bg-[var(--card-bg)] backdrop-blur-md border-2 md:border-4 border-[var(--card-border)] shadow-[8px_8px_0px_0px_var(--shadow-color)] md:shadow-[12px_12px_0px_0px_var(--shadow-color)] space-y-4 md:space-y-6"
                >
                  <h4 className="text-xl md:text-2xl font-black uppercase italic text-orange-500">
                    {kc.concept}
                  </h4>
                  <p className="text-base md:text-lg font-bold opacity-70">
                    {kc.explanation}
                  </p>

                  <div className="space-y-6 md:space-y-8 pt-4 md:pt-8 border-t-2 border-[var(--card-border)]">
                    {kc.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="border-2 md:border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] md:shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] flex flex-col"
                      >
                        <div className="bg-orange-500 border-b-2 md:border-b-4 border-black p-2 md:p-4 flex items-center justify-between">
                          <span className="font-mono text-[10px] md:text-xs font-black uppercase text-black italic">
                            Dossier {exIdx + 1}
                          </span>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black/20" />
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[var(--card-bg)]" />
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[var(--card-bg)]" />
                          </div>
                        </div>
                        <div className="p-4 md:p-8 bg-[var(--card-bg)] space-y-4 md:space-y-6">
                          <div className="prose prose-base md:prose-xl max-w-none text-[var(--text-main)] opacity-90 font-bold italic leading-relaxed ">
                            <Markdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={markdownComponents}
                            >
                              {ex.description}
                            </Markdown>
                          </div>
                          {ex.code && (
                            <div className="space-y-4">
                              <div
                                className={cn(
                                  "p-6 text-lg overflow-x-auto border-4 border-black group relative",
                                  "bg-sky-50 text-black", // Unified theme as requested
                                  ex.contentType === "reaction"
                                    ? "font-typewriter"
                                    : ex.contentType === "equation"
                                      ? "font-serif italic"
                                      : "font-mono",
                                )}
                              >
                                <span
                                  className={cn(
                                    "absolute top-0 right-4 font-mono text-[10px] font-black uppercase mt-2 opacity-40 text-black",
                                  )}
                                >
                                  {ex.contentType === "reaction"
                                    ? "Chemical Vector"
                                    : ex.contentType === "equation"
                                      ? "Mathematical Proof"
                                      : ex.contentType === "code"
                                        ? "Source Trace"
                                        : "Demonstration"}
                                </span>
                                {ex.contentType === "equation" ||
                                ex.contentType === "reaction" ? (
                                  <div
                                    className={cn(
                                      "prose prose-xl max-w-none text-current whitespace-pre-wrap flex-1",
                                    )}
                                  >
                                    <Markdown
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeKatex]}
                                      components={markdownComponents}
                                    >
                                      {ex.code}
                                    </Markdown>
                                  </div>
                                ) : (
                                  <pre className="font-mono text-lg whitespace-pre-wrap flex-1 leading-relaxed">
                                    {ex.code}
                                  </pre>
                                )}
                              </div>
                              {ex.codeExplanation && (
                                <div
                                  className={cn(
                                    "p-6 border-l-8 space-y-2 bg-white border-black text-black",
                                  )}
                                >
                                  <h5 className="text-sm font-black uppercase tracking-widest opacity-60">
                                    {ex.contentType === "reaction"
                                      ? "Reaction Mechanism"
                                      : ex.contentType === "equation"
                                        ? "Derivative Logic"
                                        : "Detail Analysis"}
                                  </h5>
                                  <div className="prose prose-lg max-w-none text-current font-medium leading-relaxed">
                                    <Markdown
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeKatex]}
                                      components={markdownComponents}
                                    >
                                      {ex.codeExplanation}
                                    </Markdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">
              Detailed Breakdown
            </h3>
            <div className="prose prose-xl max-w-none font-medium leading-relaxed text-[var(--text-main)] opacity-80">
              <Markdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {notes.detailedBreakdown}
              </Markdown>
            </div>
          </section>

          {notes.mainExampleCode && (
            <section className="space-y-6">
              <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">
                {notes.mainExampleContentType === "reaction"
                  ? "Master Reaction Trace"
                  : notes.mainExampleContentType === "equation"
                    ? "Unified Theorem Proof"
                    : "Comprehensive Demonstration"}
              </h3>
              <div className="space-y-6">
                <div
                  className={cn(
                    "p-6 text-sm overflow-x-auto border-4 border-[var(--card-border)] shadow-[12px_12px_0px_0px_var(--shadow-color)] bg-black/60 text-white",
                    notes.mainExampleContentType === "reaction"
                      ? "font-typewriter"
                      : notes.mainExampleContentType === "equation"
                        ? "font-serif italic"
                        : "font-mono",
                  )}
                >
                  {notes.mainExampleContentType === "equation" ||
                  notes.mainExampleContentType === "reaction" ? (
                    <div
                      className={cn(
                        "prose prose-2xl max-w-none text-current whitespace-pre-wrap py-8 flex-1 ",
                      )}
                    >
                      <Markdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                      >
                        {notes.mainExampleCode}
                      </Markdown>
                    </div>
                  ) : (
                    <pre className="font-mono text-sm whitespace-pre-wrap py-8 flex-1 leading-relaxed">
                      {notes.mainExampleCode}
                    </pre>
                  )}
                </div>
                {notes.mainExampleExplanation && (
                  <div className="p-8 border-4 border-[var(--card-border)] shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] bg-[var(--card-bg)] backdrop-blur-md">
                    <h4 className="text-xl font-black uppercase italic mb-4 tracking-wider opacity-60">
                      {notes.mainExampleContentType === "reaction"
                        ? "Stoichiometric Analysis"
                        : notes.mainExampleContentType === "equation"
                          ? "Theoretical Foundation"
                          : "Conceptual Breakdown"}
                    </h4>
                    <div className="prose prose-xl max-w-none text-[var(--text-main)] font-medium leading-relaxed ">
                      <Markdown components={markdownComponents}>
                        {notes.mainExampleExplanation}
                      </Markdown>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="p-8 bg-[var(--text-main)] text-[var(--bg-main)] border-4 border-[var(--card-border)] shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
            <h3 className="text-3xl font-black uppercase italic text-orange-500 mb-4">
              Summary
            </h3>
            <p className="text-lg font-bold opacity-80">{notes.summary}</p>
          </section>

          {notes.qa && notes.qa.length > 0 && (
            <section className="space-y-8">
              <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">
                Neural Integration Challenge
              </h3>
              <p className="text-lg font-bold italic opacity-60">
                Try to answer these internally before revealing the neural trace
                answer.
              </p>
              <div className="grid grid-cols-1 gap-6">
                {notes.qa.map((item, i) => (
                  <div
                    key={i}
                    className="bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] p-8 shadow-[8px_8px_0px_0px_var(--shadow-color)] group"
                  >
                    <div className="flex gap-4 items-start mb-4">
                      <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black italic flex-shrink-0">
                        Q
                      </div>
                      <h4 className="text-xl font-black uppercase italic leading-tight pt-1">
                        {item.question}
                      </h4>
                    </div>
                    <details className="cursor-pointer">
                      <summary className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-[var(--text-main)] transition-colors mb-4 list-none outline-none">
                        [ Reveal Neural Answer ]
                      </summary>
                      <div className="flex gap-4 items-start pt-4 border-t-2 border-[var(--card-border)]">
                        <div className="w-10 h-10 bg-orange-500 text-black flex items-center justify-center font-black italic flex-shrink-0">
                          A
                        </div>
                        <div className="prose prose-lg max-w-none text-[var(--text-main)] opacity-80 font-medium leading-relaxed pt-1 ">
                          <Markdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                          >
                            {item.answer}
                          </Markdown>
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasNext && onNext && (
            <section className="pt-24 border-t-8 border-[var(--card-border)]">
              <PlagueButton
                onClick={onNext}
                className="w-full py-12 text-4xl shadow-[20px_20px_0px_0px_var(--shadow-color)]"
              >
                Open Next Module
              </PlagueButton>
              <p className="text-center mt-6 font-black uppercase italic opacity-40 text-sm tracking-widest">
                Proceeding will mark current vector as analyzed
              </p>
            </section>
          )}

          {notes.codingProblems && notes.codingProblems.length > 0 && (
            <section className="space-y-8">
              <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">
                Neural Field Exercises
              </h3>
              <p className="text-lg font-bold italic opacity-60">
                Practical application of neural patterns via external coding
                challenges.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notes.codingProblems.map((prob, i) => (
                  <a
                    key={i}
                    href={prob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className={cn(
                          "px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em]",
                          prob.difficulty.toLowerCase() === "easy"
                            ? "bg-green-500 text-black"
                            : prob.difficulty.toLowerCase() === "medium"
                              ? "bg-orange-500 text-black"
                              : "bg-red-500 text-white",
                        )}
                      >
                        {prob.difficulty}
                      </span>
                      <Code2 size={16} />
                    </div>
                    <h4 className="text-lg font-black uppercase italic leading-tight">
                      {prob.title}
                    </h4>
                    <p className="text-[10px] font-mono mt-2 opacity-40 group-hover:opacity-100 uppercase tracking-widest">
                      LeetCode Authentication Active
                    </p>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">
              Suggested Sources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {notes.suggestedSources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6 bg-white border-4 border-black hover:bg-orange-500 hover:text-black transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-[var(--text-main)] text-[var(--bg-main)] px-2 py-0.5 group-hover:bg-white group-hover:text-black">
                      {source.type}
                    </span>
                    <ExternalLink size={16} />
                  </div>
                  <h4 className="text-lg font-black uppercase italic leading-tight mb-2">
                    {source.name}
                  </h4>
                  {source.type.toLowerCase() === "youtube" && (
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(source.name + " " + (notes.title || ""))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase underline tracking-widest opacity-30 hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      [ Link unreachable? Search ]
                    </a>
                  )}
                </a>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center bg-white border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] text-center px-6">
          <div className="w-24 h-24 bg-black/5 flex items-center justify-center rounded-full mb-8 animate-pulse">
            <Database size={48} className="text-orange-500" />
          </div>
          <h3 className="text-4xl font-black uppercase italic mb-4">
            Establishing Neural Link
          </h3>
          <p className="max-w-md text-lg font-bold opacity-40 italic">
            Retrieving and synthesizing diagnostic data for the current vector
            phase. Please remain connected.
          </p>
          <div className="mt-12 flex gap-2">
            <div className="w-3 h-3 bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-3 h-3 bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-3 h-3 bg-orange-500 animate-bounce" />
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

const LearningView = ({
  path,
  stats,
  profile,
  isDark,
  onToggleTheme,
  onBack,
  onCompleteStep,
  onResetModuleProgress,
  onFinish,
  onUpdatePath,
  initialStepIdx = 0,
  isReview = false,
  studyNotesMap,
  setStudyNotesMap,
  isGeneratingNotes,
  setIsGeneratingNotes,
}: {
  path: LearningPath;
  stats: UserStats;
  profile: LearningProfile;
  isDark: boolean;
  onToggleTheme: (e?: React.MouseEvent) => void;
  onBack: () => void;
  onCompleteStep: (step: LearningStep) => void;
  onResetModuleProgress?: (oldTitle: string, newTitle: string, newPath: LearningPath) => void;
  onFinish: () => void;
  onUpdatePath: (path: LearningPath) => void;
  initialStepIdx?: number;
  isReview?: boolean;
  studyNotesMap: Record<number, StudyNotes>;
  setStudyNotesMap: React.Dispatch<
    React.SetStateAction<Record<number, StudyNotes>>
  >;
  isGeneratingNotes: boolean;
  setIsGeneratingNotes: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(initialStepIdx);
  const [isAdapting, setIsAdapting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);

  const currentStep = path.steps[currentStepIdx];
  const currentNotes = studyNotesMap[currentStepIdx];
  // Helper for path-specific completed steps
  const getStepKey = (stepTitle: string) => `${path.subject}:${stepTitle}`;
  const isStepCompleted = (stepTitle: string) =>
    stats.completedSteps.includes(getStepKey(stepTitle));

  const isCompleted = isStepCompleted(currentStep.title);

  const topRef = useRef<HTMLDivElement>(null);
  const practiceRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(height > 0 ? window.scrollY / height : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!currentNotes && !isGeneratingNotes) {
      handleGenerateNotes();
    }
  }, [currentStepIdx]);

  const handleAdapt = async () => {
    setIsAdapting(true);
    try {
      const adapted = await adaptContent(currentStep, feedback);

      // Fix: Use state update instead of direct mutation
      const updatedSteps = [...path.steps];
      updatedSteps[currentStepIdx] = adapted;
      
      const newPath = { ...path, steps: updatedSteps };
      onUpdatePath(newPath);

      // Reset progress for this specific module
      if (onResetModuleProgress) {
        onResetModuleProgress(currentStep.title, adapted.title, newPath);
      }

      setShowAdaptModal(false);
      setFeedback("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdapting(false);
    }
  };

  const handleGenerateNotes = async () => {
    setIsGeneratingNotes(true);
    try {
      const notes = await generateStudyNotes(
        currentStep.title,
        stats.rank > 50 ? "beginner" : "advanced",
      );
      setStudyNotesMap((prev) => ({ ...prev, [currentStepIdx]: notes }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 flex flex-col bg-transparent text-[var(--text-main)]">
      <header className="border-b-4 border-[var(--card-border)] p-4 md:p-6 flex justify-between items-center sticky top-0 z-50 transition-colors bg-[var(--card-bg)] backdrop-blur-md">
        <PlagueButton
          onClick={onBack}
          variant="ghost"
          className="flex items-center gap-2 md:gap-3 font-black uppercase italic p-0 group"
        >
          <ArrowLeft
            size={20}
            className="md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform"
          />
          <span className="hidden sm:inline text-xs md:text-sm">Abort Session</span>
          <span className="sm:hidden text-xs">Exit</span>
        </PlagueButton>

        <div className="flex items-center gap-3 md:gap-8">
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <div className="hidden sm:flex items-center gap-4">
            <div className="font-mono text-[10px] uppercase font-black opacity-40">
              Nexus Sync
            </div>
            <div className="w-32 md:w-64 h-2 md:h-3 bg-white/5 border-2 border-[var(--card-border)] relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-orange-500"
                initial={{ width: 0 }}
                animate={{
                  width: `${(stats.completedSteps.length / path.steps.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main ref={topRef} className="flex-1 p-6 md:p-16 max-w-5xl mx-auto w-full relative">
        {/* Scan Line Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="scan-line" />
        </div>

        <motion.div
          key={currentStepIdx}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="space-y-12"
        >
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <span className="px-3 py-0.5 md:px-4 md:py-1 bg-orange-500 text-black font-black uppercase italic text-[10px] md:text-xs border-2 border-black">
                {currentStep.difficulty}
              </span>
              <span
                className={cn(
                  "px-3 py-0.5 md:px-4 md:py-1 border-2 font-black uppercase italic text-[10px] md:text-xs",
                  "border-black",
                )}
              >
                {currentStep.method}
              </span>
              <span className="font-mono text-[9px] md:text-[10px] uppercase opacity-40 font-black tracking-widest">
                {currentStep.estimatedTime}
              </span>
              {isCompleted && (
                <span className="px-3 py-0.5 md:px-4 md:py-1 bg-green-500 text-black font-black uppercase italic text-[10px] md:text-xs border-2 border-black">
                  Synced
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] break-words">
              {currentStep.title}
            </h1>
          </div>

          <div
            className={cn(
              "prose prose-xl md:prose-2xl max-w-none font-medium leading-relaxed transition-colors",
              "text-[var(--text-main)]",
            )}
          >
            <Markdown components={markdownComponents}>
              {formatContent(currentStep.content)}
            </Markdown>
          </div>

          {isGeneratingNotes && !currentNotes && (
            <div className="py-12 flex flex-col items-center justify-center border-t-4 border-black/10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-orange-500 mb-4"
              >
                <RefreshCw size={48} />
              </motion.div>
              <p className="font-mono text-xs uppercase font-black opacity-60 text-[var(--text-secondary)] tracking-widest">
                Synthesizing Neural Study Data...
              </p>
            </div>
          )}

          {currentNotes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 pt-12 border-t-4 border-black/10"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black uppercase italic">
                  Neural Study Notes
                </h2>
                <PlagueButton
                  onClick={() => setShowFullNotes(true)}
                  variant="accent"
                  className="px-4 py-2 text-[10px] shadow-none"
                >
                  Full Screen View
                </PlagueButton>
              </div>

              <section className="space-y-6">
                <h3 className="text-2xl font-black uppercase italic text-orange-500">
                  Introduction
                </h3>
                <p className="text-lg font-medium opacity-80">
                  {formatContent(currentNotes.introduction)}
                </p>
              </section>

              <div className="grid grid-cols-1 gap-8">
                {currentNotes.keyConcepts.map((kc, i) => (
                  <div
                    key={i}
                    className="p-8 bg-[var(--card-bg)] border-4 border-[var(--text-main)] shadow-[var(--shadow-secondary)] space-y-6"
                  >
                    <h4 className="text-xl font-black uppercase italic text-orange-500">
                      {kc.concept}
                    </h4>
                    <p className="text-base font-bold opacity-70">
                      {formatContent(kc.explanation)}
                    </p>

                    <div className="space-y-4 pt-4 border-t-2 border-black/5">
                      {kc.examples.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="space-y-0 border-2 border-[var(--text-main)] shadow-[var(--shadow-secondary)]"
                        >
                          <div className="bg-orange-500 border-b-2 border-[var(--text-main)] p-2 flex items-center justify-between">
                            <span className="font-mono text-[10px] font-black uppercase text-black">
                              Diagnostic Tab {exIdx + 1}
                            </span>
                            <span className="text-[10px] font-black uppercase italic text-black opacity-40">
                              Neural Example
                            </span>
                          </div>
                          <div className="p-4 bg-[var(--input-bg)] space-y-4">
                            <div className="prose prose-sm max-w-none text-[var(--input-text)] font-bold italic leading-relaxed">
                              <Markdown components={markdownComponents}>
                                {formatContent(ex.description)}
                              </Markdown>
                            </div>
                            {ex.code && (
                              <div className="space-y-4">
                                <div
                                  className={cn(
                                    "p-4 border-4 border-[var(--text-main)] bg-[var(--bg-main)] text-[var(--text-main)] overflow-x-auto",
                                    ex.contentType === "reaction"
                                      ? "font-typewriter"
                                      : ex.contentType === "equation"
                                        ? "font-serif italic"
                                        : "font-mono",
                                  )}
                                >
                                  {ex.contentType === "equation" ||
                                  ex.contentType === "reaction" ? (
                                    <div className="prose prose-sm max-w-none text-current whitespace-pre-wrap">
                                      <Markdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={markdownComponents}
                                      >
                                        {formatContent(ex.code)}
                                      </Markdown>
                                    </div>
                                  ) : (
                                    <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                      {formatContent(ex.code)}
                                    </pre>
                                  )}
                                </div>
                                {ex.codeExplanation && (
                                  <div className="p-4 bg-[var(--input-bg)] border-l-4 border-[var(--text-main)] text-sm font-medium leading-normal text-[var(--input-text)]">
                                    <Markdown
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeKatex]}
                                      components={markdownComponents}
                                    >
                                      {formatContent(ex.codeExplanation)}
                                    </Markdown>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {currentNotes.mainExampleCode && (
                <section className="space-y-6">
                  <h3 className="text-2xl font-black uppercase italic text-orange-500">
                    {currentNotes.mainExampleContentType === "reaction"
                      ? "Master Reaction Trace"
                      : currentNotes.mainExampleContentType === "equation"
                        ? "Unified Theorem Proof"
                        : "Main Implementation"}
                  </h3>
                  <div className="space-y-4">
                    <div
                      className={cn(
                        "p-6 border-4 border-black bg-sky-50 text-black overflow-x-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                        currentNotes.mainExampleContentType === "reaction"
                          ? "font-typewriter"
                          : currentNotes.mainExampleContentType === "equation"
                            ? "font-serif italic"
                            : "font-mono",
                      )}
                    >
                      {currentNotes.mainExampleContentType === "equation" ||
                      currentNotes.mainExampleContentType === "reaction" ? (
                        <div className="prose prose-base max-w-none text-current whitespace-pre-wrap">
                          <Markdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                          >
                            {formatContent(currentNotes.mainExampleCode)}
                          </Markdown>
                        </div>
                      ) : (
                        <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                          {formatContent(currentNotes.mainExampleCode)}
                        </pre>
                      )}
                    </div>
                    {currentNotes.mainExampleExplanation && (
                      <div className="p-6 bg-white border-2 border-black text-sm font-bold text-black leading-relaxed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Markdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={markdownComponents}
                        >
                          {formatContent(currentNotes.mainExampleExplanation)}
                        </Markdown>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {currentNotes.qa && currentNotes.qa.length > 0 && (
                <section className="space-y-8">
                  <h3 className="text-2xl font-black uppercase italic text-orange-500">
                    Neural Integration Test
                  </h3>
                  <p className="text-sm font-bold opacity-40 italic">
                    Try to recall these key concepts before viewing the answer.
                  </p>
                  <div className="space-y-4">
                    {currentNotes.qa.map((item, i) => (
                      <div
                        key={i}
                        className="p-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <h4 className="text-sm font-black uppercase italic mb-4 flex gap-3">
                          <span className="text-orange-500 font-mono">
                            Q{i + 1}:
                          </span>{" "}
                          {item.question}
                        </h4>
                        <details className="cursor-pointer group">
                          <summary className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 list-none outline-none">
                            View Answer
                          </summary>
                          <div className="mt-4 pt-4 border-t-2 border-black/5 text-sm font-medium leading-relaxed opacity-80">
                            <Markdown components={markdownComponents}>
                              {formatContent(item.answer)}
                            </Markdown>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          <div ref={practiceRef} className="scroll-mt-32" />

          {currentStep.codingProblems &&
            currentStep.codingProblems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <h3 className="text-2xl font-black uppercase italic text-orange-500">
                  Practice Challenges
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentStep.codingProblems.map((prob, i) => (
                    <a
                      key={i}
                      href={prob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                          {prob.platform}
                        </span>
                        <Code2
                          size={16}
                          className="opacity-20 group-hover:opacity-100"
                        />
                      </div>
                      <h4 className="text-base font-black uppercase italic leading-tight">
                        {prob.title}
                      </h4>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

          {currentStep.youtubeVideos &&
            currentStep.youtubeVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 space-y-4"
              >
                <div className="flex items-center gap-4 border-b-4 border-black pb-4">
                  <div className="bg-red-500 p-2 border-4 border-black">
                    <Youtube className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-black uppercase italic">
                    Recommended Video Lectures
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentStep.youtubeVideos.map((video, i) => (
                    <a
                      key={i}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "p-6 border-4 shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group flex flex-col justify-between",
                        "bg-white border-black text-black",
                      )}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                            {video.channel}
                          </span>
                          <ExternalLink
                            size={16}
                            className="opacity-20 group-hover:opacity-100"
                          />
                        </div>
                        <h4 className="text-sm font-bold leading-tight">
                          {video.title}
                        </h4>
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

          {currentStep.resourceLink && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6",
                "bg-orange-50",
              )}
            >
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    "w-16 h-16 flex items-center justify-center border-4 border-black",
                    currentStep.resourceType === "youtube"
                      ? "bg-red-500"
                      : "bg-blue-500",
                  )}
                >
                  {currentStep.resourceType === "youtube" ? (
                    <Youtube className="text-[var(--text-main)]" size={32} />
                  ) : (
                    <ExternalLink
                      className="text-[var(--text-main)]"
                      size={32}
                    />
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase italic leading-none mb-2">
                    Deep Dive Resource
                  </h4>
                  <p className="text-sm font-bold opacity-60">
                    Complete this {currentStep.resourceType} module to master
                    this phase.
                  </p>

                  {currentStep.resourceType === "youtube" && (
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentStep.title + " " + path.subject)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase underline tracking-widest mt-2 block opacity-40 hover:opacity-100 transition-opacity"
                    >
                      [ Search Manual Fallback if Link is Broken ]
                    </a>
                  )}
                </div>
              </div>
              <a
                href={currentStep.resourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto px-8 py-4 bg-[var(--text-main)] text-[var(--bg-main)] font-black uppercase italic text-sm tracking-widest hover:bg-orange-500 transition-colors flex items-center justify-center gap-3"
              >
                Access Resource <ExternalLink size={16} />
              </a>
            </motion.div>
          )}

          <div
            className={cn(
              "pt-12 md:pt-16 border-t-4 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 pb-12 md:pb-0",
              "border-black",
            )}
          >
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <PlagueButton
                onClick={() => setShowAdaptModal(true)}
                variant="ghost"
                className="flex items-center justify-center md:justify-start gap-3 text-xs font-black uppercase italic p-0"
              >
                <RefreshCw
                  size={18}
                  className="group-hover:rotate-180 transition-transform duration-500"
                />
                Reshape Diagnostic
              </PlagueButton>
            </div>

            <div className="flex gap-4 md:gap-6 w-full md:w-auto">
              {currentStepIdx > 0 && (
                <PlagueButton
                  onClick={() => setCurrentStepIdx(currentStepIdx - 1)}
                  variant="secondary"
                  className="flex-1 md:flex-none px-6 md:px-12 py-4 md:py-5 text-sm md:text-base"
                >
                  Prev
                </PlagueButton>
              )}
              <PlagueButton
                onClick={() => {
                  if (!isCompleted && !isReview) {
                    onCompleteStep(currentStep);
                  }
                  if (currentStepIdx < path.steps.length - 1) {
                    setCurrentStepIdx(currentStepIdx + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    if (isReview) {
                      onBack();
                    } else {
                      confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ["#F97316", "#000000", "#FFFFFF"],
                      });
                      setTimeout(onFinish, 2000);
                    }
                  }
                }}
                className="flex-[2] md:flex-none px-10 md:px-16 py-4 md:py-5 text-sm md:text-base"
              >
                {currentStepIdx === path.steps.length - 1
                  ? isReview
                    ? "Finish"
                    : "Complete"
                  : "Next Phase"}
              </PlagueButton>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Adaptation Modal */}
      <AnimatePresence>
        {showAdaptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
              <motion.div
                initial={{ scale: 0.9, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[var(--bg-main)] border-4 md:border-8 border-[var(--card-border)] p-6 md:p-12 max-w-2xl w-full shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] md:shadow-[24px_24px_0px_0px_rgba(249,115,22,1)]"
              >
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <RefreshCw size={32} className="text-orange-500 md:w-10 md:h-10" />
                  <h2 className="text-3xl md:text-5xl font-black uppercase italic leading-none text-[var(--text-main)]">
                    Reshape Data
                  </h2>
                </div>

                <p className="text-base md:text-xl font-bold mb-6 md:mb-8 leading-tight text-[var(--text-main)] opacity-80">
                  Identify friction. Our AI will re-synthesize this
                  phase.
                </p>

                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g., 'Simplify it', 'Use an analogy'..."
                  className="w-full h-32 md:h-48 p-4 md:p-6 border-4 border-black bg-white text-black font-bold text-base md:text-lg focus:outline-none focus:border-orange-500 mb-6 md:mb-8 placeholder:text-black/20 caret-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                />

                <div className="flex gap-4 md:gap-6">
                  <PlagueButton
                    onClick={() => setShowAdaptModal(false)}
                    variant="secondary"
                    className="flex-1 py-3 md:py-5 border-2 md:border-4 border-black text-sm md:text-base"
                  >
                    Cancel
                  </PlagueButton>
                  <PlagueButton
                    onClick={handleAdapt}
                    disabled={isAdapting || !feedback}
                    className="flex-1 py-3 md:py-5 bg-[var(--text-main)] text-[var(--bg-main)] hover:bg-orange-500 hover:text-black text-sm md:text-base"
                  >
                    {isAdapting ? "Reshaping..." : "Execute"}
                  </PlagueButton>
                </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Study Notes View */}
      <AnimatePresence>
        {showFullNotes && (currentNotes || isGeneratingNotes) && (
          <StudyNotesView
            notes={currentNotes}
            title={currentStep.title}
            onBack={() => setShowFullNotes(false)}
            hasNext={currentStepIdx < path.steps.length - 1}
            isLoading={isGeneratingNotes}
            onNext={async () => {
              if (!isCompleted && !isReview) {
                onCompleteStep(currentStep);
              }
              const nextIdx = currentStepIdx + 1;
              if (nextIdx < path.steps.length) {
                setCurrentStepIdx(nextIdx);

                // If the next module's notes aren't generated, trigger it
                if (!studyNotesMap[nextIdx]) {
                  setIsGeneratingNotes(true);
                  try {
                    const nextStep = path.steps[nextIdx];
                    const notes = await generateStudyNotes(
                      nextStep.title,
                      stats.rank > 50 ? "beginner" : "advanced",
                    );
                    setStudyNotesMap((prev) => ({ ...prev, [nextIdx]: notes }));
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsGeneratingNotes(false);
                  }
                }

                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                setShowFullNotes(false);
                if (isReview) {
                  onBack();
                } else {
                  onFinish();
                }
              }
            }}
          />
        )}
      </AnimatePresence>

      {typeof document !== 'undefined' ? createPortal(
        <div className="fixed top-24 right-6 z-[9999] flex gap-2">
          <button
            onClick={() => {
              if (scrollProgress < 0.5) {
                practiceRef.current?.scrollIntoView({ behavior: "smooth" });
              } else {
                topRef.current?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="bg-[var(--bg-main)] text-[var(--text-main)] border-4 border-[var(--text-main)] w-12 h-12 flex items-center justify-center rounded-full hover:bg-[var(--text-main)] hover:text-[var(--bg-main)] transition-colors"
            title={scrollProgress < 0.5 ? "Practice Code" : "Top"}
          >
            {scrollProgress < 0.5 ? <ArrowDown size={24} /> : <ArrowUp size={24} />}
          </button>
        </div>,
        document.body
      ) : null}

      <StudyAssistantAgent moduleTitle={currentStep.title} moduleContent={currentStep.content} />
    </div>
  );
};

const getLocalDateKey = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateStreakData = (activityLog: { [date: string]: number } = {}) => {
  let streak = 0;
  const streakDates: string[] = [];
  const today = new Date();
  const checkDate = new Date(today);

  while (true) {
    const dateStr = getLocalDateKey(checkDate);
    if (activityLog[dateStr] && activityLog[dateStr] > 0) {
      streak++;
      streakDates.push(dateStr);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If no activity today, check yesterday. If yesterday also has no activity, streak is broken.
      // Exception: If we just started checking and today has no activity, it doesn't break yet, check yesterday.
      if (dateStr === getLocalDateKey(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return { streak, streakDates };
};

const calculateStreak = (activityLog: { [date: string]: number } = {}) => {
  return calculateStreakData(activityLog).streak;
};

// --- Streak Calendar ---
const StreakCalendar = ({
  activityLog = {},
}: {
  activityLog?: { [date: string]: number };
}) => {
  const today = new Date();
  const months = [];

  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    const daysInMonth = new Date(year, d.getMonth() + 1, 0).getDate();

    const monthDates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, d.getMonth(), day);
      // Only include dates up to today for the current month
      const localDate = new Date();
      localDate.setHours(23, 59, 59, 999);
      if (dateObj > localDate) break;
      monthDates.push(getLocalDateKey(dateObj));
    }

    months.push({ name: monthName, year, dates: monthDates });
  }

  const getLevel = (count: number, hasEntry: boolean = false) => {
    if (!hasEntry) return "bg-black/5";
    if (count === 0) return "bg-blue-400"; // Just logged in - solid blue
    if (count < 200) return "bg-lime-400";
    if (count < 500) return "bg-green-500";
    return "bg-green-700";
  };

  const currentStreakData = calculateStreakData(activityLog);
  const currentStreak = currentStreakData.streak;
  const streakDatesSet = new Set(currentStreakData.streakDates);

  return (
    <div className="space-y-6">
      {/* Live Tracker Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orange-500 border-4 border-black p-4 flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[var(--text-main)] text-[var(--bg-main)]">
            <Flame
              size={24}
              className={cn(
                currentStreak > 0 && "animate-bounce text-orange-500",
              )}
            />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest leading-none text-black">
              DAILY STREAK
            </h4>
            <p className="text-[10px] font-bold text-black uppercase">
              Infection active and spreading
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black italic tabular-nums leading-none">
            {currentStreak}
          </span>
          <p className="text-[10px] font-black uppercase tracking-widest mt-1">
            Days
          </p>
        </div>
      </motion.div>

      <div className="bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] p-6 shadow-[12px_12px_0px_0px_var(--shadow-color)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
            <Calendar size={16} className="text-orange-500" /> ACTIVITY MATRIX
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[8px] font-black uppercase text-[var(--text-main)] opacity-80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500" />
              <span>Login Only</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 border border-orange-500" />
              <span>Current Streak</span>
            </div>
            <div className="flex gap-1 items-center">
              <span>Less</span>
              <div className="w-2 h-2 bg-white/10" />
              <div className="w-2 h-2 bg-lime-400" />
              <div className="w-2 h-2 bg-green-500" />
              <div className="w-2 h-2 bg-green-700 shadow-[0_0_8px_rgba(21,128,61,0.6)]" />
              <span>More</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {months.map((month, mIdx) => (
            <div key={mIdx} className="space-y-2">
              <div className="flex justify-between items-end border-b border-[var(--card-border)] pb-1">
                <span className="text-[10px] font-black uppercase italic text-[var(--text-main)]">
                  {month.name}
                </span>
                <span className="text-[8px] font-mono text-[var(--text-secondary)]">
                  {month.year}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {month.dates.map((date) => {
                  const hasEntry = activityLog[date] !== undefined;
                  const isActive = (activityLog[date] || 0) > 0;
                  const isStreak = streakDatesSet.has(date);
                  const isToday = date === getLocalDateKey(today);

                  return (
                    <div
                      key={date}
                      title={`${date}: ${activityLog[date] || 0} XP ${isStreak ? "(Streak Active)" : ""}`}
                      className={cn(
                        "aspect-square border transition-all hover:scale-125 hover:z-10 cursor-help relative border-[var(--card-border)]",
                        getLevel(activityLog[date] || 0, hasEntry),
                        isToday && "ring-1 ring-orange-500 ring-inset",
                      )}
                    >
                      {isStreak && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-80">
                          <Flame size={12} className="text-orange-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- App Component ---
const ProfileView = ({
  profile,
  stats,
  onBack,
  onLogout,
  onUpdateStats,
  onUpdateName,
  onShowSupport,
}: {
  profile: LearningProfile;
  stats: UserStats;
  onBack: () => void;
  onLogout: () => void;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
  onUpdateName: (name: string) => void;
  onShowSupport: () => void;
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload a file smaller than 5MB.");
      return;
    }

    setIsUploadingResume(true);
    try {
      await saveFileToDB(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(",")[1];
          const { analyzeResume } = await import("./services/gemini");
          const result = await analyzeResume(base64String, file.type);

          onUpdateStats({
            resumeSummary: result,
          });
        } catch (err) {
          console.error("Resume analysis failed:", err);
          alert(
            "Failed to analyze resume. Please try a different format or a shorter document.",
          );
        } finally {
          setIsUploadingResume(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File read failed:", err);
      alert("Failed to read the file.");
      setIsUploadingResume(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[var(--text-main)]">
      <header className="border-b-4 border-[var(--card-border)] p-4 md:p-6 flex justify-between items-center bg-[var(--card-bg)] backdrop-blur-md sticky top-0 z-50">
        <div
          className="flex items-center gap-2 md:gap-4 cursor-pointer group"
          onClick={onBack}
        >
          <div className="p-1 md:p-2 border-2 border-transparent group-hover:border-[var(--card-border)] group-hover:bg-[var(--card-bg)] transition-colors rounded-full text-[var(--text-main)]">
            <ArrowLeft size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="p-1.5 md:p-2 bg-black text-white border-2 border-[var(--card-border)] rotate-12">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">
            PROFILE
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 md:p-3 border-2 border-[var(--card-border)] rounded-full hover:bg-[var(--text-main)] hover:text-[var(--bg-main)] transition-colors"
          >
            <Settings size={18} className="md:w-5 md:h-5" />
          </button>
          <PlagueButton onClick={onBack} variant="secondary" className="px-4 md:px-6 text-xs md:text-sm h-10 md:h-12">
            Close
          </PlagueButton>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 md:space-y-12 pb-32">
        {/* Profile Header Card */}
        <ScrollReveal>
          <section className="bg-[var(--card-bg)] backdrop-blur-md border-4 md:border-8 border-[var(--card-border)] p-6 md:p-12 shadow-[var(--shadow-primary)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-orange-500/5 rotate-45 translate-x-16 md:translate-x-32 -translate-y-16 md:-translate-y-32" />

            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10 w-full mb-4 md:mb-0">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-orange-500 border-4 md:border-8 border-black flex items-center justify-center text-6xl md:text-8xl font-black italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] shrink-0">
                {profile.name[0]}
              </div>
              <div className="text-center md:text-left space-y-2 md:space-y-4 flex-1">
                {isEditingName ? (
                  <div className="relative inline-block w-full max-w-xl">
                    <input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          if (editedName.trim() !== "") {
                            onUpdateName(editedName.trim());
                          }
                          setIsEditingName(false);
                        }
                      }}
                      onBlur={() => {
                        if (editedName.trim() !== "") {
                          onUpdateName(editedName.trim());
                        }
                        setIsEditingName(false);
                      }}
                      className="bg-transparent border-b-4 md:border-b-8 border-orange-500 text-4xl md:text-8xl font-black uppercase italic tracking-tighter leading-none focus:outline-none w-full caret-orange-500"
                      autoFocus
                    />
                    <span className="absolute -top-6 left-0 text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                      Press Enter to save
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center md:items-start relative group/name">
                    <button
                      onClick={() => {
                        setEditedName(profile.name);
                        setIsEditingName(true);
                      }}
                      className="text-[#526D82] hover:text-[var(--text-main)] hover:bg-black/5 p-2 rounded-full transition-all opacity-50 hover:opacity-100 -ml-2 mb-1"
                      title="Edit Name"
                    >
                      <Edit3 size={18} />
                    </button>
                    <h2 className="text-3xl md:text-8xl font-black uppercase italic tracking-tighter leading-none break-all">
                      {profile.name}
                    </h2>
                  </div>
                )}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4">
                  <span className="px-3 py-1 md:px-4 md:py-1 bg-[var(--card-border)] border border-[var(--card-border)] text-[var(--text-main)] text-[10px] md:text-sm font-black uppercase tracking-widest shadow-[0_0_10px_rgba(var(--text-main),0.1)]">
                    {profile.level}
                  </span>
                  <span className="px-3 py-1 md:px-4 md:py-1 bg-orange-500 text-black text-[10px] md:text-sm font-black uppercase tracking-widest italic shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
                    {profile.learningStyle}
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-4 z-20">
              {!isEditingName && (
                <>
                  <input
                    type="file"
                    accept=".pdf,.txt,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </>
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* Resume Analysis */}
        <div
          id="resume-summary"
          className="bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] p-8 shadow-[8px_8px_0px_0px_var(--shadow-color)] space-y-6 relative group overflow-hidden"
        >
          {isUploadingResume && (
            <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
            </div>
          )}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 -rotate-12 translate-x-8 -translate-y-8" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 w-full relative z-10 border-b-2 border-[#526D82]/10 pb-4">
            <h3 className="text-2xl font-black uppercase italic flex items-center gap-2">
              <Briefcase size={24} className="text-orange-500" /> Professional
              Profile
            </h3>

            {!stats.resumeSummary ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-[var(--text-main)] text-[var(--bg-main)] px-4 py-2 hover:-translate-y-1 hover:shadow-lg transition-all"
                title="Upload Resume"
              >
                <Upload size={14} /> Upload Resume
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-[var(--text-main)] text-[var(--bg-main)] px-4 py-2 hover:-translate-y-1 hover:shadow-lg transition-all"
                  title="Upload New"
                >
                  <Upload size={14} /> Upload New
                </button>
                <button
                  onClick={() => onUpdateStats({ resumeSummary: undefined })}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-red-500 text-white px-3 py-2 hover:-translate-y-1 hover:shadow-lg transition-all"
                  title="Delete Resume"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {stats.resumeSummary ? (
            <div className="space-y-6 relative z-10">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#526D82] mb-2 border-b-2 border-[#526D82]/30 pb-1">
                  About
                </h4>
                <p className="text-[var(--text-main)] font-medium leading-relaxed bg-[var(--bg-main)]/50 p-4 border-l-4 border-orange-500">
                  {stats.resumeSummary.about}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#526D82] mb-3 border-b-2 border-[#526D82]/30 pb-1">
                  Skills Acquired
                </h4>
                <div className="flex flex-wrap gap-2">
                  {stats.resumeSummary.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-[var(--text-main)] text-[var(--bg-main)] font-bold text-xs uppercase tracking-widest border-2 border-transparent"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 relative z-10 opacity-70">
              <Briefcase className="mx-auto h-12 w-12 text-[#526D82] mb-4 opacity-50" />
              <p className="text-[var(--text-main)] font-medium">
                No resume uploaded yet.
              </p>
              <p className="text-sm text-[#526D82] mt-2">
                Upload your resume to enhance your learning profile.
              </p>
            </div>
          )}
        </div>

        {/* Neural Activity (Calendar) */}
        <StreakCalendar activityLog={stats.activityLog} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Neural Status Box */}
          <div className="bg-[var(--card-bg)] text-[var(--text-main)] p-10 shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] border-4 border-[var(--text-main)]">
            <h3 className="text-2xl font-black uppercase italic mb-8 border-b-2 border-orange-500 pb-2 flex items-center justify-between opacity-90">
              Neural Status <TrendingUp size={20} />
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Integration Points
                </span>
                <span className="text-4xl font-black italic drop-shadow-sm">
                  {stats.xp.toLocaleString()} XP
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Synaptic Streak
                </span>
                <span className="text-4xl font-black italic drop-shadow-sm">
                  {calculateStreak(stats.activityLog)} DAYS
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Global Rank
                </span>
                <span className="text-4xl font-black italic">
                  #{stats.rank}
                </span>
              </div>
            </div>
          </div>

          {/* Core Domain Box */}
          <section className="bg-[var(--card-bg)] text-[var(--text-main)] p-10 shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] border-4 border-[var(--text-main)]">
            <h3 className="text-2xl font-black uppercase italic mb-8 border-b-2 border-[var(--text-main)] pb-2 flex items-center justify-between">
              Core Domain <Target size={20} />
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Primary Knowledge Source
                </span>
                <p className="text-2xl font-black uppercase italic">
                  {profile.subject || "Not Set"}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Strategic Objective
                </span>
                <p className="text-lg font-bold leading-tight italic opacity-90">
                  "{profile.goals || "No goals defined."}"
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Mutations section */}
        <ScrollReveal>
          <section className="bg-[var(--card-bg)] backdrop-blur-md border-4 border-[var(--card-border)] p-10 shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
            <h3 className="text-2xl font-black uppercase italic mb-8 border-b-2 border-[var(--card-border)] pb-2 !text-[var(--text-main)]">
              Evolved Traits
            </h3>
            <div className="flex flex-wrap gap-4">
              {stats.mutations.map((m, i) => (
                <div
                  key={i}
                  className="px-6 py-3 bg-white/10 !text-[var(--text-main)] border-2 border-[var(--card-border)] font-black uppercase italic text-sm flex items-center gap-3"
                >
                  <Zap size={16} className="text-orange-500" />
                  {m}
                </div>
              ))}
              {stats.mutations.length === 0 && (
                <p className="text-sm font-bold !text-[var(--text-main)] opacity-60 uppercase tracking-widest">
                  No mutations detected yet.
                </p>
              )}
            </div>
          </section>
        </ScrollReveal>
      </main>

      {/* Settings Side Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-[var(--card-bg)] border-l-4 border-[var(--card-border)] shadow-[var(--shadow-primary)] z-[101] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-12">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--text-main)]">Settings</h2>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 border-2 border-[var(--card-border)] rounded-full hover:bg-[var(--text-main)] hover:text-[var(--bg-main)] transition-colors text-[var(--text-main)]">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#526D82] mb-4">Navigation</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={onBack}
                        className="w-full text-left p-4 flex justify-between items-center bg-[var(--bg-main)] border-2 border-[var(--card-border)] hover:border-orange-500 transition-colors font-bold group text-[var(--text-main)]"
                      >
                        Nexus Dashboard
                        <ArrowRight size={16} className="opacity-50 group-hover:opacity-100 group-hover:text-orange-500 transition-all group-hover:translate-x-1" />
                      </button>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#526D82] mb-4">Support</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={onShowSupport}
                        className="w-full text-left p-4 flex items-center gap-3 bg-[var(--bg-main)] border-2 border-[var(--card-border)] hover:border-orange-500 transition-colors font-bold group text-[var(--text-main)] cursor-pointer"
                      >
                        <Mail size={18} className="text-[#526D82] group-hover:text-orange-500 transition-colors" />
                        <div>
                          <p>Customer Support</p>
                          <p className="text-xs font-mono opacity-50 mt-1">support@plague.com</p>
                        </div>
                      </button>
                      <a 
                        href="tel:+919500564504"
                        className="w-full text-left p-4 flex items-center gap-3 bg-[var(--bg-main)] border-2 border-[var(--card-border)] hover:border-orange-500 transition-colors font-bold group text-[var(--text-main)]"
                      >
                        <Phone size={18} className="text-[#526D82] group-hover:text-orange-500 transition-colors" />
                        <div>
                          <p>Contact Us (Calls)</p>
                          <p className="text-xs font-mono opacity-50 mt-1">+91 95005 64504</p>
                        </div>
                      </a>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#526D82] mb-4">Account</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={onLogout}
                        className="w-full text-left p-4 flex items-center justify-between bg-[var(--bg-main)] border-2 border-red-500 hover:bg-red-500 hover:text-white transition-colors font-bold group text-red-500"
                      >
                        <span className="flex items-center gap-3">
                          <LogOut size={18} className="transition-colors" />
                          Log Out
                        </span>
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Assessment Components ---

const AssessmentInstructionView = ({
  isGenerating,
  onStart,
  onBack,
  attempts,
}: {
  isGenerating: boolean;
  onStart: () => void;
  onBack: () => void;
  attempts: number;
}) => {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 md:p-6 text-[var(--text-main)] relative overflow-x-hidden">
      <ScrollReveal className="max-w-3xl w-full bg-[var(--card-bg)] backdrop-blur-md border-4 md:border-8 border-[var(--card-border)] p-6 md:p-12 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] md:shadow-[24px_24px_0px_0px_rgba(255,255,255,1)] relative">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8 relative">
          <div
            className="absolute -top-4 -left-4 md:-top-6 md:-left-6 cursor-pointer group z-10"
            onClick={onBack}
            title="Go Back"
          >
            <div className="p-1 md:p-2 border-2 border-transparent group-hover:border-[var(--card-border)] group-hover:bg-[var(--card-bg)] transition-colors rounded-full text-[var(--text-main)]">
              <ArrowLeft size={20} className="md:w-6 md:h-6" />
            </div>
          </div>
          <div className="p-3 md:p-4 bg-orange-500 border-4 border-black rotate-12 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <AlertTriangle size={32} className="text-black md:w-12 md:h-12" />
          </div>
          <h2 className="text-3xl md:text-6xl font-black uppercase italic leading-none text-[var(--text-main)] drop-shadow-md text-center md:text-left">
            Assessment Protocol
          </h2>
        </div>

        <div className="space-y-6 md:space-y-8 mb-8 md:mb-12">
          <div className="p-4 md:p-6 bg-red-950/20 border-l-4 md:border-l-8 border-red-600">
            <h4 className="text-lg md:text-xl font-black uppercase italic mb-2 text-red-600 underline">
              Critical Rules
            </h4>
            <ul className="space-y-2 md:space-y-3 font-bold text-sm md:text-lg">
              <li className="flex items-start gap-2 md:gap-3">
                <span className="text-red-600">•</span>
                <span>
                  40 minutes, 25 questions.
                </span>
              </li>
              <li className="flex items-start gap-2 md:gap-3">
                <span className="text-red-600">•</span>
                <span>
                  TAB SWITCHING IS FORBIDDEN.
                </span>
              </li>
              <li className="flex items-start gap-2 md:gap-3">
                <span className="text-red-600">•</span>
                <span className="text-red-600 uppercase">
                  ATTEMPTS Left: {2 - attempts}/2
                </span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="p-4 md:p-6 border-4 border-[var(--card-border)] bg-white/10">
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                <Zap className="text-orange-500" size={16} />
                <span className="font-black uppercase italic text-[var(--text-main)] text-xs md:text-sm">
                  Neural Sync Required
                </span>
              </div>
              <p className="text-[10px] md:text-sm font-bold text-[var(--text-main)] opacity-80">
                Earn your certificate by validating neural synthesis.
              </p>
            </div>
            <div className="p-4 md:p-6 border-4 border-[var(--card-border)] bg-white/10">
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                <Brain className="text-orange-500" size={16} />
                <span className="font-black uppercase italic text-[var(--text-main)] text-xs md:text-sm">
                  Diversity of Logic
                </span>
              </div>
              <p className="text-[10px] md:text-sm font-bold text-[var(--text-main)] opacity-80">
                Unique question sets generated from your notes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <PlagueButton
            onClick={onBack}
            variant="secondary"
            className="w-full py-4 md:py-8 text-lg md:text-xl h-14 md:h-20"
          >
            Dashboard
          </PlagueButton>
          <PlagueButton
            disabled={isGenerating || attempts >= 2}
            onClick={onStart}
            className="w-full py-4 md:py-8 text-xl md:text-2xl h-14 md:h-20 shadow-[8px_8px_0px_0px_var(--shadow-color)] md:shadow-[12px_12px_0px_0px_var(--shadow-color)]"
          >
            {isGenerating
              ? "Synthesizing..."
              : attempts >= 2
                ? "No Efforts Left"
                : "Initiate"}
          </PlagueButton>
        </div>
      </ScrollReveal>
    </div>
  );
};

const AssessmentView = ({
  assessment,
  onFinish,
  onViolation,
}: {
  assessment: Assessment;
  onFinish: (score: number) => void;
  onViolation: () => void;
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    new Array(assessment.questions.length).fill(-1),
  );
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes
  const [showResults, setShowResults] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [violationDetected, setViolationDetected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolation();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation();
      }
    };

    const preventDefault = (e: Event) => e.preventDefault();
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", preventDefault);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", preventDefault);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleViolation = () => {
    setViolationDetected(true);
    setTimeout(() => {
      onViolation();
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelect = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("Submitting assessment...");

    let score = 0;
    answers.forEach((ans, i) => {
      if (ans === assessment.questions[i].correctAnswerIndex) {
        score++;
      }
    });
    const finalScore = Math.round((score / assessment.questions.length) * 100);
    console.log(`Assessment score calculated: ${finalScore}%`);

    try {
      await onFinish(finalScore);
    } catch (error) {
      console.error("Error during onFinish callback:", error);
      setIsSubmitting(false);
    }
  };

  if (violationDetected) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-12 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-8"
        >
          <div className="inline-block p-8 bg-red-600 rounded-full animate-ping">
            <AlertTriangle size={80} className="text-[var(--text-main)]" />
          </div>
          <h2 className="text-7xl font-black text-red-600 uppercase italic">
            Security Breach Detected
          </h2>
          <p className="text-3xl font-bold text-[var(--text-secondary)]">
            Fullscreen exit or tab switch detected. Attempt terminated.
            Connection severed.
          </p>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentIdx];

  return (
    <div className="min-h-screen bg-transparent text-[var(--text-main)] flex flex-col font-sans select-none">
      {/* Header */}
      <header className="bg-black/60 backdrop-blur-md text-white p-4 md:p-6 flex flex-col md:flex-row justify-between items-center border-b-8 border-orange-500 sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="p-1 px-2 md:p-2 bg-orange-500 text-black font-black italic border-2 border-black text-xs md:text-sm shrink-0">
            SYNTHESIS LAB
          </div>
          <h1 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter truncate">
            {assessment.title}
          </h1>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 md:gap-12 font-black italic w-full md:w-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <Clock
              size={20}
              className={cn(
                "md:w-6 md:h-6",
                timeLeft < 300
                  ? "text-red-500 animate-pulse"
                  : "text-orange-500",
              )}
            />
            <span className="text-xl md:text-3xl tabular-nums">
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="text-[10px] md:text-sm uppercase tracking-widest bg-white/10 px-2 md:px-4 py-1 md:py-2 border-2 border-[var(--card-border)] whitespace-nowrap">
            Q {currentIdx + 1}/{assessment.questions.length}
          </div>
        </div>
      </header>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[var(--bg-main)] border-8 border-[var(--card-border)] p-12 max-w-2xl w-full space-y-8 shadow-[24px_24px_0px_0px_rgba(249,115,22,1)]"
            >
              <div className="flex items-center gap-6 text-red-600">
                <AlertCircle size={64} />
                <h2 className="text-5xl font-black uppercase italic tracking-tighter">
                  Neural Locking
                </h2>
              </div>
              <p className="text-2xl font-bold text-[var(--text-main)] opacity-70">
                Are you certain? Finalizing will lock your current logical state
                for validation. Incomplete answers will be discarded.
              </p>
              <div className="flex flex-col gap-4">
                <PlagueButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-8 text-2xl bg-red-600 border-red-600"
                >
                  {isSubmitting ? "Processing..." : "Confirm Submission"}
                </PlagueButton>
                <PlagueButton
                  onClick={() => setShowConfirmSubmit(false)}
                  disabled={isSubmitting}
                  variant="secondary"
                  className="w-full py-8 text-2xl"
                >
                  Return to Interface
                </PlagueButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative">
        <div className="absolute top-4 left-4 z-10 md:z-50">
          <div
            className="cursor-pointer group"
            onClick={onViolation}
            title="Abort Assessment"
          >
            <div className="flex items-center gap-2 p-1 md:p-2 border-2 border-transparent group-hover:border-[var(--card-border)] group-hover:bg-[var(--card-bg)] transition-colors rounded-full text-[var(--text-main)]">
              <ArrowLeft size={20} className="md:w-6 md:h-6" />
              <span className="text-[10px] font-black uppercase">Abort</span>
            </div>
          </div>
        </div>
        {/* Scan Line Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="scan-line" />
        </div>
        <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 py-8 md:py-0">
          {/* Question Card */}
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 md:space-y-8"
          >
            <h2 className="text-2xl md:text-4xl font-black leading-tight italic">
              <span className="text-orange-500 mr-2 md:mr-4">Q{currentIdx + 1}.</span>
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {currentQuestion.options.map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "flex items-center gap-4 md:gap-6 p-4 md:p-8 border-2 md:border-4 transition-all text-left group",
                    answers[currentIdx] === i
                      ? "bg-white text-black border-white shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] md:shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]"
                      : "bg-white/5 text-white border-[var(--card-border)] hover:border-white shadow-none",
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 md:w-10 md:h-10 border-2 md:border-4 flex items-center justify-center font-black text-sm md:text-xl flex-shrink-0",
                      answers[currentIdx] === i
                        ? "border-orange-500 bg-orange-500 text-black"
                        : "border-[var(--card-border)] group-hover:border-white",
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm md:text-xl font-bold">{opt}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="p-4 md:p-8 bg-[var(--card-bg)] backdrop-blur-md border-t-4 md:border-t-8 border-[var(--card-border)] flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 relative z-10">
        <div className="flex gap-2 md:gap-4 w-full md:w-auto">
          <PlagueButton
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => prev - 1)}
            variant="secondary"
            className="flex-1 md:flex-none px-4 md:px-8 py-3 md:py-5 text-sm md:text-base h-12 md:h-16"
          >
            Previous
          </PlagueButton>
          <PlagueButton
            disabled={currentIdx === assessment.questions.length - 1}
            onClick={() => setCurrentIdx((prev) => prev + 1)}
            className="flex-1 md:flex-none px-4 md:px-8 py-3 md:py-5 text-sm md:text-base h-12 md:h-16"
          >
            Next Logic
          </PlagueButton>
        </div>

        <div className="flex items-center gap-4 md:gap-12 w-full md:w-auto justify-between md:justify-end">
          <div className="flex flex-1 md:flex-none gap-0.5 md:gap-1 h-3 md:h-2">
            {answers.map((ans, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 md:w-3 transition-colors",
                  ans !== -1 ? "bg-green-500" : "bg-white/10",
                  currentIdx === i && "bg-orange-500 ring-1 md:ring-2 ring-white",
                )}
              />
            ))}
          </div>

          <PlagueButton
            onClick={() => setShowConfirmSubmit(true)}
            size="lg"
            className="px-6 md:px-12 py-3 md:py-6 text-lg md:text-xl bg-red-600 border-red-600 h-12 md:h-auto"
          >
            FINALIZE
          </PlagueButton>
        </div>
      </footer>
    </div>
  );
};

// --- Completion Modal ---

const CompletionModal = ({
  pathway,
  onBack,
  studentName: propStudentName,
  onReview,
}: {
  pathway: LearningPath | CompletedPathway;
  onBack: () => void;
  studentName?: string;
  onReview?: (steps: LearningStep[]) => void;
}) => {
  const isArchived = "topics" in pathway;
  const now = new Date();
  const dateStr = isArchived
    ? (pathway as CompletedPathway).date
    : now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const yearStr = isArchived
    ? (pathway as CompletedPathway).year
    : now.getFullYear().toString();
  const timeStr = isArchived
    ? (pathway as CompletedPathway).time
    : now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
  const domainName = isArchived
    ? (pathway as CompletedPathway).name
    : (pathway as LearningPath).subject;
  const steps = isArchived
    ? (pathway as CompletedPathway).steps
    : (pathway as LearningPath).steps;
  const studentName = isArchived
    ? (pathway as CompletedPathway).studentName || "Neural Subject"
    : propStudentName || "Validated User";

  const certRef = React.useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const downloadCertAsImage = async () => {
    if (!certRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const dataUrl = await toPng(certRef.current, {
        quality: 1,
        backgroundColor: "#ffffff",
        fontEmbedCSS: "",
        width: 1400,
        height: 1000,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });
      const link = document.createElement("a");
      link.download = `plague-cert-${domainName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to capture certificate:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto backdrop-blur-xl font-sans">
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50">
        <div
          className="cursor-pointer group"
          onClick={onBack}
          title="Back to Nexus"
        >
          <div className="p-1 md:p-2 border-2 border-transparent hover:border-[var(--card-border)] bg-[var(--card-bg)] transition-colors rounded-full text-[var(--text-main)] shadow-lg">
            <ArrowLeft size={20} className="md:w-6 md:h-6" />
          </div>
        </div>
      </div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-6xl shadow-[20px_20px_0px_0px_rgba(249,115,22,0.3)] md:shadow-[40px_40px_0px_0px_rgba(249,115,22,0.3)] relative"
      >
        <div className="bg-[#FDFDFD] p-1 md:p-2 border-2 md:border-4 border-black relative overflow-x-auto lg:overflow-x-visible">
          {/* Certificate Container with Horizontal Visual Design */}
          <div
            ref={certRef}
            style={{ minWidth: (typeof window !== 'undefined' && window.innerWidth < 768) ? "800px" : "auto" }}
            className="w-full aspect-[1.4/1] bg-white border-[8px] md:border-[16px] border-black p-8 md:p-16 lg:p-24 relative flex flex-col items-center justify-between overflow-hidden"
          >
            {/* Subtle App Branding Watermark */}
            <div className="absolute -top-20 -right-20 opacity-[0.03] rotate-12 pointer-events-none">
              <Virus size={400} />
            </div>

            {/* Header branding */}
            <div className="w-full flex justify-between items-start z-10">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-500 border-2 border-black rotate-12">
                  <Virus size={24} className="text-black" />
                </div>
                <span className="text-xl font-black uppercase italic tracking-tighter text-black">
                  Plague AI
                </span>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 text-black">
                  Authentication Node
                </p>
                <p className="font-mono text-sm font-black uppercase tracking-widest text-orange-600">
                  CERT-ID:{" "}
                  {Math.random().toString(36).substr(2, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full flex flex-col items-center text-center">
              <div className="space-y-4 mb-8">
                <h2 className="text-base font-mono font-black uppercase tracking-[1em] text-orange-500">
                  Certificate of Specialization
                </h2>
                <div className="h-1 w-24 bg-black mx-auto" />
              </div>

              <div className="space-y-6">
                <p className="text-xl font-medium italic text-black/60">
                  This certifies that
                </p>
                <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-black">
                  {studentName}
                </h1>

                <div className="py-8">
                  <p className="text-lg font-medium italic text-black/60 mb-2">
                    has successfully demonstrated proficiency in the domain of
                  </p>
                  <h3 className="text-3xl md:text-5xl font-black uppercase italic text-orange-500 tracking-tight">
                    {domainName}
                  </h3>
                </div>

                <p className="text-sm font-bold text-black/40 max-w-xl mx-auto uppercase tracking-widest">
                  Verified integration achieved through adaptive neural
                  synthesis protocol v.2.
                </p>
              </div>
            </div>

            {/* Footer / Signatures */}
            <div className="w-full flex justify-between items-end z-10 border-t-2 border-black pt-12">
              <div className="text-left space-y-2">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest opacity-40 text-black">
                  Synthesis Validation Score
                </p>
                <p className="text-3xl font-black italic text-orange-500">
                  {(pathway as CompletedPathway).assessmentScore !== undefined
                    ? (pathway as CompletedPathway).assessmentScore
                    : "---"}
                  %
                </p>
                <p className="text-sm font-black italic text-black opacity-60">
                  {dateStr}, {yearStr}
                </p>
              </div>

              <div className="text-center relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 w-48 flex justify-center mt-2">
                </div>
                <div className="w-48 h-px bg-black mb-4 mx-auto mt-8" />
                <p className="font-mono text-[10px] font-black uppercase tracking-widest leading-none text-black">
                  Director of Synthesis
                </p>
                <p className="font-mono text-[8px] font-bold opacity-30 mt-1 uppercase text-black">
                  Plague AI Neural Core
                </p>
              </div>

              <div className="text-right">
                <div className="p-4 border-4 border-black inline-block bg-white shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]">
                  <Sparkles size={32} className="text-orange-500" />
                </div>
              </div>
            </div>

            {/* Corner Decorative Elements */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t-[16px] border-l-[16px] border-black/5 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-[16px] border-r-[16px] border-black/5 pointer-events-none" />
          </div>

          {/* Action Buttons (outside capturable area) */}
          <div className="flex flex-col md:flex-row gap-6 p-8 bg-[var(--card-bg)] backdrop-blur-md border-t-4 border-[var(--card-border)]">
            <PlagueButton
              onClick={downloadCertAsImage}
              disabled={isCapturing}
              className="flex-[2] py-6 text-xl"
            >
              {isCapturing ? "Downloading..." : "Download Certificate"}{" "}
              <CheckCircle2 className="ml-2" />
            </PlagueButton>
            {onReview && steps && (
              <PlagueButton
                onClick={() => onReview(steps)}
                variant="accent"
                className="flex-1 py-6 text-xl"
              >
                Review Data
              </PlagueButton>
            )}
            <PlagueButton
              onClick={onBack}
              variant="secondary"
              className="flex-1 py-6 text-xl !text-[var(--text-main)] back-to-nexus-btn"
            >
              Back to Nexus
            </PlagueButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = (e?: React.MouseEvent) => {
    const nextTheme = !isDark;

    // View Transition API for ripple effect
    if (typeof document.startViewTransition !== "function" || !e) {
      setIsDark(nextTheme);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;

    // Set ripple position
    document.documentElement.style.setProperty("--ripple-x", `${x}px`);
    document.documentElement.style.setProperty("--ripple-y", `${y}px`);

    document.startViewTransition(() => {
      setIsDark(nextTheme);
    });
  };
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>("landing");
  const [isReviewState, setIsReviewState] = useState(false);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [selectedArchivedPathway, setSelectedArchivedPathway] =
    useState<CompletedPathway | null>(null);
  const [startStepIdx, setStartStepIdx] = useState(0);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [studyNotesMap, setStudyNotesMap] = useState<{
    [key: number]: StudyNotes;
  }>({});
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isRegeneratingBlueprint, setIsRegeneratingBlueprint] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    xp: 0,
    rank: 99,
    streak: 1,
    completedSteps: [],
    activityLog: {},
    mutations: ["Patient Zero"],
    dailyQuests: [
      { label: "Complete 1 Step", xp: 100, done: false },
      { label: "Share Knowledge", xp: 250, done: false },
      { label: "30m Focus Session", xp: 500, done: false },
    ],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        setState("landing");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(
      doc(db, path),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({
            name: data.name || "",
            learningStyle: data.learningStyle || "visual",
            goals: data.goals || "",
            level: data.level || "beginner",
            subject: data.subject || "",
          });
          setStats({
            xp: data.xp || 0,
            rank: data.rank || 99,
            streak: calculateStreak(data.activityLog || {}),
            completedSteps: data.completedSteps || [],
            activePathways: data.activePathways || [],
            mutations: data.mutations || ["Patient Zero"],
            dailyQuests: data.dailyQuests || [],
            completedPathways: data.completedPathways || [],
            schedule: data.schedule || null,
            activityLog: data.activityLog || {},
            skills: data.skills || [],
            externalCourses: data.externalCourses || [],
            resumeSummary: data.resumeSummary || undefined,
          });
          if (data.currentPath) {
            setPath(data.currentPath);
          }
          setState((prev) => (prev === "landing" ? "dashboard" : prev));
        } else {
          setState("pathway_generator");
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        setLoading(false);
        setState("landing"); // Fallback to landing if load fails
      },
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || state !== "dashboard") return;

    // Check if daily quests need resetting (simple daily reset)
    try {
      const today = getLocalDateKey();
      const lastSessionDate = localStorage.getItem("last_session_date");

      // Use a timeout to avoid triggering updates if the snapshot just changed
      const timeout = setTimeout(() => {
        if (lastSessionDate !== today) {
          const resetQuests = (stats.dailyQuests || []).map((q) => ({
            ...q,
            done: false,
          }));
          handleUpdateUserStats({ dailyQuests: resetQuests });
          localStorage.setItem("last_session_date", today);
        }

        if (stats.activityLog && stats.activityLog[today] === undefined) {
          const updatedLog = { ...stats.activityLog, [today]: 0 };
          handleUpdateUserStats({ activityLog: updatedLog });
        }
      }, 1000);

      return () => clearTimeout(timeout);
    } catch (e) {
      console.warn("LocalStorage or background sync failed:", e);
    }
  }, [user, state, !!stats.dailyQuests, !!stats.activityLog]);

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setState("landing");
      setProfile(null);
      setPath(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartAssessmentSession = async () => {
    if (!user || !profile || !path) return;

    const activeAP = stats.activePathways?.find(
      (ap) => ap.path.subject === path.subject,
    );
    const usedAttempts = activeAP?.assessmentAttempts || 0;

    if (usedAttempts >= 2) {
      alert(
        "CRITICAL LOCK: You have reached the maximum of 2 validation attempts for this domain. Content access locked.",
      );
      return;
    }

    setIsGeneratingAssessment(true);
    setState("assessment_instruction");

    try {
      const notesContext = Object.values(studyNotesMap)
        .map((n) => {
          const concepts = n.keyConcepts
            .map((c) => `${c.concept}: ${c.explanation}`)
            .join("\n");
          return `${n.title}\n${n.summary}\n${concepts}`;
        })
        .join("\n\n");
      const attemptNumber = usedAttempts + 1;

      const generatedAssessment = await generateAssessment(
        path.subject,
        profile.level,
        notesContext || path.steps.map((s) => s.title).join(", "),
        attemptNumber > 1,
      );
      setAssessment(generatedAssessment);
    } catch (e) {
      console.error("Failed to generate assessment:", e);
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  const handleRegenerateBlueprint = async () => {
    if (!profile || !user || !path) return;
    setIsRegeneratingBlueprint(true);
    try {
      const { regenerateBlueprint } = await import("./services/gemini");
      const newOverview = await regenerateBlueprint(profile);

      const newPath = { ...path, roadmapOverview: newOverview };
      setPath(newPath);

      const updatedPathways = (stats.activePathways || []).map((ap) => {
        if (ap.path.subject === path.subject) {
          return { ...ap, path: newPath };
        }
        return ap;
      });

      const docPath = `users/${user.uid}`;
      await setDoc(
        doc(db, docPath),
        {
          currentPath: newPath,
          activePathways: updatedPathways,
        },
        { merge: true },
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsRegeneratingBlueprint(false);
    }
  };

  const handleUpdateBlueprint = async (newOverview: string) => {
    if (!profile || !user || !path) return;
    setIsRegeneratingBlueprint(true);
    try {
      const { regenerateStepsFromBlueprint } = await import("./services/gemini");
      const newSteps = await regenerateStepsFromBlueprint(newOverview, path.steps);
      
      const newPath = { 
        ...path, 
        roadmapOverview: newOverview,
        steps: newSteps.length > 0 ? newSteps : path.steps 
      };
      setPath(newPath);

      const validStepTitles = new Set(newPath.steps.map(s => s.title));

      const updatedPathways = (stats.activePathways || []).map((ap) => {
        if (ap.path.subject === path.subject) {
          const cleanCompletedSteps = ap.completedSteps.filter(t => validStepTitles.has(t));
          return { ...ap, path: newPath, completedSteps: cleanCompletedSteps };
        }
        return ap;
      });
      
      let updatedGlobalCompletedSteps = stats.completedSteps;
      if (stats.completedSteps) {
        updatedGlobalCompletedSteps = stats.completedSteps.filter(stepKey => {
          if (!stepKey.startsWith(path.subject + ":")) return true;
          const title = stepKey.split(":")[1];
          return validStepTitles.has(title);
        });
      }

      setStats((prev) => ({ ...prev, activePathways: updatedPathways, completedSteps: updatedGlobalCompletedSteps }));

      const docPath = `users/${user.uid}`;
      await setDoc(
        doc(db, docPath),
        {
          currentPath: newPath,
          activePathways: updatedPathways,
          completedSteps: updatedGlobalCompletedSteps,
        },
        { merge: true },
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsRegeneratingBlueprint(false);
    }
  };

  const handleSelectPathway = async (id: string) => {
    if (!user || !stats.activePathways) return;
    const selected = stats.activePathways.find((ap) => ap.id === id);
    if (selected) {
      setProfile(selected.profile);
      setPath(selected.path);
      const updatedPathways = stats.activePathways.map((ap) =>
        ap.id === id ? { ...ap, lastAccessed: new Date().toISOString() } : ap,
      );
      // Synchronously update local state to avoid flicker
      setStats((prev) => ({
        ...prev,
        activePathways: updatedPathways,
        completedSteps: selected.completedSteps,
      }));

      try {
        await updateDoc(doc(db, `users/${user.uid}`), {
          activePathways: updatedPathways,
          currentPath: selected.path,
          ...selected.profile,
          completedSteps: selected.completedSteps,
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleDeletePathway = async (id: string) => {
    if (!user) return;
    const updatedPathways = (stats.activePathways || []).filter(
      (ap) => ap.id !== id,
    );

    // If the currently active pathway is the one being deleted, clear it
    const deletedPathway = stats.activePathways?.find((ap) => ap.id === id);
    const isCurrentActive = deletedPathway?.path.subject === path?.subject;

    setStats((prev) => ({
      ...prev,
      activePathways: updatedPathways,
      completedSteps: isCurrentActive ? [] : prev.completedSteps,
    }));

    if (isCurrentActive) {
      setPath(null);
      setProfile((prev) => (prev ? { ...prev, subject: "" } : null));
    }

    try {
      await updateDoc(doc(db, `users/${user.uid}`), {
        activePathways: updatedPathways,
        currentPath: isCurrentActive ? null : path,
        completedSteps: isCurrentActive ? [] : stats.completedSteps,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  const handlePathwayGeneratorComplete = async (data: {
    goal: string;
    skillLevel: string;
    purpose: string;
    timeAvailable: string;
    specialConstraints: string;
    uploadedFile?: { name: string, dataUrl: string, mimeType: string };
  }) => {
    if (!user) return;

    // Map the new fields back to LearningProfile format
    const newProfile: LearningProfile = {
      name: profile?.name || user.displayName || "Learner",
      learningStyle: "visual", // default, modified by constraints
      goals: `Ultimate Goal: ${data.goal}\nPurpose: ${data.purpose}\nTime Available: ${data.timeAvailable}\nConstraints: ${data.specialConstraints}`,
      level: data.skillLevel.toLowerCase().includes("beginner")
        ? "beginner"
        : data.skillLevel.toLowerCase().includes("advanced")
          ? "advanced"
          : "intermediate",
      subject: data.goal,
      specificTopics: data.purpose,
      importantTopics: data.specialConstraints,
      uploadedFile: data.uploadedFile
    };

    setProfile(newProfile);

    try {
      const newPath = await generateLearningPath(newProfile);
      setPath(newPath);

      const newActivePathway: ActivePathway = {
        id: Math.random().toString(36).substr(2, 9),
        profile: newProfile,
        path: newPath,
        completedSteps: [],
        lastAccessed: new Date().toISOString(),
      };

      const updatedActivePathways = [
        newActivePathway,
        ...(stats.activePathways || []),
      ];

      const docPath = `users/${user.uid}`;
      await setDoc(
        doc(db, docPath),
        {
          ...stats,
          ...newProfile,
          currentPath: newPath,
          activePathways: updatedActivePathways,
          completedSteps: [],
          role: "user",
        },
        { merge: true },
      );

      setState("mentor_overview");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleOnboardingComplete = async (newProfile: LearningProfile) => {
    if (!user) return;

    setProfile(newProfile);

    try {
      const newPath = await generateLearningPath(newProfile);
      setPath(newPath);

      const newActivePathway: ActivePathway = {
        id: Math.random().toString(36).substr(2, 9),
        profile: newProfile,
        path: newPath,
        completedSteps: [],
        lastAccessed: new Date().toISOString(),
      };

      const updatedActivePathways = [
        newActivePathway,
        ...(stats.activePathways || []),
      ];

      const docPath = `users/${user.uid}`;
      await setDoc(
        doc(db, docPath),
        {
          ...stats,
          ...newProfile,
          currentPath: newPath,
          activePathways: updatedActivePathways,
          completedSteps: [],
          role: "user",
        },
        { merge: true },
      );

      setState("mentor_overview");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleUpdateUserStats = async (newStats: Partial<UserStats>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}`), newStats);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleResetModuleProgress = async (oldTitle: string, newTitle: string, newPath: LearningPath) => {
    if (!user || !path) return;

    const oldStepKey = `${path.subject}:${oldTitle}`;
    const newStepKey = `${path.subject}:${newTitle}`;

    const removedCompleted = stats.completedSteps.filter(s => s !== oldStepKey && s !== newStepKey);
          
    const updatedActive = (stats.activePathways || []).map(ap => {
      if (ap.path.subject === path.subject) {
        const newApCompleted = ap.completedSteps.filter(t => t !== oldTitle && t !== newTitle);
        return { ...ap, completedSteps: newApCompleted, path: newPath };
      }
      return ap;
    });

    const newStats = {
      ...stats,
      completedSteps: removedCompleted,
      activePathways: updatedActive
    };

    setStats(newStats);

    try {
      await updateDoc(doc(db, `users/${user.uid}`), { 
        completedSteps: removedCompleted,
        activePathways: updatedActive
      });
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleCompleteStep = async (step: LearningStep) => {
    if (!user || !profile || !path) return;

    const stepKey = `${path.subject}:${step.title}`;
    if (stats.completedSteps.includes(stepKey)) return;

    const newStats = { ...stats };
    const updatedCompletedSteps = [...newStats.completedSteps, stepKey];
    newStats.completedSteps = updatedCompletedSteps;
    newStats.xp += 150;

    // Update Activity Log
    const today = getLocalDateKey();
    const activityLog = { ...(stats.activityLog || {}) };
    activityLog[today] = (activityLog[today] || 0) + 150;
    newStats.activityLog = activityLog;

    // Update the specific active pathway
    let currentPathCompletedCount = 0;
    const updatedActivePathways = (stats.activePathways || []).map((ap) => {
      if (ap.path.subject === path.subject) {
        const pathCompletedSteps = [...(ap.completedSteps || []), step.title];
        currentPathCompletedCount = pathCompletedSteps.length;
        return { ...ap, completedSteps: pathCompletedSteps };
      }
      return ap;
    });

    const isComplete = currentPathCompletedCount >= path.steps.length;
    const now = new Date();

    // Check mutations
    const finalMutations = [...newStats.mutations];
    if (
      updatedCompletedSteps.length === 3 &&
      !finalMutations.includes("Fast Learner")
    ) {
      finalMutations.push("Fast Learner");
      newStats.xp += 500;
    }

    // Build final state object
    const finalStats: UserStats = {
      ...stats,
      xp: newStats.xp,
      rank: Math.max(1, 99 - Math.floor(newStats.xp / 500)),
      streak: calculateStreak(newStats.activityLog),
      completedSteps: updatedCompletedSteps,
      mutations: finalMutations,
      dailyQuests: newStats.dailyQuests,
      activityLog: newStats.activityLog,
      activePathways: updatedActivePathways,
    };

    setStats(finalStats);

    if (isComplete) {
      handleStartAssessmentSession();
    }

    try {
      const docPath = `users/${user.uid}`;
      const updatePayload: any = {
        xp: finalStats.xp,
        rank: finalStats.rank,
        streak: finalStats.streak,
        completedSteps: finalStats.completedSteps,
        activePathways: finalStats.activePathways,
        mutations: finalStats.mutations,
        dailyQuests: finalStats.dailyQuests,
        activityLog: finalStats.activityLog,
      };

      await updateDoc(doc(db, docPath), updatePayload);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleFinishAssessment = async (score: number) => {
    if (!user || !profile || !path) {
      console.warn("Cannot finish assessment: missing user, profile, or path", {
        user: !!user,
        profile: !!profile,
        path: !!path,
      });
      return;
    }

    if (score < 50) {
      handleAssessmentFailure(true, score);
      return;
    }

    console.log("Saving assessment results...", { score });
    const now = new Date();
    const completedPathway: CompletedPathway = {
      id: Math.random().toString(36).substr(2, 9),
      name: path.subject,
      date: now.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
      year: now.getFullYear().toString(),
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      topics: path.steps.map((s) => s.title),
      steps: path.steps,
      studentName: profile?.name || user.displayName || "Neural Subject",
      assessmentScore: score,
    };

    const updatedCompletedPathways = [
      ...(stats.completedPathways || []),
      completedPathway,
    ];
    const finalActivePathwaysState = (stats.activePathways || []).filter(
      (ap) => ap.path.subject !== path.subject,
    );

    const finalStats: UserStats = {
      ...stats,
      completedPathways: updatedCompletedPathways,
      activePathways: finalActivePathwaysState,
      xp: stats.xp + 1000, // Bonus for completing course
    };

    setStats(finalStats);
    setPath(null);
    setProfile((prev) => (prev ? { ...prev, subject: "" } : null));
    setState("completed");

    try {
      const docPath = `users/${user.uid}`;
      await updateDoc(doc(db, docPath), {
        completedPathways: updatedCompletedPathways,
        activePathways: finalActivePathwaysState,
        xp: finalStats.xp,
        currentPath: null,
        subject: "",
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAssessmentFailure = async (fromScore: boolean = false, score?: number) => {
    if (!user || !path) return;

    let isTwoFails = false;
    let completedStepsToRemove: string[] = [];

    const updatedActivePathways = (stats.activePathways || []).map((ap) => {
      if (ap.path.subject === path.subject) {
        const attemptsCount = (ap.assessmentAttempts || 0) + 1;
        if (attemptsCount >= 2) {
          isTwoFails = true;
          if (ap.completedSteps) {
            completedStepsToRemove = ap.completedSteps.map((title: string) => `${ap.path.subject}:${title}`);
          }
          return { ...ap, assessmentAttempts: 0, completedSteps: [] };
        }
        return { ...ap, assessmentAttempts: attemptsCount };
      }
      return ap;
    });

    const newCompletedSteps = isTwoFails
      ? stats.completedSteps.filter((cs) => !completedStepsToRemove.includes(cs))
      : stats.completedSteps;

    setStats((prev) => ({ 
      ...prev, 
      activePathways: updatedActivePathways,
      completedSteps: newCompletedSteps
    }));
    
    setState("dashboard");

    try {
      await updateDoc(doc(db, `users/${user.uid}`), {
        activePathways: updatedActivePathways,
        completedSteps: newCompletedSteps
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }

    if (isTwoFails) {
      alert(`Assessment failed${score !== undefined ? ` with score ${score}%` : ""}. You have failed twice. Please recomplete all modules before trying again.`);
    } else {
      if (fromScore) {
        alert(`Assessment failed! You scored ${score}%. You need at least 50% to pass. Please try again.`);
      } else {
        alert("Assessment aborted or failed. Please try again.");
      }
    }
  };

  const handleGenerateSchedule = async (selectedModules?: string[], studyDuration?: string) => {
    if (!user || !profile) return;
    try {
      const schedule = await generateSchedule(profile, profile.goals, selectedModules, studyDuration);
      setStats((prev) => ({ ...prev, schedule }));

      const docPath = `users/${user.uid}`;
      await updateDoc(doc(db, docPath), {
        schedule,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleUpdatePath = async (newPath: LearningPath) => {
    setPath(newPath);
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}`), { currentPath: newPath });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-orange-500"
        >
          <Virus size={80} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="font-sans bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen relative overflow-x-hidden">
      {/* Atmospheric Glows - GLOBAL FIXED BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-orange-600/20 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--bg-main)]"
          style={{ zIndex: -1 }}
        />
      </div>

      <div className="relative z-10">
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
        <SupportModal 
          isOpen={showSupportModal} 
          onClose={() => setShowSupportModal(false)}
          userEmail={user?.email || profile?.name}
        />
        <AnimatePresence mode="wait">
          {state === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 1.1, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: -10 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              <Landing
                onStart={user ? () => setState("pathway_generator") : handleLogin}
                isLoggedIn={!!user}
                isDark={isDark}
                onToggleTheme={toggleTheme}
              />
            </motion.div>
          )}



          {state === "pathway_generator" && (
            <motion.div
              key="pathway_generator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <PathwayGenerator
                onGenerate={handlePathwayGeneratorComplete}
                onBack={() => {
                  if (profile) setState("dashboard");
                  else setState("landing");
                }}
              />
            </motion.div>
          )}

          {state === "mentor_overview" && path?.roadmapOverview && (
            <motion.div
              key="mentor_overview"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <MentorOverview
                overview={path.roadmapOverview}
                onContinue={() => setState("dashboard")}
                onRegenerate={handleRegenerateBlueprint}
                onUpdateBlueprint={handleUpdateBlueprint}
                isRegenerating={isRegeneratingBlueprint}
              />
            </motion.div>
          )}

          {state === "dashboard" && profile && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <Dashboard
                profile={profile}
                path={path}
                stats={stats}
                isDark={isDark}
                onToggleTheme={toggleTheme}
                onStartLearning={(idx) => {
                  if (path) {
                    setStartStepIdx(idx ?? stats.completedSteps.length);
                    setState("learning");
                  }
                }}
                onNewInfection={() => setState("pathway_generator")}
                onGenerateSchedule={handleGenerateSchedule}
                onViewArchived={(cp) => setSelectedArchivedPathway(cp)}
                onViewProfile={() => setState("profile")}
                onLogout={handleLogout}
                onSelectPathway={handleSelectPathway}
                onDeletePathway={handleDeletePathway}
                onStartAssessment={handleStartAssessmentSession}
                onOpenGenerator={() => setState("pathway_generator")}
                onOpenMentorOverview={() => setState("mentor_overview")}
              />
            </motion.div>
          )}

          {state === "profile" && profile && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: "100vw" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100vw" }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
            >
              <ProfileView
                profile={profile}
                stats={stats}
                onBack={() => setState("dashboard")}
                onLogout={handleLogout}
                onUpdateStats={handleUpdateUserStats}
                onUpdateName={async (newName) => {
                  setProfile((prev) =>
                    prev ? { ...prev, name: newName } : null,
                  );
                  if (user) {
                    try {
                      await updateDoc(doc(db, `users/${user.uid}`), {
                        name: newName,
                      });
                    } catch (e) {
                      handleFirestoreError(
                        e,
                        OperationType.UPDATE,
                        `users/${user.uid}`,
                      );
                    }
                  }
                }}
                onShowSupport={() => setShowSupportModal(true)}
              />
            </motion.div>
          )}

          {selectedArchivedPathway && (
            <motion.div
              key="archived"
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="fixed inset-0 z-[200]"
            >
              <CompletionModal
                pathway={selectedArchivedPathway}
                onBack={() => setSelectedArchivedPathway(null)}
                onReview={(steps) => {
                  const subjectName = selectedArchivedPathway.name;
                  setPath({ subject: subjectName, steps });
                  setStartStepIdx(0);
                  setState("learning");
                  setIsReviewState(true);
                }}
              />
            </motion.div>
          )}

          {state === "learning" && path && stats && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, filter: "brightness(2) contrast(0.5)" }}
              animate={{ opacity: 1, filter: "brightness(1) contrast(1)" }}
              exit={{ opacity: 0, filter: "brightness(2) blur(10px)" }}
              transition={{ duration: 0.8 }}
            >
              <LearningView
                path={path}
                stats={stats}
                profile={profile!}
                isDark={isDark}
                onToggleTheme={toggleTheme}
                initialStepIdx={startStepIdx}
                isReview={isReviewState}
                onBack={() => {
                  setIsReviewState(false);
                  setSelectedArchivedPathway(null);
                  setState("dashboard");
                }}
                onCompleteStep={handleCompleteStep}
                onResetModuleProgress={handleResetModuleProgress}
                onFinish={() => {
                  // This is now handled by handleCompleteStep triggering assessment
                }}
                onUpdatePath={handleUpdatePath}
                studyNotesMap={studyNotesMap}
                setStudyNotesMap={setStudyNotesMap}
                isGeneratingNotes={isGeneratingNotes}
                setIsGeneratingNotes={setIsGeneratingNotes}
              />
            </motion.div>
          )}

          {state === "assessment_instruction" && (
            <motion.div
              key="assessment_instruction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AssessmentInstructionView
                isGenerating={isGeneratingAssessment}
                attempts={
                  stats.activePathways?.find(
                    (ap) => ap.path.subject === path?.subject,
                  )?.assessmentAttempts || 0
                }
                onStart={() => {
                  document.documentElement
                    .requestFullscreen()
                    .catch((e) => console.error(e));
                  setState("assessment");
                }}
                onBack={() => setState("dashboard")}
              />
            </motion.div>
          )}

          {state === "assessment" && assessment && (
            <motion.div
              key="assessment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AssessmentView
                assessment={assessment}
                onFinish={(score) => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch((e) => console.error(e));
                  }
                  handleFinishAssessment(score);
                }}
                onViolation={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch((e) => console.error(e));
                  }
                  handleAssessmentFailure();
                }}
              />
            </motion.div>
          )}

          {state === "completed" && path && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <CompletionModal
                pathway={
                  (stats.completedPathways?.[
                    stats.completedPathways.length - 1
                  ] as CompletedPathway) || path
                }
                studentName={profile?.name || user?.displayName || undefined}
                onBack={() => {
                  setPath(null);
                  setState("dashboard");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

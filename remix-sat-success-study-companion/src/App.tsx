import React, { useState, useEffect, useRef, useMemo } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile, reload, signOut } from "firebase/auth";
import {
  User,
  Calendar,
  Flame,
  Target,
  TrendingUp,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  MessageSquare,
  Plus,
  RefreshCw,
  Sliders,
  HelpCircle,
  LogOut,
  ListTodo,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Calculator,
  Download,
  AlertCircle,
  Clock,
  Play,
  RotateCcw,
  Sparkle,
  Trash2,
  Check,
  LogIn,
  Edit,
  BookMarked,
  Smartphone,
  Share2,
  Bell,
  X,
  ShieldCheck,
  Bot,
  Home,
  BarChart2,
  Flag,
  Eye,
  EyeOff,
  CheckSquare,
  Layers,
  Bookmark
} from "lucide-react";
import { mockExam1 } from "./mockExamData";
import { aiPracticeQuestions } from "./aiPracticeData";
import { GeminiChatbot } from "./components/GeminiChatbot";
import { FirebaseAuthModal } from "./components/FirebaseAuthModal";
import { WidgetCard } from "./components/WidgetCard";
import { DuolingoLearnPath } from "./components/DuolingoLearnPath";
import { FormattedMarkdown, parseInlineMarkdown } from "./components/FormattedMarkdown";
import { SatMathReferenceModal } from "./components/SatMathReferenceModal";
import { DesmosCalculatorModal } from "./components/DesmosCalculatorModal";
import { FlashcardsModal } from "./components/FlashcardsModal";
import {
  auth,
  onAuthStateChanged,
  syncUserProfile,
  syncUserSettings,
  saveFirestoreStudyLog,
  fetchFirestoreStudyLogs,
  fetchFirestoreMistakes,
  saveFirestoreMistake,
  signInWithGoogle
} from "./lib/firebase";
import {
  StudentProfile,
  TimetableConfig,
  PracticeScore,
  TopicMastery,
  StudyTimeLog,
  Message,
  LeaderboardEntry,
  WeeklyChallenge,
  MistakeJournalEntry,
  Question
} from "./types";

export default function App() {
  // --- Persistent & Local States ---
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem("sat_profile");
    if (saved) return JSON.parse(saved);
    return {
      name: "",
      username: "",
      emoji: "🎓",
      testDate: "",
      targetMath: 700,
      targetReadingWriting: 700,
      currentMath: 200,
      currentReadingWriting: 200,
      focusPreference: "Balanced"
    };
  });

  // State for raw score input strings to allow free typing without premature clamping
  const [scoreInputs, setScoreInputs] = useState({
    currentMath: String(profile.currentMath || 200),
    targetMath: String(profile.targetMath || 700),
    currentReadingWriting: String(profile.currentReadingWriting || 200),
    targetReadingWriting: String(profile.targetReadingWriting || 700)
  });

  // Keep raw inputs in sync when profile state changes
  useEffect(() => {
    setScoreInputs({
      currentMath: String(profile.currentMath),
      targetMath: String(profile.targetMath),
      currentReadingWriting: String(profile.currentReadingWriting),
      targetReadingWriting: String(profile.targetReadingWriting)
    });
  }, [profile.currentMath, profile.targetMath, profile.currentReadingWriting, profile.targetReadingWriting]);

  const handleScoreInputChange = (field: keyof typeof scoreInputs, value: string) => {
    setScoreInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleScoreInputBlur = (field: keyof typeof scoreInputs, profileKey: keyof StudentProfile) => {
    const raw = parseInt(scoreInputs[field], 10);
    const valid = isNaN(raw) ? 200 : Math.min(800, Math.max(200, Math.round(raw / 10) * 10));
    setScoreInputs(prev => ({ ...prev, [field]: String(valid) }));
    setProfile(prev => ({ ...prev, [profileKey]: valid }));
  };

  const adjustScoreDelta = (profileKey: keyof StudentProfile, fieldKey: keyof typeof scoreInputs, delta: number) => {
    const current = (profile[profileKey] as number) || 200;
    const next = Math.min(800, Math.max(200, current + delta));
    setScoreInputs(prev => ({ ...prev, [fieldKey]: String(next) }));
    setProfile(prev => ({ ...prev, [profileKey]: next }));
  };

  const [timetable, setTimetable] = useState<TimetableConfig>(() => {
    const saved = localStorage.getItem("sat_timetable");
    if (saved) return JSON.parse(saved);
    return {
      availableSlots: ["Afternoon (12pm - 5pm)", "Evening (5pm - 9pm)"],
      timeCommitment: "2 hours",
      preference: "ai",
      schedule: {
        Monday: ["📚 Reading: Command of Evidence (60 mins)", "🧮 Math: Heart of Algebra - Linear Systems (60 mins)"],
        Tuesday: ["📝 Writing: Transitions & Punctuation (45 mins)", "🧮 Math: Solving Linear Inequalities (45 mins)"],
        Wednesday: ["📚 Reading: Science/Social Studies Passages (60 mins)", "🧮 Math: Desmos Tricks for quadratics (60 mins)"],
        Thursday: ["📝 Writing: Rhetorical Synthesis (45 mins)", "🧮 Math: Problem Solving & Data Interpretation (45 mins)"],
        Friday: ["📚 Reading: Vocabulary in Context (40 mins)", "🧮 Math: Geometry & Circle equations (40 mins)"],
        Saturday: ["⏱️ Mock Practice: Take Module 1 Practice (90 mins)", "🔍 Review: Deep-dive wrong answers (30 mins)"],
        Sunday: ["🕯️ Review: Flashcards, consolidate cheat sheets & plan next week"]
      }
    };
  });

  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem("sat_streak");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [streakLoggedToday, setStreakLoggedToday] = useState<boolean>(() => {
    const saved = localStorage.getItem("sat_streak_logged");
    return saved === "true";
  });

  const [mastery, setMastery] = useState<TopicMastery>(() => {
    const saved = localStorage.getItem("sat_mastery");
    if (saved) return JSON.parse(saved);
    return {
      algebra: 0,
      advancedMath: 0,
      geometry: 0,
      dataAnalysis: 0,
      readingComprehension: 0,
      grammar: 0,
      writing: 0
    };
  });

  const [scoresHistory, setScoresHistory] = useState<PracticeScore[]>(() => {
    const saved = localStorage.getItem("sat_scores_history");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [studyLogs, setStudyLogs] = useState<StudyTimeLog[]>(() => {
    const saved = localStorage.getItem("sat_study_logs");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [weeklyChallenges, setWeeklyChallenges] = useState<WeeklyChallenge[]>(() => {
    const saved = localStorage.getItem("sat_challenges");
    if (saved) return JSON.parse(saved);
    return [
      { id: "c1", text: "Complete 1 full Mock Exam section", points: 150, completed: false },
      { id: "c2", text: "Spend at least 3 hours studying Math", points: 100, completed: false },
      { id: "c3", text: "Perfect 3 Standard English Grammar drills", points: 80, completed: false },
      { id: "c4", text: "Initiate 2 chats with SAT Prep Assistant", points: 50, completed: false }
    ];
  });

  const [chatHistory, setChatHistory] = useState<Message[]>(() => {
    const saved = localStorage.getItem("sat_chat");
    if (saved) return JSON.parse(saved);
    return [
      {
        sender: "assistant",
        text: "Welcome! I am your personal SAT Prep Assistant, and I am so excited to help you on your journey to SAT success! I have reviewed your profile and I am ready to answer any questions you have about test strategies, content areas, study techniques, college admissions, test day preparation, anxiety management, or anything else SAT-related.",
        timestamp: "04:30 PM"
      }
    ];
  });

  // --- Dashboard Widget Grid States ---
  const [widgetFilter, setWidgetFilter] = useState<"all" | "profile" | "schedule" | "analytics">("all");
  const [widgetSearch, setWidgetSearch] = useState("");

  // --- Active Panels / Dialogs / Workflows ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "mock" | "weak" | "progress" | "analytics" | "mistakes" | "practice" | "chat">("dashboard");
  const [activeSubSection, setActiveSubSection] = useState<"schedule" | "goals" | "weak" | "quests" | "mastery">("schedule");
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [loadingWeakAreas, setLoadingWeakAreas] = useState(false);
  const [loadingScoreGap, setLoadingScoreGap] = useState(false);
  const [loadingProgressReport, setLoadingProgressReport] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // --- Firebase Auth & Firestore Persistence State ---
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [showFirebaseAuthModal, setShowFirebaseAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      setUser(u && (!u.providerData.some(p => p.providerId === "password") || u.emailVerified) ? { name: u.displayName || u.email || "SAT Student", email: u.email || "" } : null);
      if (u) {
        syncUserProfile(u.uid, profile);
        syncUserSettings(u.uid, reminderSettings);

        const logs = await fetchFirestoreStudyLogs(u.uid);
        if (logs && logs.length > 0) {
          setStudyLogs(logs);
        }

        const remoteMistakes = await fetchFirestoreMistakes(u.uid);
        if (remoteMistakes && remoteMistakes.length > 0) {
          setMistakeJournal(remoteMistakes);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Google Sign-In & Mistake Journal States ---
  const [user, setUser] = useState<{ name: string; email: string; picture?: string } | null>(null);

  // --- Student Registration & Auth Flow States ---
  const [authTab, setAuthTab] = useState<"register" | "login" | "verify" | "reset">("register");

  // Registration form inputs
  const [regFullName, setRegFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regCurrentMath, setRegCurrentMath] = useState<string | number>("");
  const [regCurrentReading, setRegCurrentReading] = useState<string | number>("");
  const [regTargetMath, setRegTargetMath] = useState<string | number>("");
  const [regTargetReading, setRegTargetReading] = useState<string | number>("");

  // Verification states
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [pendingVerificationToken, setPendingVerificationToken] = useState("");
  const [inputVerificationToken, setInputVerificationToken] = useState("");
  const [verificationSuccessMsg, setVerificationSuccessMsg] = useState("");

  // Login form inputs
  const [loginCredential, setLoginCredential] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [authErrorMsg, setAuthErrorMsg] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!regPassword) return { score: 0, label: "", color: "bg-slate-800", textColor: "text-slate-500", percent: "0%" };
    let score = 0;
    if (regPassword.length >= 6) score += 1;
    if (regPassword.length >= 10) score += 1;
    if (/[0-9]/.test(regPassword) && /[a-zA-Z]/.test(regPassword)) score += 1;
    if (/[^a-zA-Z0-9]/.test(regPassword)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500", textColor: "text-rose-400", percent: "25%" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500", textColor: "text-amber-400", percent: "50%" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-yellow-400", textColor: "text-yellow-300", percent: "75%" };
    return { score: 4, label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-400", percent: "100%" };
  }, [regPassword]);

  const [mistakeJournal, setMistakeJournal] = useState<MistakeJournalEntry[]>(() => {
    const saved = localStorage.getItem("sat_mistake_journal");
    if (saved) return JSON.parse(saved);
    return [];
  });

  // --- Daily Study Reminder & Today Study Tracking States ---
  const [reminderSettings, setReminderSettings] = useState<{
    enabled: boolean;
    time: string;
    targetMinutes: number;
  }>(() => {
    const saved = localStorage.getItem("sat_reminder_settings");
    if (saved) return JSON.parse(saved);
    return { enabled: true, time: "18:00", targetMinutes: 60 };
  });

  useEffect(() => {
    localStorage.setItem("sat_reminder_settings", JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateStr();

  const hasLoggedToday = useMemo(() => {
    if (streakLoggedToday) return true;
    return studyLogs.some(
      (log) => log.date === todayStr && (log.mathHours > 0 || log.readingHours > 0 || log.writingHours > 0)
    );
  }, [streakLoggedToday, studyLogs, todayStr]);

  const [reminderBannerDismissed, setReminderBannerDismissed] = useState<boolean>(() => {
    const saved = localStorage.getItem(`sat_reminder_dismissed_${todayStr}`);
    return saved === "true";
  });

  const handleDismissReminder = () => {
    setReminderBannerDismissed(true);
    localStorage.setItem(`sat_reminder_dismissed_${todayStr}`, "true");
  };

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);

  // Quick Study Log form input states
  const [quickLogMathHours, setQuickLogMathHours] = useState<number>(0.5);
  const [quickLogReadingHours, setQuickLogReadingHours] = useState<number>(0.5);
  const [quickLogWritingHours, setQuickLogWritingHours] = useState<number>(0);

  const handleLogTodayStudy = (math: number, reading: number, writing: number) => {
    const totalHours = math + reading + writing;
    if (totalHours <= 0) return;

    setStudyLogs((prev) => {
      const existingIdx = prev.findIndex((item) => item.date === todayStr);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          mathHours: updated[existingIdx].mathHours + math,
          readingHours: updated[existingIdx].readingHours + reading,
          writingHours: updated[existingIdx].writingHours + writing
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `l_${Date.now()}`,
            date: todayStr,
            mathHours: math,
            readingHours: reading,
            writingHours: writing
          }
        ];
      }
    });

    if (!streakLoggedToday) {
      setStreak((prev) => prev + 1);
      setStreakLoggedToday(true);
      localStorage.setItem("sat_streak_logged", "true");
    }

    if (firebaseUser) {
      saveFirestoreStudyLog(firebaseUser.uid, {
        date: todayStr,
        mathHours: math,
        readingHours: reading,
        writingHours: writing
      });
    }

    setShowQuickLogModal(false);
  };

  const handleResetAllData = () => {
    if (window.confirm("Are you sure you want to reset the dashboard and start afresh with no details filled in?")) {
      localStorage.removeItem("sat_profile");
      localStorage.removeItem("sat_streak");
      localStorage.removeItem("sat_streak_logged");
      localStorage.removeItem("sat_mastery");
      localStorage.removeItem("sat_scores_history");
      localStorage.removeItem("sat_study_logs");
      localStorage.removeItem("sat_challenges");
      localStorage.removeItem("sat_mistake_journal");
      localStorage.removeItem("sat_chat");
      
      setProfile({
        name: "",
        username: "",
        emoji: "🎓",
        testDate: "",
        targetMath: 700,
        targetReadingWriting: 700,
        currentMath: 200,
        currentReadingWriting: 200,
        focusPreference: "Balanced"
      });
      setStreak(0);
      setStreakLoggedToday(false);
      setMastery({
        algebra: 0,
        advancedMath: 0,
        geometry: 0,
        dataAnalysis: 0,
        readingComprehension: 0,
        grammar: 0,
        writing: 0
      });
      setScoresHistory([]);
      setStudyLogs([]);
      setMistakeJournal([]);
      setScoreInputs({
        currentMath: "200",
        targetMath: "700",
        currentReadingWriting: "200",
        targetReadingWriting: "700"
      });
    }
  };

  const [showAuthSetupModal, setShowAuthSetupModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert("To install on your mobile device:\n\n1. Open this app URL in Chrome on Android.\n2. Tap the browser menu (⋮ icon in top right).\n3. Tap 'Add to Home screen' or 'Install app'.\n\nIt will launch as a standalone app!");
    }
  };

  // --- AI Practice States ---
  const [practiceIndex, setPracticeIndex] = useState<number>(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [practiceShowExplanation, setPracticeShowExplanation] = useState<boolean>(false);
  const [addedPracticeMistakes, setAddedPracticeMistakes] = useState<Record<string, boolean>>({});
  const [tempPracticeNotes, setTempPracticeNotes] = useState<Record<string, string>>({});

  // --- Mistake Journal States ---
  const [mistakeSearch, setMistakeSearch] = useState("");
  const [mistakeFilter, setMistakeFilter] = useState<"all" | "resolved" | "unresolved">("all");
  const [expandedMistakeExplanations, setExpandedMistakeExplanations] = useState<Record<string, boolean>>({});
  const [editingMistakeNotes, setEditingMistakeNotes] = useState<Record<string, string>>({});
  const [mistakeAttemptAnswers, setMistakeAttemptAnswers] = useState<Record<string, number>>({});
  const [mistakeAttemptFeedback, setMistakeAttemptFeedback] = useState<Record<string, string>>({});



  // Output responses from backend
  const [weakAreaDescription, setWeakAreaDescription] = useState("I struggle with system of equations word problems, relative clauses punctuation (commas vs semicolons), and vocabulary in context.");
  const [weakAreaAnalysis, setWeakAreaAnalysis] = useState("");
  const [scoreGapRoadmap, setScoreGapRoadmap] = useState("");
  const [latestProgressReport, setLatestProgressReport] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  // Tools & Modals State
  const [showMathReferenceModal, setShowMathReferenceModal] = useState(false);
  const [showDesmosModal, setShowDesmosModal] = useState(false);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);

  // Digital SAT Testing Tools State
  const [examDifficultyRW, setExamDifficultyRW] = useState<"easy" | "hard" | "standard">("standard");
  const [examDifficultyMath, setExamDifficultyMath] = useState<"easy" | "hard" | "standard">("standard");
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, number[]>>({});
  const [hideExamTimer, setHideExamTimer] = useState(false);
  const [showQuestionNavModal, setShowQuestionNavModal] = useState(false);

  // Mistake Journal Enhanced State
  const [mistakeCategoryFilter, setMistakeCategoryFilter] = useState<string>("all");
  const [mistakeSectionFilter, setMistakeSectionFilter] = useState<string>("all");
  const [practiceMistakesActive, setPracticeMistakesActive] = useState(false);
  const [practiceMistakeIndex, setPracticeMistakeIndex] = useState(0);
  const [practiceMistakeAnswer, setPracticeMistakeAnswer] = useState<number | null>(null);
  const [practiceMistakeSubmitted, setPracticeMistakeSubmitted] = useState(false);

  // Input for new mock score / logging
  const [latestInputMath, setLatestInputMath] = useState(640);
  const [latestInputRW, setLatestInputRW] = useState(600);
  const [additionalStudyUpdateInput, setAdditionalStudyUpdateInput] = useState("Focused heavily on quadratic curves and Standard English conventions this week.");

  // --- Mock SAT Exam Interactive State Machine ---
  const [mockExamActive, setMockExamActive] = useState(false);
  const [examCurrentSection, setExamCurrentSection] = useState<"readingWriting" | "math">("readingWriting");
  const [examModule, setExamModule] = useState<"module1" | "module2">("module1");
  const [examDifficulty, setExamDifficulty] = useState<"easy" | "hard" | "standard">("standard"); // Module 1 is standard
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({}); // maps question id to selected index
  const [examTimer, setExamTimer] = useState(0); // in seconds
  const [examTimerActive, setExamTimerActive] = useState(false);
  const [examStage, setExamStage] = useState<"intro" | "testing" | "transition" | "break" | "completed">("intro");
  const [examScoreResult, setExamScoreResult] = useState<any>(null);
  const [showAnswerExplanations, setShowAnswerExplanations] = useState(false);

  // Timer Reference
  const timerRef = useRef<any>(null);

  // --- Profile state sync to localStorage ---
  useEffect(() => {
    localStorage.setItem("sat_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("sat_timetable", JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem("sat_streak", streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem("sat_streak_logged", streakLoggedToday ? "true" : "false");
  }, [streakLoggedToday]);

  useEffect(() => {
    localStorage.setItem("sat_mastery", JSON.stringify(mastery));
  }, [mastery]);

  useEffect(() => {
    localStorage.setItem("sat_scores_history", JSON.stringify(scoresHistory));
  }, [scoresHistory]);

  useEffect(() => {
    localStorage.setItem("sat_study_logs", JSON.stringify(studyLogs));
  }, [studyLogs]);

  useEffect(() => {
    localStorage.setItem("sat_challenges", JSON.stringify(weeklyChallenges));
  }, [weeklyChallenges]);

  useEffect(() => {
    localStorage.setItem("sat_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem("sat_mistake_journal", JSON.stringify(mistakeJournal));
  }, [mistakeJournal]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("sat_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("sat_user");
    }
  }, [user]);

  // Handle Google Sign-In message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "OAUTH_AUTH_SUCCESS") {
        const loggedUser = event.data.user;
        setUser(loggedUser);
        
        // Sync profile name to Google user name and update username
        setProfile((prev) => ({
          ...prev,
          name: loggedUser.name,
          username: loggedUser.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_")
        }));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // --- Date countdown calculations ---
  const calculateDaysLeft = () => {
    const target = new Date("2026-08-15");
    const today = new Date("2026-06-04"); // Fixed baseline date based on prompt's study baseline
    const diffTime = Math.abs(target.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // --- API Calls to Express Backend ---

  // --- Google, Apple & Microsoft OAuth Sign-In Utilities ---
  const handleGoogleSignIn = async () => {
    setAuthErrorMsg("");
    try {
      const loggedIn = await signInWithGoogle();
      setUser({ name: loggedIn.displayName || loggedIn.email || "SAT Student", email: loggedIn.email || "" });
    } catch (err: any) {
      setAuthErrorMsg(err?.message || "Google sign-in failed. Check your Firebase Authentication settings.");
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const res = await fetch("/api/auth/apple-url");
      const data = await res.json();
      if (data.configured && data.url) {
        const width = 500;
        const height = 655;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        window.open(
          data.url,
          "Apple Sign-In",
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );
      } else {
        setShowAuthSetupModal(true);
      }
    } catch (err) {
      console.error("Apple Auth URL fetch error:", err);
      setShowAuthSetupModal(true);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      const res = await fetch("/api/auth/microsoft-url");
      const data = await res.json();
      if (data.configured && data.url) {
        const width = 500;
        const height = 655;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        window.open(
          data.url,
          "Microsoft Sign-In",
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );
      } else {
        setShowAuthSetupModal(true);
      }
    } catch (err) {
      console.error("Microsoft Auth URL fetch error:", err);
      setShowAuthSetupModal(true);
    }
  };

  // Student credentials are managed by Firebase Authentication, never by the legacy Express memory store.
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg("");
    if (!regFullName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setAuthErrorMsg("Please fill in all required fields.");
      return;
    }
    if (regPassword.length < 8) {
      setAuthErrorMsg("Choose a password with at least 8 characters.");
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setAuthErrorMsg("Passwords do not match.");
      return;
    }
    setAuthLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      await updateProfile(result.user, { displayName: regFullName.trim() });
      const updatedProfile = {
        ...profile, name: regFullName.trim(), username: regUsername.trim(),
        currentMath: Number(regCurrentMath) || profile.currentMath,
        currentReadingWriting: Number(regCurrentReading) || profile.currentReadingWriting,
        targetMath: Number(regTargetMath) || profile.targetMath,
        targetReadingWriting: Number(regTargetReading) || profile.targetReadingWriting
      };
      setProfile(updatedProfile);
      localStorage.setItem("sat_profile", JSON.stringify(updatedProfile));
      await sendEmailVerification(result.user);
      setPendingVerificationEmail(result.user.email || regEmail.trim());
      setVerificationSuccessMsg("A real verification email has been sent. Check your inbox and spam folder.");
      setAuthTab("verify");
    } catch (err: any) {
      setAuthErrorMsg(err?.code === "auth/email-already-in-use"
        ? "This email is already registered. Please sign in."
        : err?.message || "Registration failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStudentVerify = async (_tokenToVerify?: string) => {
    setAuthErrorMsg("");
    setAuthLoading(true);
    try {
      if (!auth.currentUser) {
        setAuthTab("login");
        setAuthErrorMsg("Please sign in after verifying your email.");
        return;
      }
      await reload(auth.currentUser);
      if (!auth.currentUser.emailVerified) {
        setAuthErrorMsg("Email not verified yet. Open the email from Firebase, click the link, then try again.");
        return;
      }
      const verified = auth.currentUser;
      setUser({ name: verified.displayName || verified.email || "SAT Student", email: verified.email || "" });
      setVerificationSuccessMsg("Email verified! Welcome to SAT Prep Pro.");
    } catch (err: any) {
      setAuthErrorMsg(err?.message || "Could not check email verification.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg("");
    if (!loginCredential.trim() || !loginPassword) {
      setAuthErrorMsg("Enter your email and password.");
      return;
    }
    setAuthLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, loginCredential.trim(), loginPassword);
      await reload(result.user);
      if (!result.user.emailVerified) {
        setPendingVerificationEmail(result.user.email || loginCredential.trim());
        setAuthTab("verify");
        setAuthErrorMsg("Please verify your email using the link in your inbox.");
        return;
      }
      setUser({ name: result.user.displayName || result.user.email || "SAT Student", email: result.user.email || "" });
    } catch (err: any) {
      setAuthErrorMsg(err?.code === "auth/invalid-credential"
        ? "Incorrect email or password."
        : err?.message || "Sign in failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // OTP codes are created and verified only on the server; never expose secrets in the browser.
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg("");
    setVerificationSuccessMsg("");
    const email = resetEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthErrorMsg("Enter the email address you used to create your account.");
      return;
    }
    if (resetStep === "verify") {
      if (!/^\d{6}$/.test(resetCode.trim())) {
        setAuthErrorMsg("Enter the six-digit code from your email.");
        return;
      }
      if (resetNewPassword.length < 8) {
        setAuthErrorMsg("Your new password must contain at least eight characters.");
        return;
      }
      if (resetNewPassword !== resetConfirmPassword) {
        setAuthErrorMsg("New passwords do not match.");
        return;
      }
    }
    setAuthLoading(true);
    try {
      const response = await fetch(resetStep === "request" ? "/api/password-reset/request" : "/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetStep === "request"
          ? { email }
          : { email, code: resetCode.trim(), newPassword: resetNewPassword })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to reset password at the moment.");
      }
      if (resetStep === "request") {
        setResetStep("verify");
        setVerificationSuccessMsg("If this email belongs to a SAT Prep Pro account, we'll send a six-digit code. Check your inbox and spam folder.");
      } else {
        setResetStep("request");
        setResetCode("");
        setResetNewPassword("");
        setResetConfirmPassword("");
        setLoginCredential(email);
        setLoginPassword("");
        setAuthTab("login");
        setVerificationSuccessMsg("Password updated successfully. You can now sign in.");
      }
    } catch (err: any) {
      setAuthErrorMsg(err?.message || "Unable to reset password. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem("sat_user");
  };

  const addQuestionToJournal = (question: Question, selectedIndex: number, notes: string) => {
    // Check if already in the journal
    if (mistakeJournal.some((m) => m.question.id === question.id)) {
      setMistakeJournal((prev) =>
        prev.map((m) =>
          m.question.id === question.id
            ? { ...m, userNotes: notes, dateAdded: new Date().toLocaleDateString() }
            : m
        )
      );
      return;
    }

    const newEntry: MistakeJournalEntry = {
      id: "mistake-" + Date.now(),
      question,
      selectedAnswerIndex: selectedIndex,
      userNotes: notes,
      dateAdded: new Date().toLocaleDateString(),
      resolved: false
    };

    setMistakeJournal((prev) => [newEntry, ...prev]);
  };

  // 1. Generate Timetable using Gemini AI
  const handleGenerateTimetable = async () => {
    setLoadingTimetable(true);
    try {
      const response = await fetch("/api/generate-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          slots: timetable.availableSlots,
          commitment: timetable.timeCommitment,
          focus: profile.focusPreference
        })
      });
      if (response.ok) {
        const data = await response.json();
        setTimetable(prev => ({
          ...prev,
          schedule: data
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTimetable(false);
    }
  };

  // 2. Analyze Weak Areas using Gemini AI
  const handleAnalyzeWeakAreas = async () => {
    setLoadingWeakAreas(true);
    try {
      const response = await fetch("/api/analyze-weak-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: weakAreaDescription,
          profile
        })
      });
      if (response.ok) {
        const data = await response.json();
        setWeakAreaAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWeakAreas(false);
    }
  };

  // 3. Analyze Target Score Gap
  const handleAnalyzeScoreGap = async () => {
    setLoadingScoreGap(true);
    try {
      const response = await fetch("/api/analyze-score-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile })
      });
      if (response.ok) {
        const data = await response.json();
        setScoreGapRoadmap(data.roadmap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScoreGap(false);
    }
  };

  // Load roadmap on initial load if empty
  useEffect(() => {
    if (!scoreGapRoadmap) {
      handleAnalyzeScoreGap();
    }
  }, [profile.currentMath, profile.currentReadingWriting, profile.targetMath, profile.targetReadingWriting]);

  // 4. Generate Comprehensive Progress Report
  const handleGenerateProgressReport = async () => {
    setLoadingProgressReport(true);
    try {
      const response = await fetch("/api/generate-progress-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          latestMath: latestInputMath,
          latestRW: latestInputRW,
          updates: additionalStudyUpdateInput,
          streak,
          history: scoresHistory
        })
      });
      if (response.ok) {
        const data = await response.json();
        setLatestProgressReport(data.report);

        // Add to historical scores
        const newScore: PracticeScore = {
          id: "h-" + Date.now(),
          date: "June 04, 2026",
          math: latestInputMath,
          readingWriting: latestInputRW,
          notes: additionalStudyUpdateInput || "Practice test progress report check-in"
        };
        setScoresHistory(prev => [...prev, newScore]);

        // Automatically unlock a Badge and award leaderboard points
        setWeeklyChallenges(prev =>
          prev.map(c => (c.id === "c1" ? { ...c, completed: true } : c))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProgressReport(false);
    }
  };

  // 5. Chat Assistant API call
  const handleSendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg: Message = {
      sender: "user",
      text: chatMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setChatMessage("");
    setLoadingChat(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          profile,
          currentStreak: streak,
          weakAreas: weakAreaDescription
        })
      });
      if (response.ok) {
        const data = await response.json();
        const assistantMsg: Message = {
          sender: "assistant",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, assistantMsg]);

        // Complete the "chat with assistant" weekly challenge if not already
        setWeeklyChallenges(prev =>
          prev.map(c => (c.id === "c4" ? { ...c, completed: true } : c))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  // --- Interactive Streak Increment ---
  const handleLogStudyToday = () => {
    if (!streakLoggedToday) {
      setStreak(prev => prev + 1);
      setStreakLoggedToday(true);
    }
  };

  const handleResetStreak = () => {
    setStreak(0);
    setStreakLoggedToday(false);
  };

  // --- Weekly Challenges Completion Logic ---
  const toggleChallenge = (id: string) => {
    setWeeklyChallenges(prev =>
      prev.map(c => {
        if (c.id === id) {
          return { ...c, completed: !c.completed };
        }
        return c;
      })
    );
  };

  // Calculate cumulative user points from completed challenges + streak bonus
  const calculateTotalPoints = () => {
    const challengePoints = weeklyChallenges
      .filter(c => c.completed)
      .reduce((sum, c) => sum + c.points, 0);
    const streakBonus = streak * 15;
    return 1000 + challengePoints + streakBonus; // baseline 1000
  };

  // Dynamic Leaderboard list
  const getLeaderboard = (): LeaderboardEntry[] => {
    const userPoints = calculateTotalPoints();
    const list: LeaderboardEntry[] = [
      { name: "Minji Park", username: "minji_sat", emoji: "🦉", points: 1450, streak: 21 },
      { name: "Carter Vance", username: "cv_math_pro", emoji: "🧠", points: 1320, streak: 12 },
      { name: "Sarah Jenkins", username: "sjenkins_elite", emoji: "⚡", points: 1180, streak: 8 },
      { name: "Devesh Patel", username: "devesh_sat_1600", emoji: "🚀", points: 1110, streak: 18 }
    ];

    // Inject current user
    list.push({
      name: profile.name,
      username: profile.username,
      emoji: profile.emoji,
      points: userPoints,
      streak: streak,
      isUser: true
    });

    // Sort by points descending
    return list.sort((a, b) => b.points - a.points);
  };

  // --- ADAPTIVE MOCK SAT EXAM SIMULATOR LOGIC ---
  const startMockExam = () => {
    setUserAnswers({});
    setFlaggedQuestions({});
    setEliminatedOptions({});
    setHideExamTimer(false);
    setShowQuestionNavModal(false);
    setExamCurrentSection("readingWriting");
    setExamModule("module1");
    setExamDifficulty("standard");
    setExamDifficultyRW("standard");
    setExamDifficultyMath("standard");
    // Load Module 1 Reading Writing questions (5 questions)
    setExamQuestions(mockExam1.readingWriting.module1);
    setCurrentQuestionIndex(0);
    setExamTimer(10 * 60); // 10 minutes for this micro simulation
    setExamTimerActive(true);
    setExamStage("testing");
    setMockExamActive(true);
    setExamScoreResult(null);
    setShowAnswerExplanations(false);
  };

  // Timer effect
  useEffect(() => {
    if (examTimerActive && examTimer > 0) {
      timerRef.current = setInterval(() => {
        setExamTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeExpiry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examTimerActive, examTimer]);

  const handleTimeExpiry = () => {
    alert("Time has expired for this module! Submitting your current answers.");
    submitCurrentModule();
  };

  const handleSelectOption = (qId: string, optIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optIndex
    }));
  };

  const toggleFlagQuestion = (qId: string) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const toggleEliminateOption = (qId: string, optIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEliminatedOptions(prev => {
      const current = prev[qId] || [];
      if (current.includes(optIndex)) {
        return { ...prev, [qId]: current.filter(i => i !== optIndex) };
      } else {
        return { ...prev, [qId]: [...current, optIndex] };
      }
    });
  };

  const submitCurrentModule = () => {
    if (examCurrentSection === "readingWriting" && examModule === "module1") {
      // Calculate Module 1 score for Reading Writing
      const m1Questions = mockExam1.readingWriting.module1;
      let correctCount = 0;
      m1Questions.forEach(q => {
        if (userAnswers[q.id] === q.correctIndex) {
          correctCount++;
        }
      });

      // Adaptive Routing!
      // If student gets 3 or more out of 5 correct, route to HARD, else EASY
      const targetDiff = correctCount >= 3 ? "hard" : "easy";
      setExamDifficultyRW(targetDiff);
      setExamDifficulty(targetDiff);
      setExamModule("module2");
      setExamQuestions(
        targetDiff === "hard"
          ? mockExam1.readingWriting.module2Hard
          : mockExam1.readingWriting.module2Easy
      );
      setCurrentQuestionIndex(0);
      setExamTimer(10 * 60); // reset 10 mins
      setExamStage("transition");
    } else if (examCurrentSection === "readingWriting" && examModule === "module2") {
      // Finished Reading & Writing!
      // Enter 10-minute break stage
      setExamTimerActive(false);
      setExamStage("break");
      setExamTimer(10); // 10 seconds micro-break for simulator
      setExamTimerActive(true);
    } else if (examCurrentSection === "math" && examModule === "module1") {
      // Calculate Module 1 score for Math
      const m1Questions = mockExam1.math.module1;
      let correctCount = 0;
      m1Questions.forEach(q => {
        if (userAnswers[q.id] === q.correctIndex) {
          correctCount++;
        }
      });

      // Adaptive Routing for Math!
      const targetDiff = correctCount >= 3 ? "hard" : "easy";
      setExamDifficultyMath(targetDiff);
      setExamDifficulty(targetDiff);
      setExamModule("module2");
      setExamQuestions(
        targetDiff === "hard"
          ? mockExam1.math.module2Hard
          : mockExam1.math.module2Easy
      );
      setCurrentQuestionIndex(0);
      setExamTimer(10 * 60); // reset 10 mins
      setExamStage("testing");
    } else if (examCurrentSection === "math" && examModule === "module2") {
      // Finished entire exam!
      setExamTimerActive(false);
      calculateFinalScores();
    }
  };

  const skipBreak = () => {
    setExamTimerActive(false);
    // Start Math Section Module 1
    setExamCurrentSection("math");
    setExamModule("module1");
    setExamDifficulty("standard");
    setExamQuestions(mockExam1.math.module1);
    setCurrentQuestionIndex(0);
    setExamTimer(10 * 60); // 10 minutes
    setExamTimerActive(true);
    setExamStage("testing");
  };

  // Calculate scaled scores based on raw correct counts
  const calculateFinalScores = () => {
    // 1. Reading & Writing Module 1 + 2
    const rwM1 = mockExam1.readingWriting.module1;
    const rwM2 = examDifficultyRW === "hard" ? mockExam1.readingWriting.module2Hard : mockExam1.readingWriting.module2Easy;
    
    let rwCorrect = 0;
    rwM1.forEach(q => { if (userAnswers[q.id] === q.correctIndex) rwCorrect++; });
    rwM2.forEach(q => { if (userAnswers[q.id] === q.correctIndex) rwCorrect++; });

    // Scaled formula: 200 is base. 10 questions total.
    let finalRWScore = 200;
    if (examDifficultyRW === "hard") {
      finalRWScore = 440 + rwCorrect * 36;
    } else {
      finalRWScore = 260 + rwCorrect * 34;
    }
    finalRWScore = Math.min(800, Math.max(200, Math.round(finalRWScore / 10) * 10));

    // 2. Math Module 1 + 2
    const mathM1 = mockExam1.math.module1;
    const mathM2 = examDifficultyMath === "hard" ? mockExam1.math.module2Hard : mockExam1.math.module2Easy;

    let mathCorrect = 0;
    mathM1.forEach(q => { if (userAnswers[q.id] === q.correctIndex) mathCorrect++; });
    mathM2.forEach(q => { if (userAnswers[q.id] === q.correctIndex) mathCorrect++; });

    let finalMathScore = 200;
    if (examDifficultyMath === "hard") {
      finalMathScore = 460 + mathCorrect * 34;
    } else {
      finalMathScore = 280 + mathCorrect * 32;
    }
    finalMathScore = Math.min(800, Math.max(200, Math.round(finalMathScore / 10) * 10));

    const totalRaw = rwCorrect + mathCorrect;
    const finalTotal = finalRWScore + finalMathScore;

    // Percentile estimate
    let percentile = "Below 50th Percentile";
    if (finalTotal >= 1550) percentile = "99+th Percentile (Top 1% Nationally)";
    else if (finalTotal >= 1500) percentile = "98th Percentile (Top 2% Nationally)";
    else if (finalTotal >= 1450) percentile = "96th Percentile (Top 4% Nationally)";
    else if (finalTotal >= 1400) percentile = "93rd Percentile (Top 7% Nationally)";
    else if (finalTotal >= 1350) percentile = "90th Percentile (Top 10% Nationally)";
    else if (finalTotal >= 1300) percentile = "86th Percentile (Top 14% Nationally)";
    else if (finalTotal >= 1200) percentile = "75th - 84th Percentile";
    else if (finalTotal >= 1100) percentile = "60th - 73rd Percentile";
    else if (finalTotal >= 1000) percentile = "45th - 58th Percentile";

    const allAdministeredQuestions = [
      ...rwM1.map(q => ({ ...q, sectionName: "Reading & Writing (Module 1 - Standard)" })),
      ...rwM2.map(q => ({ ...q, sectionName: `Reading & Writing (Module 2 - ${examDifficultyRW.toUpperCase()})` })),
      ...mathM1.map(q => ({ ...q, sectionName: "Math (Module 1 - Standard)" })),
      ...mathM2.map(q => ({ ...q, sectionName: `Math (Module 2 - ${examDifficultyMath.toUpperCase()})` }))
    ];

    const result = {
      rwCorrect,
      mathCorrect,
      totalRaw,
      rwScore: finalRWScore,
      mathScore: finalMathScore,
      totalScore: finalTotal,
      percentile,
      difficultyRW: examDifficultyRW,
      difficultyMath: examDifficultyMath,
      allQuestions: allAdministeredQuestions
    };

    setExamScoreResult(result);
    setExamStage("completed");

    // Push into student test history
    const testRecord: PracticeScore = {
      id: "mock-" + Date.now(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      math: finalMathScore,
      readingWriting: finalRWScore,
      notes: `Adaptive Mock SAT Exam #1 - Completed (${finalTotal} Total: ${finalRWScore} RW, ${finalMathScore} Math)`,
      isMockExam: true
    };
    setScoresHistory(prev => [...prev, testRecord]);

    // Update mastery based on success
    setMastery(prev => ({
      algebra: Math.min(100, prev.algebra + (mathCorrect >= 4 ? 3 : 1)),
      advancedMath: Math.min(100, prev.advancedMath + (mathCorrect >= 3 ? 4 : 1)),
      grammar: Math.min(100, prev.grammar + (rwCorrect >= 4 ? 4 : 2)),
      readingComprehension: Math.min(100, prev.readingComprehension + (rwCorrect >= 3 ? 3 : 1)),
      geometry: Math.min(100, prev.geometry + 2),
      dataAnalysis: Math.min(100, prev.dataAnalysis + 2),
      writing: Math.min(100, prev.writing + 2)
    }));
  };

  const addQuestionToMistakeJournal = (
    q: Question,
    selectedIndex: number,
    category: "Careless Error" | "Concept Gap" | "Misread / Trap" | "Time Pressure" | "General" = "Concept Gap"
  ) => {
    const existing = mistakeJournal.find(m => m.question.id === q.id);
    if (existing) {
      alert("This question is already in your Mistake Journal!");
      return;
    }
    const newEntry: MistakeJournalEntry = {
      id: "mistake-" + Date.now(),
      question: q,
      selectedAnswerIndex: selectedIndex,
      userNotes: `Logged from Mock Exam (${q.topic}). Review this concept thoroughly.`,
      dateAdded: new Date().toISOString().split("T")[0],
      resolved: false,
      categoryTag: category,
      section: q.id.startsWith("rw") ? "Reading & Writing" : "Math"
    };
    setMistakeJournal(prev => [newEntry, ...prev]);
    if (firebaseUser) {
      saveFirestoreMistake(firebaseUser.uid, newEntry).catch(() => {});
    }
    alert("Saved to your SAT Mistake Journal!");
  };

  const applyMockScoresToProfile = () => {
    if (examScoreResult) {
      setProfile(prev => ({
        ...prev,
        currentMath: examScoreResult.mathScore,
        currentReadingWriting: examScoreResult.rwScore
      }));
      alert("Scores successfully updated on your Student Profile!");
      setMockExamActive(false);
      setExamStage("intro");
    }
  };

  // Format countdown timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Dynamic Badge Unlocks
  const isBadgeUnlocked = (badgeType: string) => {
    if (badgeType === "welcome") return streak >= 1;
    if (badgeType === "star") return streak >= 3 || scoresHistory.length > 2;
    if (badgeType === "warrior") return streak >= 7;
    if (badgeType === "master") return streak >= 30;
    if (badgeType === "improvement") {
      const initialTotal = 620 + 580; // Default base total
      const currentTotal = profile.currentMath + profile.currentReadingWriting;
      return currentTotal > initialTotal || scoresHistory.some(h => (h.math + h.readingWriting) > initialTotal);
    }
    return false;
  };

  const generatedTimetable = useMemo(() => {
    if (!timetable.schedule) return "";
    if (typeof timetable.schedule === "string") return timetable.schedule;
    return Object.entries(timetable.schedule)
      .map(([day, tasks]) => `### ${day}\n` + (Array.isArray(tasks) ? tasks.map(t => `- ${t}`).join("\n") : String(tasks)))
      .join("\n\n");
  }, [timetable.schedule]);

  const leaderboardList: LeaderboardEntry[] = useMemo(() => [
    { name: profile.name || "You", username: profile.username || "student", emoji: profile.emoji || "🎓", targetScore: (profile.targetMath || 700) + (profile.targetReadingWriting || 700), points: 1420, streak: streak || 5, isUser: true },
    { name: "Alex Chen", username: "alex_c", emoji: "⚡", targetScore: 1540, points: 1850, streak: 14 },
    { name: "Sophia Rodriguez", username: "sophia_r", emoji: "🌟", targetScore: 1510, points: 1620, streak: 9 },
    { name: "Marcus Vance", username: "marcus_v", emoji: "🔥", targetScore: 1480, points: 1390, streak: 7 },
    { name: "Emily Watson", username: "emily_w", emoji: "🎯", targetScore: 1450, points: 1210, streak: 4 }
  ], [profile, streak]);

  const topicMasteryList = useMemo(() => [
    { topic: "Algebra & Linear Equations", masteryPercent: mastery.algebra || 65 },
    { topic: "Advanced Math & Quadratics", masteryPercent: mastery.advancedMath || 50 },
    { topic: "Geometry & Trigonometry", masteryPercent: mastery.geometry || 70 },
    { topic: "Problem Solving & Data Analysis", masteryPercent: mastery.dataAnalysis || 80 },
    { topic: "Reading Information & Ideas", masteryPercent: mastery.readingComprehension || 75 },
    { topic: "Standard English Conventions", masteryPercent: mastery.grammar || 85 },
    { topic: "Craft & Structure / Expression", masteryPercent: mastery.writing || 60 }
  ], [mastery]);

  if (!user) {
    return (
      <div id="sat-auth-gate" className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto my-auto">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-lg w-full bg-slate-950/90 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 backdrop-blur-md z-10 flex flex-col items-center text-center space-y-5 my-6">
          
          {/* Logo Badge & Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/20 border-2 border-indigo-400/40 mb-3 bg-white p-0.5">
              <img src="/app-icon.jpg" alt="SAT Pro Brain Mascot" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">SAT Prep Pro</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium max-w-sm">
              Your realistic Digital SAT preparation platform. Full adaptive mock tests, official math formulas, Desmos graphing, and AI diagnostic tutoring.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="w-full grid grid-cols-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => { setAuthTab("register"); setAuthErrorMsg(""); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${authTab === "register" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              📝 Create Account
            </button>
            <button
              onClick={() => { setAuthTab("login"); setAuthErrorMsg(""); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${authTab === "login" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              🔑 Sign In
            </button>
          </div>

          {/* Global Alert Notification Banner */}
          {verificationSuccessMsg && (
            <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-300 text-xs text-left font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none mt-0.5" />
              <div>{verificationSuccessMsg}</div>
            </div>
          )}

          {authErrorMsg && (
            <div className="w-full bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs text-left font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-none mt-0.5" />
              <div>{authErrorMsg}</div>
            </div>
          )}

          {/* REGISTRATION FORM VIEW */}
          {authTab === "register" && (
            <form onSubmit={handleStudentRegister} className="w-full text-left space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Student Account Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username *</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. arivera2026"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. alex@school.edu"
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Real-time Password Strength Bar & Password Match Indicator */}
              {regPassword && (
                <div className="space-y-1 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className={passwordStrength.textColor}>{passwordStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.percent }}
                    ></div>
                  </div>
                  {regPasswordConfirm && (
                    <div className="text-[10px] font-bold pt-1 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-slate-400">Match Status:</span>
                      {regPassword === regPasswordConfirm ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Passwords Match
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Passwords Do Not Match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Score Benchmark Inputs */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  Current & Target SAT Scores
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="block text-[9px] font-bold text-indigo-400 uppercase">Current Math</span>
                    <input
                      type="number"
                      min={200}
                      max={800}
                      value={regCurrentMath}
                      onChange={(e) => setRegCurrentMath(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 600"
                      className="w-full text-center font-black text-sm bg-transparent text-white focus:outline-none placeholder:text-slate-600 placeholder:font-normal"
                    />
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="block text-[9px] font-bold text-indigo-400 uppercase">Current Reading</span>
                    <input
                      type="number"
                      min={200}
                      max={800}
                      value={regCurrentReading}
                      onChange={(e) => setRegCurrentReading(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 580"
                      className="w-full text-center font-black text-sm bg-transparent text-white focus:outline-none placeholder:text-slate-600 placeholder:font-normal"
                    />
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="block text-[9px] font-bold text-emerald-400 uppercase">Target Math</span>
                    <input
                      type="number"
                      min={200}
                      max={800}
                      value={regTargetMath}
                      onChange={(e) => setRegTargetMath(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 750"
                      className="w-full text-center font-black text-sm bg-transparent text-white focus:outline-none placeholder:text-slate-600 placeholder:font-normal"
                    />
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="block text-[9px] font-bold text-emerald-400 uppercase">Target Reading</span>
                    <input
                      type="number"
                      min={200}
                      max={800}
                      value={regTargetReading}
                      onChange={(e) => setRegTargetReading(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 730"
                      className="w-full text-center font-black text-sm bg-transparent text-white focus:outline-none placeholder:text-slate-600 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Register Student Account & Send Verification Link →"}
              </button>
            </form>
          )}

          {/* VERIFICATION LINK / CODE VIEW */}
          {authTab === "verify" && (
            <div className="w-full text-left space-y-4 bg-slate-900/80 p-5 rounded-2xl border border-indigo-500/30">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-2 border border-indigo-500/40">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-white text-base">Check Your Verification Inbox</h3>
                <p className="text-xs text-slate-400">
                  A verification link and 6-digit code were sent to:
                </p>
                <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 font-bold text-xs">
                  {pendingVerificationEmail || "your email address"}
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 space-y-3">
                <p>We sent a verification link to your email address. Click the link in your inbox (or spam folder), then return here.</p>
                <button type="button" onClick={() => handleStudentVerify()} disabled={authLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer">
                  {authLoading ? "Checking..." : "I've verified my email — Continue"}
                </button>
                <button type="button" onClick={async () => {
                  try {
                    if (!auth.currentUser) { setAuthErrorMsg("Sign in first to resend verification."); return; }
                    await sendEmailVerification(auth.currentUser);
                    setVerificationSuccessMsg("Verification email resent. Please check your inbox.");
                  } catch (err: any) { setAuthErrorMsg(err?.message || "Could not resend verification email."); }
                }} className="w-full text-indigo-300 underline cursor-pointer">Resend verification email</button>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => { setAuthTab("register"); setAuthErrorMsg(""); }}
                  className="text-xs text-slate-400 hover:text-indigo-300 cursor-pointer font-medium"
                >
                  ← Back to Registration Form
                </button>
              </div>
            </div>
          )}

          {/* LOGIN FORM VIEW */}
          {authTab === "login" && (
            <form onSubmit={handleStudentLogin} className="w-full text-left space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={loginCredential}
                  onChange={(e) => setLoginCredential(e.target.value)}
                  placeholder="e.g. alex@school.edu"
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password *</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-right">
                <button type="button" onClick={() => { setResetEmail(loginCredential); setResetStep("request"); setResetCode(""); setResetNewPassword(""); setResetConfirmPassword(""); setAuthErrorMsg(""); setVerificationSuccessMsg(""); setAuthTab("reset"); }} className="text-xs font-bold text-indigo-300 hover:text-indigo-200 hover:underline cursor-pointer">Forgot password?</button>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sign In to Student Dashboard →"}
              </button>

              <div className="text-center pt-2 border-t border-slate-800/80">
                <p className="text-xs text-slate-400">
                  Don't have a student account yet?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthTab("register"); setAuthErrorMsg(""); }}
                    className="text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* PASSWORD RESET FORM VIEW */}
          {authTab === "reset" && (
            <form onSubmit={handlePasswordReset} className="w-full text-left space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-sm font-black text-indigo-300">Reset your password</h2>
                <p className="text-xs text-slate-400 mt-2">
                  {resetStep === "request"
                    ? "Enter your account email. SAT Prep Pro will send you a six-digit one-time code."
                    : "Enter the six-digit code from your email, then choose a new password. The code expires after 10 minutes."}
                </p>
              </div>
              <div>
                <label htmlFor="sat-reset-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                <input id="sat-reset-email" type="email" autoComplete="email" required autoFocus={resetStep === "request"}
                  readOnly={resetStep === "verify"} value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              {resetStep === "verify" && (
                <>
                  <div>
                    <label htmlFor="sat-reset-code" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">6-Digit One-Time Code *</label>
                    <input id="sat-reset-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                      required value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white tracking-widest text-center placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label htmlFor="sat-reset-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password *</label>
                    <input id="sat-reset-password" type="password" autoComplete="new-password" minLength={8} required
                      value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label htmlFor="sat-reset-password-confirm" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password *</label>
                    <input id="sat-reset-password-confirm" type="password" autoComplete="new-password" minLength={8} required
                      value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <button type="button" onClick={() => { setResetStep("request"); setAuthErrorMsg(""); setVerificationSuccessMsg(""); }}
                    className="w-full text-xs text-indigo-300 hover:text-indigo-200 underline font-bold cursor-pointer">Request a new code</button>
                </>
              )}
              <button type="submit" disabled={authLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
                {authLoading ? "Please wait..." : resetStep === "request" ? "Send Verification Code" : "Verify Code & Reset Password"}
              </button>
              <button type="button" onClick={() => { setAuthTab("login"); setResetStep("request"); setAuthErrorMsg(""); setVerificationSuccessMsg(""); }}
                className="w-full text-xs text-slate-400 hover:text-indigo-300 font-bold cursor-pointer">← Back to Sign In</button>
            </form>
          )}

          {/* Social Sign-In Options (Google, Apple, Microsoft) */}
          <div className="w-full pt-2.5 border-t border-slate-800/60 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
              Or Sign In with Social Account
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                id="auth-google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.01]"
                title="Sign In with Google"
              >
                <svg className="w-3.5 h-3.5 flex-none" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.14 3.01-3.23 5.08v4.22h5.21c3.05-2.81 4.81-6.96 4.81-11.13z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-5.21-4.22c-1.44.97-3.28 1.55-5.25 1.55-4.04 0-7.46-2.73-8.68-6.4H.76v4.36C2.75 20.31 7.02 24 12 24z" />
                  <path fill="#FBBC05" d="M3.32 12.02c-.31-.9-.49-1.87-.49-2.87s.18-1.97.49-2.87V1.92H.76C-.19 3.82-.73 6.06-.73 8.4s.54 4.58 1.49 6.48l2.56-4.86z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.02 0 2.75 3.69.76 8.4l2.56 4.86c1.22-3.67 4.64-6.4 8.68-6.4z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                id="auth-apple-signin-btn"
                type="button"
                onClick={() => setAuthErrorMsg("Apple sign-in is not configured. Please use email or Google.")}
                className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.01]"
                title="Sign In with Apple"
              >
                <svg className="w-3.5 h-3.5 flex-none fill-current text-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96.99-3.1-.98.04-2.19.66-2.88 1.47-.62.72-1.16 1.88-1.01 3 .1.01 2.22-.55 2.9-1.37z"/>
                </svg>
                <span>Apple</span>
              </button>

              <button
                id="auth-microsoft-signin-btn"
                type="button"
                onClick={() => setAuthErrorMsg("Microsoft sign-in is not configured. Please use email or Google.")}
                className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.01]"
                title="Sign In with Microsoft"
              >
                <svg className="w-3.5 h-3.5 flex-none" viewBox="0 0 23 23">
                  <path fill="#f25022" d="M1 1h10v10H1z"/>
                  <path fill="#7fba00" d="M12 1h10v10H12z"/>
                  <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                  <path fill="#ffb900" d="M12 12h10v10H12z"/>
                </svg>
                <span>Microsoft</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div id="sat-app-root" className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-slate-100 text-slate-900 font-sans antialiased">
      {sidebarOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 bg-slate-900/40 z-40" onClick={() => setSidebarOpen(false)} />}
      {/* DESKTOP LEFT SIDEBAR NAVIGATION */}
      <aside onClick={(event) => { if ((event.target as HTMLElement).closest("button")) setSidebarOpen(false); }}
        className={`${sidebarOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 w-60 lg:w-64 bg-white border-r border-slate-200 h-full flex-col justify-between p-4 z-50 shadow-2xl overflow-y-auto`}>
        <div className="space-y-5">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md border-2 border-indigo-200 shrink-0 bg-white p-0.5">
              <img src="/app-icon.jpg" alt="SAT Pro Brain Icon" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-800 flex items-center gap-1 leading-none">
                SAT PREP PRO
              </h1>
              <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded uppercase mt-1 inline-block">
                DIGITAL SAT PLATFORM
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              id="tab-dashboard"
              onClick={() => { setActiveTab("dashboard"); setMockExamActive(false); }}
              className={`w-full px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer border-b-2 ${
                activeTab === "dashboard"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
            >
              <span className="text-base">🏠</span>
              <span>LEARN PATH</span>
            </button>

            <button
              id="tab-practice"
              onClick={() => { setActiveTab("practice"); setMockExamActive(false); }}
              className={`w-full px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer border-b-2 ${
                activeTab === "practice"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
            >
              <span className="text-base">🎯</span>
              <span>PRACTICE DRILLS</span>
            </button>

            <button
              id="tab-mock"
              onClick={() => { setActiveTab("mock"); if(!mockExamActive) setExamStage("intro"); }}
              className={`w-full px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer border-b-2 ${
                activeTab === "mock"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-500 shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
            >
              <span className="text-base">⏱️</span>
              <span>MOCK SAT EXAM</span>
            </button>

            <button
              id="tab-mistakes"
              onClick={() => { setActiveTab("mistakes"); setMockExamActive(false); }}
              className={`w-full px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer border-b-2 ${
                activeTab === "mistakes"
                  ? "bg-amber-50 text-amber-700 border-amber-500 shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
            >
              <span className="text-base">📔</span>
              <span>MISTAKE JOURNAL</span>
            </button>

            <button
              id="tab-chat"
              onClick={() => { setActiveTab("chat"); setMockExamActive(false); }}
              className={`w-full px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer border-b-2 ${
                activeTab === "chat"
                  ? "bg-purple-50 text-purple-700 border-purple-500 shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
            >
              <span className="text-base">🤖</span>
              <span>AI TUTOR CHAT</span>
            </button>

            <button
              id="tab-weak"
              onClick={() => { setActiveTab("weak"); setMockExamActive(false); }}
              className={`w-full px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer border-b-2 ${
                activeTab === "weak"
                  ? "bg-rose-50 text-rose-700 border-rose-500 shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
            >
              <span className="text-base">🔍</span>
              <span>WEAK AREAS</span>
            </button>

            <button
              id="tab-progress"
              onClick={() => { setActiveTab("progress"); setMockExamActive(false); }}
              className={`w-full px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer border-b-2 ${
                activeTab === "progress"
                  ? "bg-blue-50 text-blue-700 border-blue-500 shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
            >
              <span className="text-base">📈</span>
              <span>PROGRESS REPORT</span>
            </button>

            <button
              id="tab-analytics"
              onClick={() => { setActiveTab("analytics"); setMockExamActive(false); }}
              className={`w-full px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer border-b-2 ${
                activeTab === "analytics"
                  ? "bg-teal-50 text-teal-700 border-teal-500 shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
              }`}
            >
              <span className="text-base">📊</span>
              <span>ANALYTICS & STATS</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Extras */}
        <div className="space-y-2 pt-3 border-t border-slate-200">
          <button
            id="btn-get-apk-sidebar"
            onClick={() => setShowApkModal(true)}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Smartphone size={13} className="text-emerald-600" />
            <span>Get APK / Mobile App</span>
          </button>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase">SAT Countdown</p>
            <p className="text-xs font-black text-indigo-600 mt-0.5">
              {profile.testDate} • {calculateDaysLeft()} Days Left
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA CONTAINER */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER STATS BAR */}
        <header id="header-section" className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-2xs">
          <button type="button" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)} className="mr-2 shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100 cursor-pointer">☰</button>
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1 rounded-xl text-xs font-black shrink-0">
              <Flame size={15} className="text-orange-500 fill-orange-500 animate-pulse" />
              <span>{streak} DAYS</span>
            </div>

            {/* Points Gem Badge */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-xl text-xs font-black shrink-0">
              <span>💎</span>
              <span>{weeklyChallenges.filter(c => c.completed).length * 80 + streak * 50} PTS</span>
            </div>

            {/* Target Score Summary */}
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-1 rounded-xl text-xs font-black shrink-0">
              <Target size={14} className="text-indigo-600" />
              <span>SAT: {profile.currentMath + profile.currentReadingWriting} → {profile.targetMath + profile.targetReadingWriting}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Access SAT Tools */}
            <button
              id="btn-quick-reference"
              onClick={() => setShowMathReferenceModal(true)}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="Official Digital SAT Math Reference Sheet & Formulas"
            >
              <BookOpen size={13} className="text-indigo-600" />
              <span className="hidden lg:inline">Math Reference</span>
            </button>

            <button
              id="btn-quick-desmos"
              onClick={() => setShowDesmosModal(true)}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="Digital SAT Desmos Graphing & Scientific Calculator"
            >
              <Calculator size={13} className="text-emerald-600" />
              <span className="hidden lg:inline">Desmos Calc</span>
            </button>

            <button
              id="btn-quick-flashcards"
              onClick={() => setShowFlashcardsModal(true)}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="SAT Flashcards: Vocabulary, Math, and Grammar"
            >
              <Sparkles size={13} className="text-amber-600" />
              <span className="hidden lg:inline">Flashcards</span>
            </button>

            {/* Daily Reminder Button */}
            <button
              id="btn-daily-reminder"
              onClick={() => setShowReminderModal(true)}
              className="relative p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              title="Daily Study Reminder"
            >
              <Bell size={16} className="text-amber-500" />
              {reminderSettings.enabled && !hasLoggedToday && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
              )}
            </button>

            {/* Firebase Auth Button */}
            <button
              id="btn-firebase-auth"
              onClick={() => setShowFirebaseAuthModal(true)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck size={14} className="text-indigo-600" />
              <span className="hidden md:inline">{firebaseUser ? (firebaseUser.displayName || "Account") : "Auth"}</span>
            </button>

            {/* Google Profile Avatar */}
            {user ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1 pr-2">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full border border-indigo-300" />
                ) : (
                  <div className="w-6 h-6 bg-indigo-600 text-white font-bold rounded-full flex items-center justify-center text-[10px]">
                    {user.name.charAt(0)}
                  </div>
                )}
                <button onClick={handleGoogleSignOut} className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5">
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* CENTER SCROLLABLE SCREEN CONTENT AREA */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 bg-slate-50/60 pb-20 md:pb-6">
          {/* Daily Study Notification Banner */}
          {activeTab === "dashboard" && reminderSettings.enabled && !hasLoggedToday && !reminderBannerDismissed && (
            <div
              id="daily-study-reminder-banner"
              className="max-w-5xl mx-auto mb-5 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-white p-4 rounded-2xl shadow-md border border-amber-400/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in relative overflow-hidden"
            >
              <div className="flex items-start gap-3 z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
                  <Bell className="w-5 h-5 text-yellow-200 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-black bg-white/20 backdrop-blur-md rounded uppercase tracking-wider text-amber-100 border border-white/20">
                      ⏰ DAILY STUDY REMINDER ({reminderSettings.time})
                    </span>
                    <span className="text-[10px] font-bold text-amber-100">Target Goal: {reminderSettings.targetMinutes} mins/day</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white mt-1">
                    You haven't logged today's study session yet!
                  </h3>
                  <p className="text-xs text-amber-100 font-medium mt-0.5">
                    Record your study hours today to maintain your <span className="font-black text-white underline">{streak}-day study streak</span> and reach your SAT targets.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end z-10 shrink-0">
                <button
                  id="btn-quick-log-1hr"
                  onClick={() => handleLogTodayStudy(0.5, 0.5, 0)}
                  className="px-3.5 py-2 bg-white text-indigo-900 hover:bg-amber-50 text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02] flex items-center gap-1"
                >
                  ⚡ Quick Log 1 Hr
                </button>
                <button
                  id="btn-custom-log-hours"
                  onClick={() => setShowQuickLogModal(true)}
                  className="px-3.5 py-2 bg-amber-950/40 hover:bg-amber-950/60 text-white text-xs font-bold rounded-xl border border-white/30 transition-all cursor-pointer flex items-center gap-1"
                >
                  📝 Custom Hours
                </button>
                <button
                  id="btn-reminder-settings-banner"
                  onClick={() => setShowReminderModal(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all cursor-pointer"
                  title="Reminder Settings"
                >
                  <Sliders size={15} />
                </button>
                <button
                  id="btn-dismiss-reminder-banner"
                  onClick={handleDismissReminder}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl border border-white/20 transition-all cursor-pointer"
                  title="Dismiss Banner for Today"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>
          )}

          {/* Dedicated Gemini AI Chatbot View */}
          {activeTab === "chat" ? (
            <div className="animate-fade-in max-w-5xl mx-auto h-[82vh]">
              <GeminiChatbot />
            </div>
          ) : activeTab === "dashboard" ? (
            /* LEARNING ROADMAP & SUB-SECTIONS */
            <DuolingoLearnPath
              profile={profile}
              setProfile={setProfile}
              scoreInputs={scoreInputs}
              handleScoreInputChange={handleScoreInputChange}
              handleScoreInputBlur={handleScoreInputBlur}
              adjustScoreDelta={adjustScoreDelta}
              handleResetAllData={handleResetAllData}
              timetableConfig={timetable}
              setTimetableConfig={setTimetable}
              generatedTimetable={generatedTimetable}
              loadingTimetable={loadingTimetable}
              handleGenerateTimetable={handleGenerateTimetable}
              scoreGapAnalysis={scoreGapRoadmap}
              loadingScoreGap={loadingScoreGap}
              handleGenerateScoreGap={handleAnalyzeScoreGap}
              weakAreaDescription={weakAreaDescription}
              setWeakAreaDescription={setWeakAreaDescription}
              weakAreaAnalysis={weakAreaAnalysis}
              loadingWeakAreas={loadingWeakAreas}
              handleAnalyzeWeakAreas={handleAnalyzeWeakAreas}
              weeklyChallenges={weeklyChallenges}
              setWeeklyChallenges={setWeeklyChallenges}
              leaderboard={leaderboardList}
              streak={streak}
              topicMastery={topicMasteryList}
              setActiveTab={setActiveTab}
              setMockExamActive={setMockExamActive}
            />
          ) : (
            <div className="grid grid-cols-12 gap-4 w-full max-w-7xl mx-auto min-w-0">
            {/* Widget Category Filter & View Toolbar */}
            <div className="col-span-12 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Sliders size={13} className="text-indigo-600" /> Filter Widgets:
                </span>
                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
                  <button
                    onClick={() => setWidgetFilter("all")}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                      widgetFilter === "all" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    All Widgets
                  </button>
                  <button
                    onClick={() => setWidgetFilter("profile")}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                      widgetFilter === "profile" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    👤 Profile & Goals
                  </button>
                  <button
                    onClick={() => setWidgetFilter("schedule")}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                      widgetFilter === "schedule" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    📅 Schedule & Timetable
                  </button>
                  <button
                    onClick={() => setWidgetFilter("analytics")}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                      widgetFilter === "analytics" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    📊 Analytics & Mastery
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search widgets..."
                    value={widgetSearch}
                    onChange={(e) => setWidgetSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none w-36 sm:w-48"
                  />
                  {widgetSearch && (
                    <button
                      onClick={() => setWidgetSearch("")}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* LEFT COLUMN (Width 3): Profile, Streak & Badges */}
            {/* ========================================== */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-4">
          
          {/* Student Profile Quick-Editor Widget */}
          {(widgetFilter === "all" || widgetFilter === "profile") &&
            (!widgetSearch || "student profile name username test date target score math reading writing focus".includes(widgetSearch.toLowerCase())) && (
              <WidgetCard
                id="profile-card"
                title="Student Profile"
                subtitle="Score Targets & Prep Preferences"
                icon={User}
                badge={{ text: "Editable", color: "bg-indigo-50 text-indigo-600 border border-indigo-200" }}
                actions={
                  <button
                    onClick={handleResetAllData}
                    className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                    title="Clear all prefilled data and start fresh"
                  >
                    🔄 Reset
                  </button>
                }
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Student Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Username</label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Profile Emoji</label>
                      <select
                        value={profile.emoji}
                        onChange={(e) => setProfile({ ...profile, emoji: e.target.value })}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="🎓">🎓 Graduate</option>
                        <option value="🚀">🚀 Rocket</option>
                        <option value="🧠">🧠 Brain</option>
                        <option value="⚡">⚡ Lightning</option>
                        <option value="🦉">🦉 Owl</option>
                        <option value="🔥">🔥 Flame</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Current Math</label>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => adjustScoreDelta("currentMath", "currentMath", -10)} className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer">-</button>
                          <button type="button" onClick={() => adjustScoreDelta("currentMath", "currentMath", 10)} className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer">+</button>
                        </div>
                      </div>
                      <input
                        type="number"
                        step="10"
                        min="200"
                        max="800"
                        value={scoreInputs.currentMath}
                        onChange={(e) => handleScoreInputChange("currentMath", e.target.value)}
                        onBlur={() => handleScoreInputBlur("currentMath", "currentMath")}
                        className="w-full mt-1 bg-indigo-50/50 border border-indigo-200/80 rounded-lg px-2.5 py-1 text-xs font-black text-indigo-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Target Math</label>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => adjustScoreDelta("targetMath", "targetMath", -10)} className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer">-</button>
                          <button type="button" onClick={() => adjustScoreDelta("targetMath", "targetMath", 10)} className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer">+</button>
                        </div>
                      </div>
                      <input
                        type="number"
                        step="10"
                        min="200"
                        max="800"
                        value={scoreInputs.targetMath}
                        onChange={(e) => handleScoreInputChange("targetMath", e.target.value)}
                        onBlur={() => handleScoreInputBlur("targetMath", "targetMath")}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-black text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Current R&W</label>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => adjustScoreDelta("currentReadingWriting", "currentReadingWriting", -10)} className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer">-</button>
                          <button type="button" onClick={() => adjustScoreDelta("currentReadingWriting", "currentReadingWriting", 10)} className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer">+</button>
                        </div>
                      </div>
                      <input
                        type="number"
                        step="10"
                        min="200"
                        max="800"
                        value={scoreInputs.currentReadingWriting}
                        onChange={(e) => handleScoreInputChange("currentReadingWriting", e.target.value)}
                        onBlur={() => handleScoreInputBlur("currentReadingWriting", "currentReadingWriting")}
                        className="w-full mt-1 bg-indigo-50/50 border border-indigo-200/80 rounded-lg px-2.5 py-1 text-xs font-black text-indigo-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Target R&W</label>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => adjustScoreDelta("targetReadingWriting", "targetReadingWriting", -10)} className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer">-</button>
                          <button type="button" onClick={() => adjustScoreDelta("targetReadingWriting", "targetReadingWriting", 10)} className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold flex items-center justify-center cursor-pointer">+</button>
                        </div>
                      </div>
                      <input
                        type="number"
                        step="10"
                        min="200"
                        max="800"
                        value={scoreInputs.targetReadingWriting}
                        onChange={(e) => handleScoreInputChange("targetReadingWriting", e.target.value)}
                        onBlur={() => handleScoreInputBlur("targetReadingWriting", "targetReadingWriting")}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-black text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Total SAT Score Summary Card */}
                  <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg text-xs space-y-1.5 mt-2">
                    <div className="flex justify-between items-center font-bold text-slate-600">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Current Total SAT:</span>
                      <span className="text-xs font-black text-indigo-700">{profile.currentMath + profile.currentReadingWriting} <span className="text-[9px] text-slate-400 font-normal">/ 1600</span></span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-600">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Target Total SAT:</span>
                      <span className="text-xs font-black text-emerald-600">{profile.targetMath + profile.targetReadingWriting} <span className="text-[9px] text-slate-400 font-normal">/ 1600</span></span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[10px] font-extrabold">
                      <span className="text-slate-400 uppercase tracking-widest">Score Gap:</span>
                      <span className="text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                        +{Math.max(0, (profile.targetMath + profile.targetReadingWriting) - (profile.currentMath + profile.currentReadingWriting))} PTS NEEDED
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Test Date</label>
                    <input
                      type="text"
                      placeholder="August 15, 2026"
                      value={profile.testDate}
                      onChange={(e) => setProfile({ ...profile, testDate: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Focus Preference</label>
                    <select
                      value={profile.focusPreference}
                      onChange={(e) => setProfile({ ...profile, focusPreference: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none animate-pulse-once"
                    >
                      <option value="Balanced">Balanced Mix</option>
                      <option value="Math Focus">Math Intensive</option>
                      <option value="Reading & Writing Focus">Reading & Writing Intensive</option>
                      <option value="Desmos Shortcuts">Desmos Tricks & Shortcuts</option>
                      <option value="Standard Grammar Rules">Grammar & Writing Rules</option>
                    </select>
                  </div>
                </div>
              </WidgetCard>
            )}

          {/* Streak Tracker & Badges Widget */}
          {(widgetFilter === "all" || widgetFilter === "profile") &&
            (!widgetSearch || "streak badges flame study log milestone level".includes(widgetSearch.toLowerCase())) && (
              <WidgetCard
                id="streak-card"
                title="Study Streak & Badges"
                subtitle={`Level ${Math.floor(streak / 5) + 1} Consistent Learner`}
                icon={Flame}
                badge={{ text: `${streak} DAYS`, color: "bg-orange-50 text-orange-600 border border-orange-200" }}
              >
                <div className="flex items-center justify-center gap-2 my-2 bg-slate-50 py-3 rounded-lg border border-slate-100">
                  <span className="text-3xl animate-bounce">🔥</span>
                  <span className="text-4xl font-black text-slate-800 tracking-tight">{streak}</span>
                  <span className="text-xs font-bold text-slate-400 self-end mb-1">DAYS</span>
                </div>

                <div className="flex gap-2 my-3">
                  <button
                    id="log-study-btn"
                    onClick={handleLogStudyToday}
                    disabled={streakLoggedToday}
                    className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      streakLoggedToday
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 cursor-default"
                        : "bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:scale-[1.02]"
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    {streakLoggedToday ? "Studied Today!" : "Log Today's Study"}
                  </button>
                  <button
                    onClick={handleResetStreak}
                    title="Reset Streak"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg border border-slate-200 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>

                <p className="text-[10px] text-center text-slate-500 leading-tight italic bg-slate-50 p-2 rounded border border-slate-100">
                  {streak >= 14
                    ? "You are in the top 5% of consistent learners worldwide!"
                    : "Keep the flame burning! Consistent study yields maximum SAT memory retention."}
                </p>

                {/* Achievements / Badges Section */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Award size={13} className="text-indigo-500" /> Milestone Badges
                  </h3>
                  <div className="grid grid-cols-5 gap-1">
                    <div
                      title="Welcome Badge (Day 1 Started)"
                      className={`flex flex-col items-center p-1.5 rounded-lg border transition-all text-center ${
                        isBadgeUnlocked("welcome")
                          ? "bg-indigo-50 border-indigo-100 text-indigo-700 scale-100"
                          : "bg-slate-50 border-slate-100 text-slate-300 opacity-40"
                      }`}
                    >
                      <span className="text-xl">🌟</span>
                    </div>
                    <div
                      title="Rising Star Badge (Day 3 or practice test logged)"
                      className={`flex flex-col items-center p-1.5 rounded-lg border transition-all text-center ${
                        isBadgeUnlocked("star")
                          ? "bg-amber-50 border-amber-100 text-amber-700 scale-100"
                          : "bg-slate-50 border-slate-100 text-slate-300 opacity-40"
                      }`}
                    >
                      <span className="text-xl">⚔️</span>
                    </div>
                    <div
                      title="Week Warrior Badge (7-Day Streak)"
                      className={`flex flex-col items-center p-1.5 rounded-lg border transition-all text-center ${
                        isBadgeUnlocked("warrior")
                          ? "bg-orange-50 border-orange-100 text-orange-700 scale-100"
                          : "bg-slate-50 border-slate-100 text-slate-300 opacity-40"
                      }`}
                    >
                      <span className="text-xl">🔥</span>
                    </div>
                    <div
                      title="Monthly Master Badge (30-Day Streak)"
                      className={`flex flex-col items-center p-1.5 rounded-lg border transition-all text-center ${
                        isBadgeUnlocked("master")
                          ? "bg-purple-50 border-purple-100 text-purple-700 scale-100"
                          : "bg-slate-50 border-slate-100 text-slate-300 opacity-40"
                      }`}
                    >
                      <span className="text-xl">👑</span>
                    </div>
                    <div
                      title="Score Improvement Badge (Achieved score jump)"
                      className={`flex flex-col items-center p-1.5 rounded-lg border transition-all text-center ${
                        isBadgeUnlocked("improvement")
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700 scale-100"
                          : "bg-slate-50 border-slate-100 text-slate-300 opacity-40"
                      }`}
                    >
                      <span className="text-xl">📈</span>
                    </div>
                  </div>
                </div>
              </WidgetCard>
            )}
        </div>

        {/* ========================================== */}
        {/* MIDDLE COLUMN (Width 5): Score Roadmap, Timetable, Mock SAT or Special Actions */}
        {/* ========================================== */}
        <div className="col-span-12 md:col-span-8 lg:col-span-5 flex flex-col gap-4">
          
          {/* Active SAT Exam Interactive Module */}
          {mockExamActive ? (
            <div id="mock-exam-workspace" className="bg-indigo-950 text-white p-5 rounded-2xl shadow-xl border border-indigo-900 flex flex-col gap-4 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Exam Header */}
              <div className="flex items-center justify-between border-b border-indigo-900/80 pb-3 z-10 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-extrabold bg-indigo-600 rounded text-indigo-50">DIGITAL SAT SUITE</span>
                  <h2 className="text-sm font-bold text-slate-100">Official-Style Practice Test #1</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMathReferenceModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-700/60 rounded-lg text-xs font-semibold text-indigo-200 transition-all cursor-pointer"
                    title="Open Digital SAT Math Reference Sheet"
                  >
                    <BookOpen size={12} className="text-indigo-400" /> Reference
                  </button>
                  <button
                    onClick={() => setShowDesmosModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg text-xs font-semibold text-emerald-300 transition-all cursor-pointer"
                    title="Open Desmos Graphing Calculator"
                  >
                    <Calculator size={12} className="text-emerald-400" /> Desmos
                  </button>
                  <button
                    onClick={() => setMockExamActive(false)}
                    className="text-xs text-slate-400 hover:text-rose-400 underline ml-1 cursor-pointer"
                  >
                    Exit Exam
                  </button>
                </div>
              </div>

              {/* Exam States Panel */}
              {examStage === "intro" && (
                <div className="text-center py-6 flex flex-col items-center gap-4 z-10">
                  <div className="w-14 h-14 bg-indigo-900 rounded-2xl flex items-center justify-center text-2xl border border-indigo-700 shadow-md">
                    📝
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100">Adaptive Digital SAT Simulator</h3>
                    <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                      Experience realistic digital adaptive testing modeled after the official College Board Bluebook™ exam!
                    </p>
                  </div>
                  <div className="bg-indigo-900/40 p-4 rounded-xl text-left text-xs max-w-md w-full space-y-2 border border-indigo-800/60 leading-normal">
                    <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <span>📌</span> Digital SAT Test Blueprint:
                    </p>
                    <p>• <strong>Reading & Writing (Module 1)</strong>: 5 Questions (Standard Routing)</p>
                    <p>• <strong>Reading & Writing (Module 2)</strong>: 5 Questions (Calibrated to Accuracy)</p>
                    <p>• <strong>Break Period</strong>: 10-Second recharge transition</p>
                    <p>• <strong>Math (Module 1)</strong>: 5 Questions (Standard Routing)</p>
                    <p>• <strong>Math (Module 2)</strong>: 5 Questions (Calibrated to Accuracy)</p>
                    <div className="pt-2 border-t border-indigo-800/50 flex items-center justify-between text-[11px] text-slate-300">
                      <span>✓ Built-in Desmos Calculator</span>
                      <span>✓ Official Math Formulas</span>
                    </div>
                  </div>
                  <button
                    onClick={startMockExam}
                    className="w-full sm:w-auto px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={14} fill="currentColor" /> Begin Adaptive Exam
                  </button>
                </div>
              )}

              {examStage === "testing" && (
                <div className="flex flex-col gap-3.5 z-10">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center bg-indigo-900/60 px-3 py-2 rounded-xl border border-indigo-800/50 flex-wrap gap-2">
                    <div className="text-xs flex items-center gap-2">
                      <span className="font-bold text-indigo-200 capitalize">
                        {examCurrentSection === "readingWriting" ? "Section 1: Reading & Writing" : "Section 2: Math"}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-amber-300 uppercase tracking-widest text-[10px] font-black">
                        {examModule === "module1" ? "Module 1" : `Module 2 (${examDifficulty.toUpperCase()})`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Timer with Hide/Show toggle */}
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-900/50">
                        <Clock size={12} className="text-amber-400" />
                        <span>{hideExamTimer ? "--:--" : formatTime(examTimer)}</span>
                        <button
                          onClick={() => setHideExamTimer(!hideExamTimer)}
                          className="ml-1 text-[10px] text-amber-400 hover:text-amber-200 cursor-pointer"
                          title={hideExamTimer ? "Show Timer" : "Hide Timer"}
                        >
                          {hideExamTimer ? <Eye size={11} /> : <EyeOff size={11} />}
                        </button>
                      </div>

                      {/* Question Drawer Button */}
                      <button
                        onClick={() => setShowQuestionNavModal(!showQuestionNavModal)}
                        className="px-2 py-1 bg-indigo-800/80 hover:bg-indigo-700 text-indigo-200 text-[11px] font-bold rounded-lg border border-indigo-700/60 flex items-center gap-1 cursor-pointer"
                      >
                        <Layers size={11} />
                        <span>Q {currentQuestionIndex + 1}/{examQuestions.length}</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Progress Dots & Flags Bar */}
                  <div className="flex items-center justify-between gap-2 bg-indigo-950/40 p-1.5 rounded-lg border border-indigo-900/50">
                    <div className="flex items-center gap-1 flex-1">
                      {examQuestions.map((q, idx) => {
                        const isAnswered = userAnswers[q.id] !== undefined;
                        const isFlagged = !!flaggedQuestions[q.id];
                        const isCurrent = idx === currentQuestionIndex;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`flex-1 h-7 rounded-md text-[10px] font-black transition-all flex items-center justify-center gap-0.5 relative cursor-pointer ${
                              isCurrent
                                ? "bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-xs"
                                : isAnswered
                                ? "bg-indigo-900/90 text-indigo-200 border border-indigo-700/60"
                                : "bg-indigo-950 text-slate-400 border border-indigo-900/40 hover:bg-indigo-900/50"
                            }`}
                          >
                            <span>{idx + 1}</span>
                            {isFlagged && <Flag size={9} className="text-amber-400 fill-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question Body */}
                  {examQuestions[currentQuestionIndex] && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-800/50">
                          Question {currentQuestionIndex + 1} of {examQuestions.length} • {examQuestions[currentQuestionIndex].topic}
                        </span>

                        {/* Mark for Review / Flag Toggle */}
                        <button
                          onClick={() => toggleFlagQuestion(examQuestions[currentQuestionIndex].id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                            flaggedQuestions[examQuestions[currentQuestionIndex].id]
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "bg-indigo-900/30 text-slate-300 border-indigo-800/40 hover:text-white"
                          }`}
                        >
                          <Flag size={12} className={flaggedQuestions[examQuestions[currentQuestionIndex].id] ? "fill-amber-400 text-amber-400" : "text-slate-400"} />
                          <span>{flaggedQuestions[examQuestions[currentQuestionIndex].id] ? "Marked for Review" : "Mark for Review"}</span>
                        </button>
                      </div>

                      <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-800/40 text-slate-100 text-xs font-medium leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                        {examQuestions[currentQuestionIndex].text}
                      </div>

                      {/* Bluebook-style Elimination instructions */}
                      <p className="text-[10px] text-slate-400 italic">
                        Tip: Click an option to select your answer. Click the <span className="font-bold text-slate-300">✕</span> on the right to strike through and eliminate choices.
                      </p>

                      {/* Options */}
                      <div className="space-y-2">
                        {examQuestions[currentQuestionIndex].options.map((opt: string, optIdx: number) => {
                          const qId = examQuestions[currentQuestionIndex].id;
                          const isSelected = userAnswers[qId] === optIdx;
                          const isEliminated = (eliminatedOptions[qId] || []).includes(optIdx);

                          return (
                            <div
                              key={optIdx}
                              onClick={() => {
                                if (!isEliminated) {
                                  handleSelectOption(qId, optIdx);
                                }
                              }}
                              className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                                isEliminated
                                  ? "bg-slate-900/40 border-slate-800 text-slate-500 line-through opacity-60"
                                  : isSelected
                                  ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-950/50 scale-[1.01]"
                                  : "bg-indigo-900/20 border-indigo-800/50 text-slate-300 hover:bg-indigo-900/40 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 pr-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border ${
                                  isSelected
                                    ? "bg-white text-indigo-700 border-white"
                                    : "bg-indigo-950 text-slate-300 border-indigo-700"
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className={isEliminated ? "line-through" : ""}>{opt}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isSelected && !isEliminated && (
                                  <span className="w-4 h-4 bg-emerald-400 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black mr-1">
                                    ✓
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => toggleEliminateOption(qId, optIdx, e)}
                                  className={`p-1 rounded text-[11px] font-extrabold transition-all cursor-pointer ${
                                    isEliminated
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                                      : "text-slate-400 hover:text-rose-400 hover:bg-white/10"
                                  }`}
                                  title={isEliminated ? "Restore Option" : "Cross Out Option (Eliminate)"}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Exam Navigation Buttons */}
                  <div className="flex justify-between items-center border-t border-indigo-900/80 pt-3 mt-1">
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 text-xs font-bold rounded-lg border border-indigo-800 text-indigo-300 hover:text-white hover:bg-indigo-900/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft size={14} /> Back
                    </button>

                    <div className="text-[11px] text-slate-400 font-medium">
                      Question {currentQuestionIndex + 1} of {examQuestions.length}
                    </div>

                    {currentQuestionIndex < examQuestions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(examQuestions.length - 1, prev + 1))}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={submitCurrentModule}
                        className="px-5 py-2 text-xs font-black rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
                      >
                        Submit Module
                      </button>
                    )}
                  </div>
                </div>
              )}

              {examStage === "transition" && (
                <div className="text-center py-6 flex flex-col items-center gap-4 z-10 animate-pulse-once">
                  <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center text-2xl border border-amber-500/30">
                    <Sparkle size={24} className="animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 capitalize">Module 2 Routing Calibrated!</h3>
                    <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                      Your response accuracy on Module 1 has been analyzed to route your Digital SAT pathway.
                    </p>
                  </div>
                  <div className="bg-indigo-900/50 px-4 py-3 rounded-xl text-center border border-indigo-800/60 w-full max-w-md">
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Selected Adaptive Level</p>
                    <p className="text-lg font-black text-amber-300 uppercase tracking-tight mt-1">
                      {examDifficulty} Routing
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                      {examDifficulty === "hard"
                        ? "Great accuracy! You qualified for the higher-difficulty module, unlocking high-scoring percentiles."
                        : "Module 2 calibrated. Complete every remaining question carefully to maximize your scaled score."}
                    </p>
                  </div>
                  <button
                    onClick={() => setExamStage("testing")}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Start Module 2
                  </button>
                </div>
              )}

              {examStage === "break" && (
                <div className="text-center py-8 flex flex-col items-center gap-4 z-10">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-3xl border border-slate-800 shadow-inner">
                    ☕
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-100">Official SAT Break Period</h3>
                    <p className="text-xs text-slate-400 mt-1">Section 1 (Reading & Writing) complete. Prepare for Section 2 (Math).</p>
                  </div>
                  <div className="text-4xl font-extrabold text-amber-400 my-1 animate-pulse">
                    {formatTime(examTimer)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={skipBreak}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Skip Break & Begin Math Section
                    </button>
                  </div>
                </div>
              )}

              {examStage === "completed" && examScoreResult && (
                <div className="flex flex-col gap-4 z-10">
                  <div className="text-center">
                    <span className="text-4xl">🏆</span>
                    <h3 className="text-base font-black text-slate-100 mt-2">Mock Test Complete!</h3>
                    <p className="text-xs text-slate-400">Official Digital SAT diagnostic scaled report.</p>
                  </div>

                  {/* Scoreboard */}
                  <div className="grid grid-cols-3 gap-2 bg-indigo-900/40 p-4 rounded-xl border border-indigo-800/40 text-center">
                    <div>
                      <p className="text-[9px] font-bold text-indigo-300 uppercase">Reading & Writing</p>
                      <p className="text-xl font-black text-slate-100 mt-0.5">{examScoreResult.rwScore}</p>
                      <p className="text-[10px] text-indigo-400 font-semibold">{examScoreResult.rwCorrect}/10 raw</p>
                    </div>
                    <div className="border-x border-indigo-800">
                      <p className="text-[9px] font-bold text-indigo-300 uppercase">Math Score</p>
                      <p className="text-xl font-black text-slate-100 mt-0.5">{examScoreResult.mathScore}</p>
                      <p className="text-[10px] text-indigo-400 font-semibold">{examScoreResult.mathCorrect}/10 raw</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-emerald-400 uppercase">Total Composite</p>
                      <p className="text-xl font-black text-emerald-300 mt-0.5">{examScoreResult.totalScore}</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{examScoreResult.totalRaw}/20 correct</p>
                    </div>
                  </div>

                  {/* Percentile Banner */}
                  <div className="bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <div>
                        <p className="font-extrabold text-emerald-300">National Percentile Estimate</p>
                        <p className="text-[11px] text-emerald-400/80">{examScoreResult.percentile}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/60">
                      College Board Scale
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowAnswerExplanations(!showAnswerExplanations)}
                      className="w-full py-2 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 hover:text-white text-xs font-bold rounded-lg border border-indigo-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle size={14} />
                      {showAnswerExplanations ? "Hide Detailed Question Review" : `Review All Administered Questions (${examScoreResult.allQuestions?.length || 20})`}
                    </button>

                    <button
                      onClick={applyMockScoresToProfile}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
                    >
                      Apply Scores to My Student Profile
                    </button>
                  </div>

                  {/* Complete Question Review List */}
                  {showAnswerExplanations && (
                    <div className="space-y-3 mt-2 max-h-80 overflow-y-auto pr-1">
                      <h4 className="text-xs font-bold text-slate-200 uppercase border-b border-indigo-900 pb-1">Full Exam Breakdown:</h4>
                      
                      {(examScoreResult.allQuestions || []).map((q: any, idx: number) => {
                        const ans = userAnswers[q.id];
                        const isCorrect = ans === q.correctIndex;
                        const isAlreadyLogged = mistakeJournal.some(m => m.question.id === q.id);

                        return (
                          <div key={q.id} className="p-3 bg-indigo-900/20 rounded-xl border border-indigo-800/40 text-xs space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[9px] font-black uppercase text-indigo-300 bg-indigo-900/50 px-1.5 py-0.5 rounded border border-indigo-800/50">
                                  {q.sectionName || q.topic}
                                </span>
                                <p className="font-bold text-slate-100 mt-1">{idx + 1}. {q.topic}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                                isCorrect ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/60" : "bg-rose-900/60 text-rose-300 border border-rose-700/60"
                              }`}>
                                {isCorrect ? "✓ CORRECT" : "❌ INCORRECT"}
                              </span>
                            </div>

                            <p className="text-slate-300 italic">"{q.text}"</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-semibold bg-indigo-950/60 p-2 rounded-lg">
                              <p className={isCorrect ? "text-emerald-400" : "text-rose-400"}>
                                Your Answer: {ans !== undefined ? q.options[ans] : "Unanswered"}
                              </p>
                              {!isCorrect && (
                                <p className="text-emerald-400">
                                  Correct Choice: {q.options[q.correctIndex]}
                                </p>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 border-t border-indigo-900/50 pt-1.5 leading-normal">
                              <strong>College Board Explanation</strong>: {q.explanation}
                            </p>

                            {/* Add to Mistake Journal button if missed */}
                            {!isCorrect && (
                              <div className="pt-2 border-t border-indigo-900/50 flex justify-end">
                                <button
                                  onClick={() => addQuestionToMistakeJournal(q, ans ?? -1, "Concept Gap")}
                                  disabled={isAlreadyLogged}
                                  className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                                    isAlreadyLogged
                                      ? "bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed"
                                      : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-2xs"
                                  }`}
                                >
                                  <Bookmark size={11} />
                                  <span>{isAlreadyLogged ? "✓ In Mistake Journal" : "Save to Mistake Journal"}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Goal Roadmap & Score Gap Widget */}
              {(widgetFilter === "all" || widgetFilter === "profile") &&
                (!widgetSearch || "goal roadmap score gap target velocity analyze".includes(widgetSearch.toLowerCase())) && (
                  <WidgetCard
                    id="score-gap-card"
                    title="Goal Roadmap & Score Gap"
                    subtitle="Target gap analysis & velocity tracking"
                    icon={Target}
                    badge={{ text: "Active Path", color: "bg-emerald-950 text-emerald-400 border border-emerald-900" }}
                    actions={
                      <button
                        onClick={handleAnalyzeScoreGap}
                        disabled={loadingScoreGap}
                        className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        {loadingScoreGap ? <RefreshCw className="animate-spin" size={10} /> : <TrendingUp size={11} />}
                        Re-Analyze
                      </button>
                    }
                  >
                    <div className="flex justify-between items-end gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] mb-1 opacity-80 italic font-semibold text-slate-600">
                          <span>Current: {profile.currentMath + profile.currentReadingWriting}</span>
                          <span>Target: {profile.targetMath + profile.targetReadingWriting}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                          {/* Current percentage */}
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, ((profile.currentMath + profile.currentReadingWriting) / (profile.targetMath + profile.targetReadingWriting)) * 100)}%` }}
                          ></div>
                        </div>
                        <p className="mt-2 text-xs font-semibold leading-normal text-slate-700">
                          You need <span className="text-indigo-600 font-extrabold">+{Math.max(0, (profile.targetMath + profile.targetReadingWriting) - (profile.currentMath + profile.currentReadingWriting))} pts</span> to reach your goal score.
                        </p>
                      </div>
                      <div className="text-right border-l border-slate-200 pl-3 flex-none">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Velocity</p>
                        <p className="text-xl font-black text-slate-800">+45/wk</p>
                      </div>
                    </div>

                    {/* Score Gap Gemini Roadmap Result */}
                    {scoreGapRoadmap && (
                      <div className="mt-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 text-[11px] leading-relaxed max-h-36 overflow-y-auto text-slate-700">
                        <FormattedMarkdown text={scoreGapRoadmap} className="text-slate-700" />
                      </div>
                    )}
                  </WidgetCard>
              )}

              {/* Today's Study Plan Widget */}
              {(widgetFilter === "all" || widgetFilter === "schedule") &&
                (!widgetSearch || "today study plan schedule timetable commitment slots".includes(widgetSearch.toLowerCase())) && (
                  <WidgetCard
                    id="timetable-card"
                    title="Today's Study Schedule"
                    subtitle={`Customized for ${profile.focusPreference}`}
                    icon={Calendar}
                    badge={{ text: "AI-Optimized", color: "bg-green-50 text-green-700 border border-green-200" }}
                    actions={
                      <button
                        onClick={handleGenerateTimetable}
                        disabled={loadingTimetable}
                        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        {loadingTimetable ? <RefreshCw className="animate-spin" size={10} /> : <Sparkles size={11} />}
                        Re-Generate
                      </button>
                    }
                  >
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {/* Interactive Configs for timetable */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Daily Commitment</span>
                          <select
                            value={timetable.timeCommitment}
                            onChange={(e) => setTimetable({ ...timetable, timeCommitment: e.target.value })}
                            className="w-full mt-0.5 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none"
                          >
                            <option value="1 hour">1 Hour / day</option>
                            <option value="2 hours">2 Hours / day</option>
                            <option value="3 hours+">3+ Hours / day</option>
                          </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Preferred Slots</span>
                      <div className="flex gap-1.5 mt-1">
                        {["Morning", "Afternoon", "Evening"].map(slot => {
                          const isSel = timetable.availableSlots.some(s => s.startsWith(slot));
                          return (
                            <button
                              key={slot}
                              onClick={() => {
                                const matched = `${slot} (${slot === "Morning" ? "8am-12pm" : slot === "Afternoon" ? "12pm-5pm" : "5pm-9pm"})`;
                                if (isSel) {
                                  setTimetable({
                                    ...timetable,
                                    availableSlots: timetable.availableSlots.filter(s => !s.startsWith(slot))
                                  });
                                } else {
                                  setTimetable({
                                    ...timetable,
                                    availableSlots: [...timetable.availableSlots, matched]
                                  });
                                }
                              }}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${
                                isSel
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Day list with structured tasks */}
                  <div className="space-y-3 mt-3">
                    {(Object.entries(timetable.schedule) as [string, string[]][]).map(([day, tasks]) => {
                      // Determine if this is "Today" (Assuming Thursday is today as baseline)
                      const isToday = day === "Thursday";
                      return (
                        <div key={day} className={`flex gap-3 items-start border-l-2 pl-3 py-1 transition-all ${isToday ? "border-indigo-600 bg-indigo-50/30 -mx-2 px-2 rounded-r-lg" : "border-slate-200"}`}>
                          <div className="w-16 flex-none">
                            <span className={`text-[11px] font-black ${isToday ? "text-indigo-600" : "text-slate-400"}`}>{day}</span>
                            {isToday && <span className="block text-[9px] text-indigo-600 font-extrabold uppercase tracking-widest mt-0.5">TODAY</span>}
                          </div>
                          <div className="flex-1 space-y-1">
                            {tasks.map((task, idx) => (
                              <p key={idx} className={`text-xs font-semibold ${isToday ? "text-slate-800" : "text-slate-600"}`}>{task}</p>
                            ))}
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex-none mt-0.5 ${isToday ? "border-indigo-600 bg-indigo-50" : "border-slate-300"}`}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-[10px] text-slate-400 font-medium">Need a freshly optimized SAT study rhythm?</p>
                  <button
                    onClick={handleGenerateTimetable}
                    disabled={loadingTimetable}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-all shadow-xs flex items-center gap-1"
                  >
                    {loadingTimetable ? <RefreshCw className="animate-spin" size={10} /> : <Sparkles size={11} />}
                    Regenerate Weekly Plan
                  </button>
                </div>
              </WidgetCard>
            )}
            </>
          )}

          {/* ========================================== */}
          {/* BOTTOM ROW IN MIDDLE: Toggleable Special Section */}
          {/* ========================================== */}
          
          {/* Weak Area Analysis Interactive Module */}
          {activeTab === "weak" && (
            <WidgetCard
              id="weak-areas-panel"
              title="SAT Weak Area Diagnostic"
              subtitle="Pinpoint topics where you lose points & generate targeted strategies"
              icon={Sliders}
              badge={{ text: "AI Analyzer", color: "bg-purple-50 text-purple-700 border border-purple-200" }}
              actions={
                <button
                  onClick={handleAnalyzeWeakAreas}
                  disabled={loadingWeakAreas}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold rounded-md transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  {loadingWeakAreas ? <RefreshCw className="animate-spin" size={10} /> : <Sparkles size={11} />}
                  Run Analysis
                </button>
              }
            >
              <textarea
                value={weakAreaDescription}
                onChange={(e) => setWeakAreaDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-16"
                placeholder="Example: I struggle with punctuating relative clauses with commas, and solving quadratics with complex roots..."
              ></textarea>

              {weakAreaAnalysis && (
                <div className="mt-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs leading-relaxed max-h-60 overflow-y-auto text-slate-700">
                  <FormattedMarkdown text={weakAreaAnalysis} className="text-slate-700" />
                </div>
              )}
            </WidgetCard>
          )}

          {/* Progress Report Generator Interactive Module */}
          {activeTab === "progress" && (
            <div id="progress-report-panel" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs animate-fade-in">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-600" /> Comprehensive Progress Report Generator
              </h2>
              <p className="text-[11px] text-slate-400 mb-3">
                Input your most recent scores to generate an updated trajectory map, performance velocity, and targeted milestones.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Practice Math Score</label>
                  <input
                    type="number"
                    step="10"
                    min="200"
                    max="800"
                    value={latestInputMath}
                    onChange={(e) => setLatestInputMath(e.target.value ? parseInt(e.target.value, 10) : 600)}
                    onBlur={() => setLatestInputMath(prev => Math.min(800, Math.max(200, Math.round(prev / 10) * 10)))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Practice R&W Score</label>
                  <input
                    type="number"
                    step="10"
                    min="200"
                    max="800"
                    value={latestInputRW}
                    onChange={(e) => setLatestInputRW(e.target.value ? parseInt(e.target.value, 10) : 600)}
                    onBlur={() => setLatestInputRW(prev => Math.min(800, Math.max(200, Math.round(prev / 10) * 10)))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Study Updates & Notes</label>
                <input
                  type="text"
                  value={additionalStudyUpdateInput}
                  onChange={(e) => setAdditionalStudyUpdateInput(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium"
                  placeholder="e.g., Spent 3 hours on Heart of Algebra drills and polished standard punctuation rules."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateProgressReport}
                  disabled={loadingProgressReport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {loadingProgressReport ? <RefreshCw className="animate-spin" size={12} /> : <Download size={12} />}
                  Compile & Append Progress Report
                </button>
              </div>

              {latestProgressReport && (
                <div className="mt-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs leading-relaxed max-h-60 overflow-y-auto text-slate-700">
                  <FormattedMarkdown text={latestProgressReport} className="text-slate-700" />
                </div>
              )}
            </div>
          )}

          {/* Advanced Analytics Panel (Data Visualizations) */}
          {activeTab === "analytics" && (
            <div id="analytics-panel" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs animate-fade-in flex flex-col gap-4">
              <div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-indigo-600" /> Advanced Analytics & Trend Reports
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Performance tracking and score velocity dashboard.</p>
              </div>

              {/* Score Trend SVG Visualizer */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Practice Test Score Trajectory</h3>
                <div className="h-44 w-full flex items-end justify-between px-4 pb-2 border-b border-slate-200 relative pt-4">
                  <div className="absolute top-2 left-2 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded border border-indigo-100">Math + R&W</div>
                  
                  {scoresHistory.map((s, idx) => {
                    const maxScore = 1600;
                    const minScore = 400;
                    const totalScore = s.math + s.readingWriting;
                    const heightPercent = ((totalScore - minScore) / (maxScore - minScore)) * 100;
                    
                    return (
                      <div key={s.id} className="flex flex-col items-center flex-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-black">
                          {totalScore} pts (M:{s.math} R:{s.readingWriting})
                        </div>
                        {/* Interactive Bar */}
                        <div className="w-8 bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-200 hover:border-indigo-600 rounded-t-md transition-all relative flex flex-col justify-end" style={{ height: `${Math.max(15, heightPercent)}%` }}>
                          <div className="bg-indigo-600 h-[60%] rounded-t-sm w-full"></div>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold mt-1 text-center truncate w-14 leading-none">{s.date.split(",")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Study Time Log Input */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs space-y-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Study Hours Split</h3>
                <div className="grid grid-cols-3 gap-2 text-center text-slate-600">
                  <div className="bg-indigo-50/50 p-2 rounded border border-indigo-100/50">
                    <span className="block text-lg font-black text-indigo-700">4.5h</span>
                    <span className="text-[9px] font-semibold uppercase text-slate-400">Heart of Algebra</span>
                  </div>
                  <div className="bg-teal-50/50 p-2 rounded border border-teal-100/50">
                    <span className="block text-lg font-black text-teal-700">3.0h</span>
                    <span className="text-[9px] font-semibold uppercase text-slate-400">Passage Reading</span>
                  </div>
                  <div className="bg-purple-50/50 p-2 rounded border border-purple-100/50">
                    <span className="block text-lg font-black text-purple-700">2.0h</span>
                    <span className="text-[9px] font-semibold uppercase text-slate-400">Punctuation Drills</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mistake Journal Panel */}
          {activeTab === "mistakes" && (
            <div id="mistake-journal-panel" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs animate-fade-in flex flex-col gap-4">
              <div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <BookMarked size={14} className="text-indigo-600" /> My SAT Mistake Journal
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Keep track of and review concepts you missed in practice tests or study drills.</p>
              </div>

              {/* Stats & Counters */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                  <span className="block text-lg font-black text-slate-800">{mistakeJournal.length}</span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Total Logged</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100/50 p-2 rounded-lg">
                  <span className="block text-lg font-black text-amber-600">{mistakeJournal.filter(m => !m.resolved).length}</span>
                  <span className="text-[9px] font-bold uppercase text-amber-500">Unresolved</span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100/50 p-2 rounded-lg">
                  <span className="block text-lg font-black text-emerald-600">{mistakeJournal.filter(m => m.resolved).length}</span>
                  <span className="text-[9px] font-bold uppercase text-emerald-500">Resolved</span>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={mistakeSearch}
                  onChange={(e) => setMistakeSearch(e.target.value)}
                  placeholder="Search mistakes or topics..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <select
                  value={mistakeFilter}
                  onChange={(e) => setMistakeFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="unresolved">🔴 Unresolved</option>
                  <option value="resolved">🟢 Resolved</option>
                </select>
              </div>

              {/* Mistakes List */}
              <div className="space-y-3.5 max-h-[28rem] overflow-y-auto pr-1">
                {mistakeJournal.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-2xl">📓</p>
                    <p className="text-xs font-bold text-slate-700 mt-2">Your Mistake Journal is empty</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1">When you get questions wrong in the adaptive mock exam or the AI practice set, you'll be prompted to save them here with custom study notes.</p>
                    <button
                      onClick={() => setActiveTab("practice")}
                      className="mt-3.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all"
                    >
                      Start AI Practice Set
                    </button>
                  </div>
                ) : (
                  (() => {
                    const filtered = mistakeJournal.filter(m => {
                      const matchesSearch = m.question.text.toLowerCase().includes(mistakeSearch.toLowerCase()) || 
                                           m.question.topic.toLowerCase().includes(mistakeSearch.toLowerCase());
                      const matchesFilter = mistakeFilter === "all" || 
                                           (mistakeFilter === "resolved" && m.resolved) || 
                                           (mistakeFilter === "unresolved" && !m.resolved);
                      return matchesSearch && matchesFilter;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          No mistakes match your filter settings.
                        </div>
                      );
                    }

                    return filtered.map((m) => {
                      const isExpanded = !!expandedMistakeExplanations[m.id];
                      const isEditing = editingMistakeNotes[m.id] !== undefined;
                      const currentNoteVal = isEditing ? editingMistakeNotes[m.id] : m.userNotes;
                      
                      const attemptAns = mistakeAttemptAnswers[m.id];
                      const attemptFeed = mistakeAttemptFeedback[m.id];

                      return (
                        <div key={m.id} className={`p-3.5 bg-white rounded-xl border transition-all ${m.resolved ? "border-emerald-200/60 bg-emerald-50/5" : "border-slate-200 shadow-2xs hover:border-slate-300"}`}>
                          {/* Item Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {m.question.topic}
                              </span>
                              <p className="text-[9px] text-slate-400 font-bold mt-1">Logged on {m.dateAdded}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setMistakeJournal(prev => prev.map(item => item.id === m.id ? { ...item, resolved: !item.resolved } : item));
                                }}
                                className={`px-2 py-0.5 rounded text-[9px] font-extrabold border transition-all ${
                                  m.resolved
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                                }`}
                              >
                                {m.resolved ? "✓ RESOLVED" : "Mark Resolved"}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to remove this mistake?")) {
                                    setMistakeJournal(prev => prev.filter(item => item.id !== m.id));
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent rounded-md transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Question Text */}
                          <p className="text-xs font-bold text-slate-800 leading-relaxed mb-2.5 whitespace-pre-wrap">
                            {m.question.text}
                          </p>

                          {/* Answers Block */}
                          <div className="text-[11px] font-medium bg-slate-50 border border-slate-100 p-2.5 rounded-lg space-y-1 mb-2.5">
                            <p className="text-rose-600 font-bold">
                              ❌ Your Answer: {m.question.options[m.selectedAnswerIndex] || "Unanswered"}
                            </p>
                            <p className="text-emerald-600 font-bold">
                              ✓ Correct Answer: {m.question.options[m.question.correctIndex]}
                            </p>
                          </div>

                          {/* Interactive Re-attempt Block */}
                          {!m.resolved && (
                            <div className="bg-indigo-50/20 border border-indigo-100/40 p-2.5 rounded-lg text-xs mb-2.5">
                              <p className="text-[10px] font-black uppercase text-indigo-700 tracking-wider mb-1.5 flex items-center gap-1">
                                🔄 Re-attempt Question:
                              </p>
                              <div className="grid grid-cols-1 gap-1.5 mb-2">
                                {m.question.options.map((opt, oIdx) => (
                                  <button
                                    key={oIdx}
                                    onClick={() => setMistakeAttemptAnswers(prev => ({ ...prev, [m.id]: oIdx }))}
                                    className={`w-full text-left p-2 rounded-md border text-xs font-bold transition-all ${
                                      attemptAns === oIdx
                                        ? "bg-indigo-600 border-indigo-700 text-white"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                              {attemptAns !== undefined && (
                                <div className="flex items-center justify-between gap-2 mt-2">
                                  <button
                                    onClick={() => {
                                      const isCorrect = attemptAns === m.question.correctIndex;
                                      setMistakeAttemptFeedback(prev => ({
                                        ...prev,
                                        [m.id]: isCorrect ? "correct" : "incorrect"
                                      }));
                                    }}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded transition-all shadow-2xs"
                                  >
                                    Verify Answer
                                  </button>
                                  {attemptFeed === "correct" && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-emerald-600 text-[10px] font-black">🎉 CORRECT!</span>
                                      <button
                                        onClick={() => {
                                          setMistakeJournal(prev => prev.map(item => item.id === m.id ? { ...item, resolved: true } : item));
                                          // Clear attempt states
                                          setMistakeAttemptAnswers(prev => { const c = { ...prev }; delete c[m.id]; return c; });
                                          setMistakeAttemptFeedback(prev => { const c = { ...prev }; delete c[m.id]; return c; });
                                        }}
                                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold rounded"
                                      >
                                        Mark as Resolved
                                      </button>
                                    </div>
                                  )}
                                  {attemptFeed === "incorrect" && (
                                    <span className="text-rose-600 text-[10px] font-black">❌ Not quite, try again!</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Editable Notes Segment */}
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs space-y-1.5 mb-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-slate-400">My Study Notes:</span>
                              {!isEditing ? (
                                <button
                                  onClick={() => setEditingMistakeNotes(prev => ({ ...prev, [m.id]: m.userNotes }))}
                                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit size={10} /> Edit Note
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setMistakeJournal(prev => prev.map(item => item.id === m.id ? { ...item, userNotes: currentNoteVal } : item));
                                    setEditingMistakeNotes(prev => { const c = { ...prev }; delete c[m.id]; return c; });
                                  }}
                                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Check size={10} /> Save Note
                                </button>
                              )}
                            </div>
                            {isEditing ? (
                              <textarea
                                value={currentNoteVal}
                                onChange={(e) => setEditingMistakeNotes(prev => ({ ...prev, [m.id]: e.target.value }))}
                                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold focus:outline-none min-h-12"
                              ></textarea>
                            ) : (
                              <p className="text-[11px] font-semibold text-slate-700 leading-normal italic">
                                "{m.userNotes || "No study notes written yet. Click 'Edit Note' to explain why you think you made this mistake to help solidify your understanding."}"
                              </p>
                            )}
                          </div>

                          {/* Toggle Explanations */}
                          <div className="border-t border-slate-100 pt-2 flex justify-between items-center mt-2">
                            <button
                              onClick={() => setExpandedMistakeExplanations(prev => ({ ...prev, [m.id]: !isExpanded }))}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                            >
                              <HelpCircle size={12} />
                              {isExpanded ? "Hide Question Explanation" : "Review Question Explanation"}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-2.5 bg-indigo-50/20 border border-indigo-100/30 p-3 rounded-lg text-xs leading-relaxed text-slate-700">
                              <FormattedMarkdown text={m.question.explanation} className="text-slate-600" />
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          )}

          {/* AI Practice Panel */}
          {activeTab === "practice" && (
            <div id="ai-practice-panel" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs animate-fade-in flex flex-col gap-4">
              <div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" /> AI-Generated Focus Practice Set
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">5 High-quality SAT questions targeted on system of equations word problems, relative clauses punctuation, and vocabulary in context.</p>
              </div>

              {/* Progress bar */}
              {practiceIndex < aiPracticeQuestions.length ? (
                <>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>QUESTION {practiceIndex + 1} OF {aiPracticeQuestions.length}</span>
                    <span className="text-indigo-600 font-extrabold uppercase">{aiPracticeQuestions[practiceIndex].topic}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${((practiceIndex + 1) / aiPracticeQuestions.length) * 100}%` }}
                    ></div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl text-xs space-y-3">
                    <p className="font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {aiPracticeQuestions[practiceIndex].text}
                    </p>

                    <div className="grid grid-cols-1 gap-2 pt-2">
                      {aiPracticeQuestions[practiceIndex].options.map((option, oIdx) => {
                        const isSelected = practiceAnswers[aiPracticeQuestions[practiceIndex].id] === oIdx;
                        const isCorrectAnswer = oIdx === aiPracticeQuestions[practiceIndex].correctIndex;
                        const hasSubmitted = practiceShowExplanation;

                        let btnStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300";
                        if (isSelected) {
                          btnStyle = "bg-indigo-50 border-indigo-400 text-indigo-700 font-extrabold";
                        }
                        if (hasSubmitted) {
                          if (isCorrectAnswer) {
                            btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 font-extrabold";
                          } else if (isSelected) {
                            btnStyle = "bg-rose-50 border-rose-400 text-rose-800 font-extrabold";
                          } else {
                            btnStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={hasSubmitted}
                            onClick={() => {
                              setPracticeAnswers(prev => ({
                                ...prev,
                                [aiPracticeQuestions[practiceIndex].id]: oIdx
                              }));
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs leading-normal transition-all ${btnStyle} cursor-pointer`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {/* Submit Section */}
                    {!practiceShowExplanation ? (
                      <div className="flex justify-end pt-2">
                        <button
                          disabled={practiceAnswers[aiPracticeQuestions[practiceIndex].id] === undefined}
                          onClick={() => {
                            setPracticeShowExplanation(true);
                            // Increase point streak slightly on correct answer
                            const qId = aiPracticeQuestions[practiceIndex].id;
                            const isCorrect = practiceAnswers[qId] === aiPracticeQuestions[practiceIndex].correctIndex;
                            if (isCorrect) {
                              setStreak(prev => prev + 1);
                            }
                          }}
                          className={`px-4 py-2 text-white text-xs font-extrabold rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer ${
                            practiceAnswers[aiPracticeQuestions[practiceIndex].id] === undefined
                              ? "bg-slate-300 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          Check Answer
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-3 border-t border-slate-200/60">
                        {/* Correct/Incorrect Banner */}
                        {practiceAnswers[aiPracticeQuestions[practiceIndex].id] === aiPracticeQuestions[practiceIndex].correctIndex ? (
                          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold flex items-center gap-1.5 text-xs animate-fade-in">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            Correct answer! Outstanding job!
                          </div>
                        ) : (
                          <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-bold flex flex-col gap-1.5 text-xs animate-fade-in">
                            <div className="flex items-center gap-1.5">
                              <AlertCircle size={14} className="text-rose-600 shrink-0" />
                              Incorrect. Let's analyze the mistake.
                            </div>
                            
                            {/* Prompt to add to Mistake Journal */}
                            <div className="mt-2 p-2.5 bg-white border border-rose-100 rounded-lg space-y-2">
                              <p className="text-[10px] uppercase font-black tracking-wider text-rose-700">Add to Mistake Journal 📓</p>
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Solidify your comprehension by explaining why you picked the wrong answer below, then save this question to your review journal.</p>
                              <textarea
                                value={tempPracticeNotes[aiPracticeQuestions[practiceIndex].id] || ""}
                                onChange={(e) => setTempPracticeNotes(prev => ({
                                  ...prev,
                                  [aiPracticeQuestions[practiceIndex].id]: e.target.value
                                }))}
                                placeholder="e.g. I didn't see that student tickets were $6 and adult tickets were $10, which reversed my coefficients..."
                                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-400 min-h-12"
                              ></textarea>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    const q = aiPracticeQuestions[practiceIndex];
                                    const sel = practiceAnswers[q.id];
                                    const notes = tempPracticeNotes[q.id] || "";
                                    addQuestionToJournal(q, sel, notes);
                                    setAddedPracticeMistakes(prev => ({ ...prev, [q.id]: true }));
                                  }}
                                  disabled={!!addedPracticeMistakes[aiPracticeQuestions[practiceIndex].id]}
                                  className={`px-3 py-1 text-xs font-black rounded-md flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                                    addedPracticeMistakes[aiPracticeQuestions[practiceIndex].id]
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  }`}
                                >
                                  {addedPracticeMistakes[aiPracticeQuestions[practiceIndex].id] ? (
                                    <>
                                      <Check size={11} /> Saved to Journal!
                                    </>
                                  ) : (
                                    "Save to Mistake Journal"
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Explanation Text */}
                        <div className="bg-indigo-50/30 border border-indigo-100/40 p-3.5 rounded-lg text-xs leading-relaxed text-slate-700 overflow-y-auto max-h-48">
                          <FormattedMarkdown text={aiPracticeQuestions[practiceIndex].explanation} className="text-slate-700" />
                        </div>

                        {/* Next question or Finish */}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => {
                              setPracticeIndex(prev => prev + 1);
                              setPracticeShowExplanation(false);
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1 transition-all"
                          >
                            <span>{practiceIndex === aiPracticeQuestions.length - 1 ? "Finish and Score" : "Next Question"}</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">Practice Set Completed!</h3>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Fantastic effort! You've reviewed your systems of linear equations, relative clause punctuation, and vocabulary questions.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl max-w-xs mx-auto text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Total Questions:</span>
                      <span className="text-slate-800">{aiPracticeQuestions.length}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Correct Answers:</span>
                      <span className="text-emerald-600">
                        {aiPracticeQuestions.filter(q => practiceAnswers[q.id] === q.correctIndex).length}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-slate-200/50 pt-1 mt-1">
                      <span className="text-slate-500">Points Awarded:</span>
                      <span className="text-indigo-600">
                        +{aiPracticeQuestions.filter(q => practiceAnswers[q.id] === q.correctIndex).length * 40} pts
                      </span>
                    </div>
                  </div>

                  {/* Summary of missed questions & Mistake Journal log state */}
                  {aiPracticeQuestions.some(q => practiceAnswers[q.id] !== q.correctIndex) && (
                    <div className="max-w-md mx-auto text-left bg-rose-50/10 border border-rose-100/60 rounded-xl p-3 space-y-2 text-xs">
                      <p className="text-[10px] uppercase font-black text-rose-700 tracking-wider">Missed Questions Summary:</p>
                      <div className="space-y-1.5">
                        {aiPracticeQuestions.filter(q => practiceAnswers[q.id] !== q.correctIndex).map((q, idx) => (
                          <div key={q.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-100 text-[11px]">
                            <span className="font-semibold text-slate-700 truncate max-w-[200px]">{idx + 1}. {q.topic}</span>
                            {mistakeJournal.some(mj => mj.question.id === q.id) ? (
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase">✓ Logged</span>
                            ) : (
                              <button
                                onClick={() => {
                                  const sel = practiceAnswers[q.id];
                                  addQuestionToJournal(q, sel, "");
                                  setAddedPracticeMistakes(prev => ({ ...prev, [q.id]: true }));
                                }}
                                className="text-[9px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-1.5 py-0.5 rounded uppercase transition-all"
                              >
                                Log to Journal
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setPracticeIndex(0);
                        setPracticeAnswers({});
                        setPracticeShowExplanation(false);
                        setAddedPracticeMistakes({});
                        setTempPracticeNotes({});
                      }}
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs rounded-xl transition-all"
                    >
                      Restart Practice Set
                    </button>
                    <button
                      onClick={() => setActiveTab("mistakes")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all shadow-md"
                    >
                      Open Mistake Journal 📓
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN (Width 4): Topic Mastery & AI Chatbot */}
        {/* ========================================== */}
        <div className="col-span-12 md:col-span-12 lg:col-span-4 flex flex-col gap-4">
          
          {/* Topic Mastery Self-Assessment / Heatmap Widget */}
          {(widgetFilter === "all" || widgetFilter === "analytics") &&
            (!widgetSearch || "section topic mastery algebra geometry grammar writing reading analysis".includes(widgetSearch.toLowerCase())) && (
              <WidgetCard
                id="mastery-card"
                title="Section Topic Mastery"
                subtitle="Self-assessment & drill accuracy"
                icon={Award}
                badge={{ text: "UPDATED", color: "bg-indigo-50 text-indigo-600 border border-indigo-200" }}
              >
                <div className="space-y-2.5">
                  {/* Math Mastery */}
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-1">Math Sections</p>
                    <div className="space-y-1.5 pl-2">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-700">Heart of Algebra</span>
                          <span className="text-indigo-600">{mastery.algebra}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${mastery.algebra}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-700">Advanced Mathematics</span>
                          <span className="text-indigo-600">{mastery.advancedMath}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${mastery.advancedMath}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-700">Geometry & Trigonometry</span>
                          <span className="text-orange-500">{mastery.geometry}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${mastery.geometry}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-700">Problem Solving & Data Analysis</span>
                          <span className="text-indigo-600">{mastery.dataAnalysis}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${mastery.dataAnalysis}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* R&W Mastery */}
                  <div className="border-t border-slate-50 pt-2">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-1">Reading & Writing Sections</p>
                    <div className="space-y-1.5 pl-2">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-700">Reading Comprehension</span>
                          <span className="text-indigo-600">{mastery.readingComprehension}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${mastery.readingComprehension}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-700">Standard Grammar rules</span>
                          <span className="text-orange-500">{mastery.grammar}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${mastery.grammar}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-700">Rhetorical Writing Synthesis</span>
                          <span className="text-indigo-600">{mastery.writing}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${mastery.writing}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </WidgetCard>
            )}

          {/* Chat Assistant Section */}
          <div id="chatbot-card" className="bg-indigo-600 text-white rounded-xl shadow-md flex-1 flex flex-col overflow-hidden relative border border-indigo-700">
            {/* Header */}
            <div className="p-3 bg-indigo-700 border-b border-indigo-800 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={13} /> SAT Prep Assistant
                </h3>
              </div>
              <button
                onClick={() => setChatHistory([chatHistory[0]])}
                className="text-[10px] text-indigo-200 hover:text-white underline cursor-pointer"
                title="Clear Chat Thread"
              >
                Reset Chat
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 max-h-72 min-h-[14rem] z-10">
              {chatHistory.map((m, idx) => {
                const isAss = m.sender === "assistant";
                return (
                  <div key={idx} className={`flex ${isAss ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[85%] rounded-xl p-2.5 text-xs font-semibold leading-relaxed ${
                      isAss
                        ? "bg-white/10 text-slate-100 border border-white/5"
                        : "bg-white text-indigo-800 shadow-sm"
                    }`}>
                      <FormattedMarkdown text={m.text} className={isAss ? "text-slate-100" : "text-indigo-900"} />
                      <span className="block text-[8px] opacity-40 text-right mt-1.5 font-bold">
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-indigo-200 rounded-xl p-2.5 text-xs flex items-center gap-1.5 font-medium animate-pulse">
                    <RefreshCw className="animate-spin" size={12} /> Typing response...
                  </div>
                </div>
              )}
            </div>

            {/* Suggested prompts teaser */}
            <div className="px-3 py-1 bg-indigo-700/50 border-t border-indigo-800 flex gap-1.5 overflow-x-auto text-[9px] font-bold z-10">
              <button
                onClick={() => {
                  setChatMessage("Teach me the relative clauses grammar rule.");
                }}
                className="px-2 py-0.5 bg-indigo-800/80 hover:bg-indigo-900 border border-indigo-700 rounded text-indigo-100 shrink-0 whitespace-nowrap transition-all"
              >
                ✏️ Relative Clauses
              </button>
              <button
                onClick={() => {
                  setChatMessage("Give me a fast tip on Desmos systems of equations.");
                }}
                className="px-2 py-0.5 bg-indigo-800/80 hover:bg-indigo-900 border border-indigo-700 rounded text-indigo-100 shrink-0 whitespace-nowrap transition-all"
              >
                🧮 Desmos Intersections
              </button>
              <button
                onClick={() => {
                  setChatMessage("How do I stay calm on SAT test day?");
                }}
                className="px-2 py-0.5 bg-indigo-800/80 hover:bg-indigo-900 border border-indigo-700 rounded text-indigo-100 shrink-0 whitespace-nowrap transition-all"
              >
                🧘 Test Anxiety Tip
              </button>
            </div>

            {/* Footer Input */}
            <div className="p-2.5 bg-indigo-700 border-t border-indigo-800 flex gap-2 z-10">
              <input
                id="chat-input"
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChatMessage();
                }}
                placeholder="Ask your coach anything..."
                className="flex-1 bg-indigo-800/60 border border-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs placeholder:text-indigo-200/50 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                id="chat-send-btn"
                onClick={handleSendChatMessage}
                className="px-3 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black shadow-xs transition-all flex items-center justify-center cursor-pointer"
              >
                Send
              </button>
            </div>

            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          </div>
        </div>
      </div>
      )}
      </main>
    </div>

    {/* MOBILE BOTTOM NAVIGATION BAR */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 shadow-lg">
      <button
        onClick={() => { setActiveTab("dashboard"); setMockExamActive(false); }}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          activeTab === "dashboard" ? "text-emerald-600 font-black" : "text-slate-400 font-bold"
        }`}
      >
        <span className="text-lg">🏠</span>
        <span className="text-[9px] uppercase tracking-wider mt-0.5">Learn</span>
      </button>

      <button
        onClick={() => { setActiveTab("practice"); setMockExamActive(false); }}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          activeTab === "practice" ? "text-emerald-600 font-black" : "text-slate-400 font-bold"
        }`}
      >
        <span className="text-lg">🎯</span>
        <span className="text-[9px] uppercase tracking-wider mt-0.5">Practice</span>
      </button>

      <button
        onClick={() => { setActiveTab("mock"); if(!mockExamActive) setExamStage("intro"); }}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          activeTab === "mock" ? "text-indigo-600 font-black" : "text-slate-400 font-bold"
        }`}
      >
        <span className="text-lg">⏱️</span>
        <span className="text-[9px] uppercase tracking-wider mt-0.5">Mock</span>
      </button>

      <button
        onClick={() => { setActiveTab("mistakes"); setMockExamActive(false); }}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          activeTab === "mistakes" ? "text-amber-600 font-black" : "text-slate-400 font-bold"
        }`}
      >
        <span className="text-lg">📔</span>
        <span className="text-[9px] uppercase tracking-wider mt-0.5">Journal</span>
      </button>

      <button
        onClick={() => { setActiveTab("chat"); setMockExamActive(false); }}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          activeTab === "chat" ? "text-purple-600 font-black" : "text-slate-400 font-bold"
        }`}
      >
        <span className="text-lg">🤖</span>
        <span className="text-[9px] uppercase tracking-wider mt-0.5">AI Chat</span>
      </button>
    </nav>

      {/* Bottom Action / Metadata Bar */}
      <footer id="footer-section" className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
        <div className="flex flex-wrap gap-4 text-center sm:text-left">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recent Mock Exam</span>
            <span className="text-xs font-extrabold text-slate-800">
              {scoresHistory.filter(h => h.isMockExam).length > 0
                ? scoresHistory.filter(h => h.isMockExam).slice(-1)[0].notes?.split("-")[0]
                : "No full exam completed yet"}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Score Performance Band</span>
            <span className="text-xs font-extrabold text-emerald-600 underline">
              {profile.currentMath + profile.currentReadingWriting - 20} - {profile.currentMath + profile.currentReadingWriting + 40} Est
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab("analytics"); setMockExamActive(false); }}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs bg-white shadow-xs cursor-pointer"
          >
            Full Analytics Report
          </button>
          {!mockExamActive ? (
            <button
              id="start-mock-exam-btn"
              onClick={() => { setActiveTab("mock"); setMockExamActive(true); startMockExam(); }}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-100 hover:scale-102 transition-all cursor-pointer"
            >
              Start Adaptive Mock Exam
            </button>
          ) : (
            <button
              onClick={() => setMockExamActive(false)}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs shadow-md"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </footer>

      {/* Google Auth Setup & Demo Modal */}
      {showAuthSetupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-100 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <div>
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider leading-none">OAuth Setup</h3>
                  <p className="text-sm font-extrabold text-slate-100 mt-1">Google Sign-In Configuration</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthSetupModal(false)}
                className="text-slate-400 hover:text-white font-bold p-1 rounded hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2.5">
                <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-indigo-900">Demo Mode Available!</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                    If you haven't configured your Google Client keys yet, you can click <strong>"Try Demo Login"</strong> below to simulate a secure sign-in with your email instantly.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-black text-slate-800 uppercase tracking-wider text-[10px]">Required Steps to Enable Real Google Sign-In:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 font-medium leading-relaxed pl-1">
                  <li>
                    Open your <strong>Google Cloud API Console</strong> dashboard:
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline block pl-4 font-bold">
                      https://console.cloud.google.com/apis/credentials
                    </a>
                  </li>
                  <li>
                    Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).
                  </li>
                  <li>
                    Add this exact <strong>Authorized Redirect URI</strong> to your client settings:
                    <code className="block bg-slate-100 border border-slate-200 px-2 py-1 rounded text-[10px] mt-1 select-all font-mono font-bold text-slate-800 max-w-full truncate">
                      {window.location.origin}/auth/callback
                    </code>
                  </li>
                  <li>
                    Add these environment secrets in the <strong>Secrets panel</strong> in your AI Studio editor settings:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-[10px] font-bold text-slate-700">
                      <li><code>GOOGLE_CLIENT_ID</code></li>
                      <li><code>GOOGLE_CLIENT_SECRET</code></li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex justify-between gap-2.5">
              <button
                onClick={() => {
                  // Simulate success
                  setUser({
                    name: "Emmanuel Ndirangu",
                    email: "ndiranguemmanuel07@gmail.com",
                    picture: undefined
                  });
                  setProfile((prev) => ({
                    ...prev,
                    name: "Emmanuel Ndirangu",
                    username: "ndiranguemmanuel07"
                  }));
                  setShowAuthSetupModal(false);
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Try Demo Login</span>
              </button>
              <button
                onClick={() => setShowAuthSetupModal(false)}
                className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APK & Mobile Installation Modal */}
      {showApkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-100 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider leading-none">Android & Mobile Access</h3>
                  <p className="text-base font-extrabold text-slate-100 mt-1">Get SAT Success as an APK / App</p>
                </div>
              </div>
              <button
                onClick={() => setShowApkModal(false)}
                className="text-slate-400 hover:text-white font-bold p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
              {/* Alert: Why the dev link fails on PWABuilder */}
              <div className="bg-amber-500/10 border border-amber-300/80 rounded-xl p-3.5 space-y-1.5 text-amber-900">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                  <span className="text-sm">⚠️</span>
                  <span>Why does PWABuilder say the link is not working?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90 font-medium">
                  This development URL is a <strong>private Google AI Studio development container</strong> protected by Google sign-in cookies. Microsoft PWABuilder’s automated crawlers cannot bypass Google’s login barrier to scan private sandboxes.
                </p>
                <p className="text-[11px] leading-relaxed text-amber-900 font-bold">
                  👉 <strong>Best Solution:</strong> You don’t need an APK file to use this app on your phone! Follow <strong>Option 1</strong> below to install it instantly via Chrome/Safari, or follow <strong>Option 2</strong> after clicking "Deploy" in AI Studio.
                </p>
              </div>

              {/* Option 1: 1-Tap PWA Install on Mobile (Recommended) */}
              <div className="bg-emerald-50/90 border border-emerald-300/80 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Option 1: Instant Install on Android or iPhone</h4>
                      <p className="text-[10px] text-emerald-800 font-bold">Recommended • No APK download needed • Runs full screen</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                    Fastest
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed text-[11px]">
                  This app is a certified <strong>Progressive Web App (PWA)</strong>. Android and iOS turn it into a real standalone app on your home screen with its own icon and offline support:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Android Chrome */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                      <span>🤖</span> Android (Chrome / Brave / Samsung)
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] font-medium">
                      <li>Open this URL on your phone's browser.</li>
                      <li>Tap the <strong>three dots (⋮)</strong> menu in the top right.</li>
                      <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                      <li>It installs to your app drawer and home screen!</li>
                    </ol>
                  </div>

                  {/* iOS Safari */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                      <span>🍏</span> iPhone / iPad (Safari)
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] font-medium">
                      <li>Open this URL in <strong>Safari</strong>.</li>
                      <li>Tap the <strong>Share</strong> button (square with arrow ↑).</li>
                      <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                      <li>Tap <strong>"Add"</strong> in the top right corner!</li>
                    </ol>
                  </div>
                </div>

                {/* QR Code & Direct Link */}
                <div className="bg-white border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      window.location.origin.includes("localhost")
                        ? "https://ais-dev-ldvojqej3zoyeo5elcfbqz-220071015730.europe-west3.run.app"
                        : window.location.origin
                    )}`}
                    alt="Scan with phone to open app"
                    className="w-24 h-24 rounded-lg border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <p className="font-bold text-slate-800 text-xs">
                      Scan with your phone camera to open & install instantly
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const url = window.location.origin.includes("localhost")
                            ? "https://ais-dev-ldvojqej3zoyeo5elcfbqz-220071015730.europe-west3.run.app"
                            : window.location.origin;
                          navigator.clipboard.writeText(url);
                          alert("URL copied to clipboard! Send this link to your phone or paste in Chrome.");
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        Copy Phone Link
                      </button>
                      <button
                        onClick={() => {
                          const url = window.location.origin.includes("localhost")
                            ? "https://ais-dev-ldvojqej3zoyeo5elcfbqz-220071015730.europe-west3.run.app"
                            : window.location.origin;
                          window.open(url, "_blank", "noopener,noreferrer");
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-300"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                </div>

                {deferredPrompt && (
                  <button
                    onClick={handleInstallPWA}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Trigger In-Browser Install Prompt</span>
                  </button>
                )}
              </div>

              {/* Option 2: Build APK via PWABuilder */}
              <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <h4 className="font-extrabold text-slate-800 text-sm">Option 2: Generate Signed APK via PWABuilder</h4>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  To create a standalone <code>.apk</code> installer file using Microsoft PWABuilder:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-700 font-semibold text-[11px] pl-1 bg-white p-3 rounded-lg border border-indigo-100">
                  <li>
                    <strong>Deploy Your App Publicly First:</strong> In the upper-right corner of Google AI Studio, click <strong>Deploy</strong> (or export to Vercel/Netlify). This creates a publicly accessible address without Google authentication cookies.
                  </li>
                  <li>
                    <strong>Open PWABuilder:</strong>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => window.open("https://www.pwabuilder.com", "_blank", "noopener,noreferrer")}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer"
                      >
                        Open PWABuilder.com ↗
                      </button>
                      <span className="text-[10px] text-slate-500 font-normal">www.pwabuilder.com</span>
                    </div>
                  </li>
                  <li>
                    <strong>Paste your deployed public URL</strong> into PWABuilder and click <strong>"Package for Android"</strong> to download your <code>.apk</code> file!
                  </li>
                </ol>
              </div>

              {/* Option 3: Export & Capacitor */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛠️</span>
                  <h4 className="font-extrabold text-slate-800 text-sm">Option 3: Export Source Code & Capacitor (Offline APK)</h4>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  If you want to compile an APK locally on your computer with Android Studio:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] font-medium pl-1">
                  <li>In AI Studio settings menu, click <strong>"Export ZIP"</strong> or <strong>"Export to GitHub"</strong>.</li>
                  <li>In terminal, run: <code>npm i @capacitor/core @capacitor/android</code></li>
                  <li>Run: <code>npx cap init</code> and <code>npx cap add android</code></li>
                  <li>Run: <code>npx cap open android</code> inside Android Studio to generate the APK!</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowApkModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Reminder Settings Modal */}
      {showReminderModal && (
        <div id="reminder-settings-modal" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative space-y-4">
            <button
              id="close-reminder-modal-btn"
              onClick={() => setShowReminderModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Daily Study Reminders</h3>
                <p className="text-xs text-slate-400 font-medium">Configure notification alerts to maintain your study streak.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              {/* Toggle Enable */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">Enable Daily Reminders</p>
                  <p className="text-[10px] text-slate-500 font-normal">Show dashboard notification if study hasn't been logged today</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="toggle-reminder-enabled"
                    type="checkbox"
                    checked={reminderSettings.enabled}
                    onChange={(e) => setReminderSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Reminder Time Picker */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Preferred Daily Reminder Time</label>
                <select
                  id="select-reminder-time"
                  value={reminderSettings.time}
                  onChange={(e) => setReminderSettings((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="07:00">07:00 AM (Early Morning Prep)</option>
                  <option value="08:00">08:00 AM (Morning Study)</option>
                  <option value="12:00">12:00 PM (Midday Break)</option>
                  <option value="16:00">04:00 PM (Afternoon Session)</option>
                  <option value="18:00">06:00 PM (Evening Review)</option>
                  <option value="20:00">08:00 PM (Prime Evening)</option>
                  <option value="21:00">09:00 PM (Late Night Review)</option>
                </select>
              </div>

              {/* Target Daily Duration */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Daily Study Goal</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {[30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setReminderSettings((prev) => ({ ...prev, targetMinutes: mins }))}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                        reminderSettings.targetMinutes === mins
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                id="save-reminder-settings-btn"
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-sm"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Study Session Logger Modal */}
      {showQuickLogModal && (
        <div id="quick-log-modal" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative space-y-4">
            <button
              id="close-quick-log-modal-btn"
              onClick={() => setShowQuickLogModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Log Today's Study Time</h3>
                <p className="text-xs text-slate-400 font-medium">Record hours spent for date: {todayStr}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Math Study (Hours)</label>
                <input
                  id="input-quick-log-math"
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  value={quickLogMathHours}
                  onChange={(e) => setQuickLogMathHours(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Reading Study (Hours)</label>
                <input
                  id="input-quick-log-reading"
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  value={quickLogReadingHours}
                  onChange={(e) => setQuickLogReadingHours(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Writing Study (Hours)</label>
                <input
                  id="input-quick-log-writing"
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  value={quickLogWritingHours}
                  onChange={(e) => setQuickLogWritingHours(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs flex justify-between items-center font-bold text-indigo-900">
                <span>Total Study Logged Today:</span>
                <span className="text-sm font-black text-indigo-600">
                  {(quickLogMathHours + quickLogReadingHours + quickLogWritingHours).toFixed(2)} hrs
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                id="cancel-quick-log-btn"
                type="button"
                onClick={() => setShowQuickLogModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-quick-log-btn"
                type="button"
                onClick={() => handleLogTodayStudy(quickLogMathHours, quickLogReadingHours, quickLogWritingHours)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
              >
                Confirm & Update Streak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Authentication Modal */}
      {showFirebaseAuthModal && (
        <FirebaseAuthModal
          currentUser={firebaseUser}
          onClose={() => setShowFirebaseAuthModal(false)}
          onUserChanged={(u) => setFirebaseUser(u)}
        />
      )}

      {/* Official SAT Math Reference Sheet & Formulas Modal */}
      <SatMathReferenceModal
        isOpen={showMathReferenceModal}
        onClose={() => setShowMathReferenceModal(false)}
      />

      {/* Desmos Graphing & Scientific Calculator Modal */}
      <DesmosCalculatorModal
        isOpen={showDesmosModal}
        onClose={() => setShowDesmosModal(false)}
      />

      {/* Interactive SAT Flashcards Modal */}
      <FlashcardsModal
        isOpen={showFlashcardsModal}
        onClose={() => setShowFlashcardsModal(false)}
      />

      {/* Question Navigator Modal during Mock Exam */}
      {showQuestionNavModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Layers size={16} className="text-indigo-400" />
                <span>Question Navigator ({examQuestions.length} Questions)</span>
              </h3>
              <button
                onClick={() => setShowQuestionNavModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Jump directly to any question in this active test module:
            </p>
            <div className="grid grid-cols-5 gap-2">
              {examQuestions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlagged = !!flaggedQuestions[q.id];
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setShowQuestionNavModal(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                      isCurrent
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-md ring-2 ring-indigo-400"
                        : isAnswered
                        ? "bg-slate-800 border-slate-700 text-indigo-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span>Q{idx + 1}</span>
                    <span className="text-[9px] font-medium text-slate-400">
                      {isAnswered ? "Saved" : "Empty"}
                    </span>
                    {isFlagged && (
                      <span className="absolute top-1 right-1 text-amber-400 text-[10px]">⚑</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Current
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-700"></span> Answered
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">⚑</span> Flagged
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

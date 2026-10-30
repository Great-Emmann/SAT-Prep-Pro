import React from "react";
import {
  Sparkles,
  Award,
  BookOpen,
  CheckCircle2,
  Play,
  Calendar,
  Target,
  Sliders,
  TrendingUp,
  User,
  Clock,
  RefreshCw,
  Flame,
  Plus
} from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { FormattedMarkdown } from "./FormattedMarkdown";

interface DuolingoLearnPathProps {
  profile: any;
  setProfile: (val: any) => void;
  scoreInputs: any;
  handleScoreInputChange: (field: string, val: string) => void;
  handleScoreInputBlur: (field: string, actualField: string) => void;
  adjustScoreDelta: (field: string, stateKey: string, delta: number) => void;
  handleResetAllData: () => void;
  
  // Timetable
  timetableConfig: any;
  setTimetableConfig: (val: any) => void;
  generatedTimetable: string;
  loadingTimetable: boolean;
  handleGenerateTimetable: () => void;
  
  // Score Gap
  scoreGapAnalysis: string;
  loadingScoreGap: boolean;
  handleGenerateScoreGap: () => void;
  
  // Weak Areas
  weakAreaDescription: string;
  setWeakAreaDescription: (val: string) => void;
  weakAreaAnalysis: string;
  loadingWeakAreas: boolean;
  handleAnalyzeWeakAreas: () => void;
  
  // Challenges & Leaderboard
  weeklyChallenges: any[];
  setWeeklyChallenges: (val: any) => void;
  leaderboard: any[];
  streak: number;
  
  // Topic Mastery
  topicMastery: any[];
  
  // Navigation Callbacks
  setActiveTab: (tab: any) => void;
  setMockExamActive: (val: boolean) => void;
  setShowQuickLogModal: (val: boolean) => void;
  setShowReminderModal: (val: boolean) => void;
  
  // Sub-section state
  activeSubSection: "schedule" | "goals" | "weak" | "quests" | "mastery";
  setActiveSubSection: (sec: "schedule" | "goals" | "weak" | "quests" | "mastery") => void;
}

export const DuolingoLearnPath: React.FC<DuolingoLearnPathProps> = ({
  profile,
  setProfile,
  scoreInputs,
  handleScoreInputChange,
  handleScoreInputBlur,
  adjustScoreDelta,
  handleResetAllData,
  timetableConfig,
  setTimetableConfig,
  generatedTimetable,
  loadingTimetable,
  handleGenerateTimetable,
  scoreGapAnalysis,
  loadingScoreGap,
  handleGenerateScoreGap,
  weakAreaDescription,
  setWeakAreaDescription,
  weakAreaAnalysis,
  loadingWeakAreas,
  handleAnalyzeWeakAreas,
  weeklyChallenges,
  setWeeklyChallenges,
  leaderboard,
  streak,
  topicMastery,
  setActiveTab,
  setMockExamActive,
  setShowQuickLogModal,
  setShowReminderModal,
  activeSubSection,
  setActiveSubSection
}) => {
  const units = [
    {
      id: "u1",
      number: 1,
      title: "Heart of Algebra & Linear Equations",
      description: "Master multi-step linear equations, systems, inequalities & function graphs.",
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 border-emerald-200",
      textColor: "text-emerald-700",
      btnBg: "bg-emerald-600 hover:bg-emerald-700",
      domain: "Math",
      completedLessons: 4,
      totalLessons: 5,
      nodes: [
        { title: "Linear Equations", status: "completed", icon: "✓" },
        { title: "Systems of 2 Variables", status: "completed", icon: "✓" },
        { title: "Linear Inequalities", status: "completed", icon: "✓" },
        { title: "Function Notation", status: "completed", icon: "✓" },
        { title: "Unit 1 Boss Exam", status: "current", icon: "⭐" }
      ]
    },
    {
      id: "u2",
      number: 2,
      title: "Standard English Conventions",
      description: "Punctuation mastery, relative clauses, subject-verb agreement & modifiers.",
      color: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-50 border-indigo-200",
      textColor: "text-indigo-700",
      btnBg: "bg-indigo-600 hover:bg-indigo-700",
      domain: "Reading & Writing",
      completedLessons: 3,
      totalLessons: 5,
      nodes: [
        { title: "Semicolons & Dashes", status: "completed", icon: "✓" },
        { title: "Subject-Verb Agreement", status: "completed", icon: "✓" },
        { title: "Dangling Modifiers", status: "completed", icon: "✓" },
        { title: "Transitions & Logic", status: "current", icon: "⭐" },
        { title: "Unit 2 Boss Exam", status: "locked", icon: "🔒" }
      ]
    },
    {
      id: "u3",
      number: 3,
      title: "Advanced Math & Quadratics",
      description: "Polynomial operations, quadratic formulas, complex roots & exponents.",
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50 border-purple-200",
      textColor: "text-purple-700",
      btnBg: "bg-purple-600 hover:bg-purple-700",
      domain: "Math",
      completedLessons: 2,
      totalLessons: 5,
      nodes: [
        { title: "Factoring Quadratics", status: "completed", icon: "✓" },
        { title: "Quadratic Formula & Discriminant", status: "completed", icon: "✓" },
        { title: "Exponential Growth & Decay", status: "current", icon: "⭐" },
        { title: "Complex Numbers & i", status: "locked", icon: "🔒" },
        { title: "Unit 3 Boss Exam", status: "locked", icon: "🔒" }
      ]
    },
    {
      id: "u4",
      number: 4,
      title: "Craft, Structure & Reading Inferences",
      description: "Passage organization, command of evidence, vocabulary in context.",
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50 border-amber-200",
      textColor: "text-amber-700",
      btnBg: "bg-amber-600 hover:bg-amber-700",
      domain: "Reading & Writing",
      completedLessons: 1,
      totalLessons: 5,
      nodes: [
        { title: "Vocabulary in Context", status: "completed", icon: "✓" },
        { title: "Cross-Text Connections", status: "current", icon: "⭐" },
        { title: "Command of Quantitative Evidence", status: "locked", icon: "🔒" },
        { title: "Central Claims & Inferences", status: "locked", icon: "🔒" },
        { title: "Unit 4 Boss Exam", status: "locked", icon: "🔒" }
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* SAT LEARNING ROADMAP / PATH TRAIL */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                SAT STUDY ROADMAP
              </span>
              <span className="text-xs text-slate-400 font-bold">4 Comprehensive Units</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight mt-1">
              Your Daily SAT Mastery Path
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab("practice"); setMockExamActive(false); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play size={14} className="fill-white" />
              <span>START TODAY'S DRILL</span>
            </button>
          </div>
        </div>

        {/* UNIT ROADMAP CARDS */}
        <div className="space-y-5">
          {units.map((unit) => (
            <div
              key={unit.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${unit.bgColor}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${unit.textColor} bg-white/80 border border-current`}>
                      UNIT {unit.number} • {unit.domain}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {unit.completedLessons}/{unit.totalLessons} Lessons Complete
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 mt-1">
                    {unit.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {unit.description}
                  </p>
                </div>

                <button
                  onClick={() => { setActiveTab("practice"); setMockExamActive(false); }}
                  className={`px-4 py-2 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${unit.btnBg}`}
                >
                  <Play size={12} className="fill-white" />
                  <span>JUMP IN</span>
                </button>
              </div>

              {/* DUOLINGO STEP NODES PATH */}
              <div className="flex flex-wrap items-center justify-around gap-2 pt-2 border-t border-slate-200/60">
                {unit.nodes.map((node, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => { setActiveTab("practice"); setMockExamActive(false); }}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm transition-all cursor-pointer shadow-xs border-b-4 ${
                        node.status === "completed"
                          ? "bg-emerald-500 border-emerald-700 text-white hover:scale-105"
                          : node.status === "current"
                          ? "bg-amber-400 border-amber-600 text-amber-950 animate-bounce hover:scale-105"
                          : "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed"
                      }`}
                      title={node.title}
                    >
                      {node.icon}
                    </button>
                    <span className="text-[10px] font-bold text-slate-600 max-w-[80px] text-center truncate">
                      {node.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-SECTIONS NAVIGATION BAR ("let them be below the app") */}
      {/* ============================================================== */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-600" /> SAT SUB-SECTIONS & TOOLS
            </h3>
            <p className="text-[11px] font-medium text-slate-500">
              Access schedule timetables, score gap analysis, weak area diagnostics & quests below.
            </p>
          </div>
        </div>

        {/* Sub-Section Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveSubSection("schedule")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSubSection === "schedule"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar size={14} />
            <span>📅 Study Schedule & Timetable</span>
          </button>

          <button
            onClick={() => setActiveSubSection("goals")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSubSection === "goals"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Target size={14} />
            <span>📊 Score Goals & Gap Analysis</span>
          </button>

          <button
            onClick={() => setActiveSubSection("weak")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSubSection === "weak"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Sliders size={14} />
            <span>🔍 Weak Area Diagnostic</span>
          </button>

          <button
            onClick={() => setActiveSubSection("quests")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSubSection === "quests"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Award size={14} />
            <span>🏆 Quests & Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveSubSection("mastery")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSubSection === "mastery"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <TrendingUp size={14} />
            <span>📈 Topic Mastery</span>
          </button>
        </div>

        {/* SUB-SECTION 1: STUDY SCHEDULE & TIMETABLE */}
        {activeSubSection === "schedule" && (
          <div className="space-y-4 animate-fade-in pt-2">
            <WidgetCard
              id="timetable-generator-card"
              title="Personalized SAT Study Timetable Generator"
              subtitle="Generate a day-by-day prep plan matched to your target test date"
              icon={Calendar}
              badge={{ text: "AI Plan", color: "bg-teal-50 text-teal-700 border border-teal-200" }}
              actions={
                <button
                  onClick={handleGenerateTimetable}
                  disabled={loadingTimetable}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold rounded-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  {loadingTimetable ? <RefreshCw className="animate-spin" size={10} /> : <Sparkles size={11} />}
                  <span>Generate AI Timetable</span>
                </button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Available Hours / Week</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={timetableConfig.weeklyHours}
                    onChange={(e) => setTimetableConfig({ ...timetableConfig, weeklyHours: parseInt(e.target.value, 10) || 10 })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Math vs R&W Focus Split</label>
                  <select
                    value={timetableConfig.focusSubject}
                    onChange={(e) => setTimetableConfig({ ...timetableConfig, focusSubject: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-800"
                  >
                    <option value="balanced">Balanced 50/50 Split</option>
                    <option value="math">Math Heavy (70% Math / 30% R&W)</option>
                    <option value="reading">Reading & Writing Heavy (70% R&W / 30% Math)</option>
                  </select>
                </div>
              </div>

              {generatedTimetable && (
                <div className="mt-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs leading-relaxed max-h-56 overflow-y-auto text-slate-700">
                  <FormattedMarkdown text={generatedTimetable} className="text-slate-700" />
                </div>
              )}
            </WidgetCard>
          </div>
        )}

        {/* SUB-SECTION 2: SCORE GOALS & GAP ANALYSIS */}
        {activeSubSection === "goals" && (
          <div className="space-y-4 animate-fade-in pt-2">
            <WidgetCard
              id="score-gap-card"
              title="SAT Score Target & Gap Strategy"
              subtitle="Configure target scores and calculate required score velocity"
              icon={Target}
              badge={{ text: "Score Roadmap", color: "bg-indigo-50 text-indigo-600 border border-indigo-200" }}
              actions={
                <button
                  onClick={handleResetAllData}
                  className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded cursor-pointer"
                >
                  🔄 Reset Scores
                </button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">Math Score Target</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-bold">Current Math:</span>
                    <input
                      type="number"
                      step="10"
                      min="200"
                      max="800"
                      value={scoreInputs.currentMath}
                      onChange={(e) => handleScoreInputChange("currentMath", e.target.value)}
                      onBlur={() => handleScoreInputBlur("currentMath", "currentMath")}
                      className="w-20 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-black text-indigo-700 text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-bold">Target Math:</span>
                    <input
                      type="number"
                      step="10"
                      min="200"
                      max="800"
                      value={scoreInputs.targetMath}
                      onChange={(e) => handleScoreInputChange("targetMath", e.target.value)}
                      onBlur={() => handleScoreInputBlur("targetMath", "targetMath")}
                      className="w-20 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-black text-emerald-700 text-right"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">Reading & Writing Target</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-bold">Current R&W:</span>
                    <input
                      type="number"
                      step="10"
                      min="200"
                      max="800"
                      value={scoreInputs.currentReadingWriting}
                      onChange={(e) => handleScoreInputChange("currentReadingWriting", e.target.value)}
                      onBlur={() => handleScoreInputBlur("currentReadingWriting", "currentReadingWriting")}
                      className="w-20 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-black text-indigo-700 text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-bold">Target R&W:</span>
                    <input
                      type="number"
                      step="10"
                      min="200"
                      max="800"
                      value={scoreInputs.targetReadingWriting}
                      onChange={(e) => handleScoreInputChange("targetReadingWriting", e.target.value)}
                      onBlur={() => handleScoreInputBlur("targetReadingWriting", "targetReadingWriting")}
                      className="w-20 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-black text-emerald-700 text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleGenerateScoreGap}
                  disabled={loadingScoreGap}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {loadingScoreGap ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                  <span>Generate Score Gap Strategy</span>
                </button>
              </div>

              {scoreGapAnalysis && (
                <div className="mt-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs leading-relaxed max-h-56 overflow-y-auto text-slate-700">
                  <FormattedMarkdown text={scoreGapAnalysis} className="text-slate-700" />
                </div>
              )}
            </WidgetCard>
          </div>
        )}

        {/* SUB-SECTION 3: WEAK AREA DIAGNOSTIC */}
        {activeSubSection === "weak" && (
          <div className="space-y-4 animate-fade-in pt-2">
            <WidgetCard
              id="weak-area-subcard"
              title="SAT Weakness Diagnostic & Strategy"
              subtitle="Describe specific topics or question types you find challenging"
              icon={Sliders}
              badge={{ text: "Diagnostic AI", color: "bg-purple-50 text-purple-700 border border-purple-200" }}
              actions={
                <button
                  onClick={handleAnalyzeWeakAreas}
                  disabled={loadingWeakAreas}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  {loadingWeakAreas ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                  <span>Analyze Weak Areas</span>
                </button>
              }
            >
              <textarea
                value={weakAreaDescription}
                onChange={(e) => setWeakAreaDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-20"
                placeholder="Example: I struggle with punctuating relative clauses with commas, and solving quadratics with complex roots..."
              ></textarea>

              {weakAreaAnalysis && (
                <div className="mt-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs leading-relaxed max-h-56 overflow-y-auto text-slate-700">
                  <FormattedMarkdown text={weakAreaAnalysis} className="text-slate-700" />
                </div>
              )}
            </WidgetCard>
          </div>
        )}

        {/* SUB-SECTION 4: QUESTS & LEADERBOARD */}
        {activeSubSection === "quests" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-2">
            {/* Weekly Challenges */}
            <WidgetCard
              id="weekly-challenges-subcard"
              title="Weekly SAT Quests & Milestones"
              subtitle="Complete challenges to earn points and level up your rank"
              icon={Award}
              badge={{ text: "Quests", color: "bg-amber-50 text-amber-700 border border-amber-200" }}
            >
              <div className="space-y-2.5">
                {weeklyChallenges.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setWeeklyChallenges(weeklyChallenges.map(item => item.id === c.id ? { ...item, completed: !item.completed } : item));
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      c.completed
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black border ${
                        c.completed ? "bg-emerald-600 text-white border-emerald-700" : "bg-white border-slate-300 text-transparent"
                      }`}>
                        ✓
                      </div>
                      <span className="text-xs font-extrabold">{c.text}</span>
                    </div>
                    <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                      +{c.points} PTS
                    </span>
                  </div>
                ))}
              </div>
            </WidgetCard>

            {/* Global Leaderboard */}
            <WidgetCard
              id="leaderboard-subcard"
              title="Global SAT Student Rankings"
              subtitle="Top students preparing for the upcoming Digital SAT"
              icon={Award}
              badge={{ text: "Live Rank", color: "bg-indigo-50 text-indigo-700 border border-indigo-200" }}
            >
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      idx === 0 ? "bg-amber-50/80 border-amber-200" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                        idx === 0 ? "bg-amber-400 text-amber-950" : idx === 1 ? "bg-slate-300 text-slate-800" : "bg-amber-700/20 text-amber-900"
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-extrabold text-slate-800">{entry.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                          <span>Target: {entry.targetScore}</span>
                          <span className="text-orange-600">🔥 {entry.streak}d</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-900 text-white font-black text-[10px] rounded-lg">
                      {entry.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </WidgetCard>
          </div>
        )}

        {/* SUB-SECTION 5: TOPIC MASTERY HEATMAP */}
        {activeSubSection === "mastery" && (
          <div className="space-y-4 animate-fade-in pt-2">
            <WidgetCard
              id="topic-mastery-subcard"
              title="SAT Domain Topic Mastery Heatmap"
              subtitle="Track your estimated competency level across Math & Reading topics"
              icon={TrendingUp}
              badge={{ text: "Domain Mastery", color: "bg-blue-50 text-blue-700 border border-blue-200" }}
            >
              <div className="space-y-3">
                {topicMastery.map((tm, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-extrabold text-slate-700">
                      <span>{tm.topic}</span>
                      <span className="text-indigo-600 font-black">{tm.masteryPercent}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          tm.masteryPercent >= 80
                            ? "bg-emerald-500"
                            : tm.masteryPercent >= 60
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${tm.masteryPercent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </WidgetCard>
          </div>
        )}
      </div>
    </div>
  );
};

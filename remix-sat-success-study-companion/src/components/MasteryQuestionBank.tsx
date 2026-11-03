import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Loader2, RefreshCw, RotateCcw, Target, ZoomIn } from "lucide-react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Subject = "Math" | "Reading and Writing";
type Difficulty = "Easy" | "Medium" | "Hard";
type Unit = {
  id: string;
  subject: Subject;
  domain: string;
  skill: string;
  count: number;
  pack: string;
  size: number;
  reviewOnlyCount: number;
};
type Manifest = {
  version: number;
  total: number;
  mathCount: number;
  readingWritingCount: number;
  reviewOnlyCount: number;
  units: Unit[];
};
type BankQuestion = {
  id: string;
  difficulty: Difficulty;
  answer: string;
  reviewOnly: boolean;
  prompt: string;
  options: string[];
  images: string[];
  explanation: string;
  rationaleImages: string[];
};
type Attempt = {
  response: string;
  correct: boolean;
  reviewed: boolean;
  attempts: number;
  updatedAt: string;
};
type Progress = Record<string, Record<string, Attempt>>;

const localKey = (uid: string) => "sat_mastery_bank_progress_" + uid;

function loadLocal(uid: string): Progress {
  try {
    const raw = localStorage.getItem(localKey(uid));
    const result = raw ? JSON.parse(raw) : {};
    return result && typeof result === "object" ? result : {};
  } catch {
    return {};
  }
}

function numericValue(value: string): number | null {
  const trimmed = value.trim().replace(/\s+/g, "").replace(/^0+(?=\d)/, "");
  if (/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    const valueNumber = Number(trimmed);
    return Number.isFinite(valueNumber) ? valueNumber : null;
  }
  if (/^[-+]?\d+\/[-+]?\d+$/.test(trimmed)) {
    const [a, b] = trimmed.split("/").map(Number);
    return b !== 0 ? a / b : null;
  }
  return null;
}

function isCorrectResponse(response: string, expected: string): boolean {
  const given = response.trim().toUpperCase().replace(/\s/g, "");
  if (/^[ABCD]$/.test(expected.trim())) return given === expected.trim().toUpperCase();
  const gnum = numericValue(response);
  return expected.split(",").some((choice) => {
    const match = choice.trim();
    if (given === match.toUpperCase().replace(/\s/g, "")) return true;
    const n = numericValue(match);
    return gnum !== null && n !== null && Math.abs(gnum - n) <= 0.0006;
  });
}

async function fetchQuestionPack(path: string): Promise<BankQuestion[]> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("Question pack unavailable (HTTP " + response.status + ").");
  const bytes = await response.arrayBuffer();
  const raw = new Uint8Array(bytes);
  let json: string;
  if (raw[0] === 31 && raw[1] === 139) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Please update your browser to load compressed question packs.");
    }
    const uncompressed = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    json = await new Response(uncompressed).text();
  } else {
    json = new TextDecoder().decode(raw);
  }
  const data = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error("Invalid SAT question pack.");
  return data as BankQuestion[];
}

function getCount(unit: Unit, progress: Progress): { practiced: number; mastered: number } {
  const answers = Object.values(progress[unit.id] || {});
  return {
    practiced: answers.length,
    mastered: answers.filter((a) => a.correct).length
  };
}

export const MasteryQuestionBank: React.FC<{ onAvailabilityChange?: (available: boolean) => void }> = ({ onAvailabilityChange }) => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loadingPack, setLoadingPack] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<Progress>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [expandedImage, setExpandedImage] = useState(false);
  const [filter, setFilter] = useState<"All" | Subject>("All");
  const [search, setSearch] = useState("");
  const uid = auth.currentUser?.uid || "guest";

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/sat-bank/index.json", { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error("No uploaded question index.");
        const parsed = await res.json() as Manifest;
        if (parsed.version !== 1 || !Array.isArray(parsed.units) || !parsed.units.length) {
          throw new Error("Invalid question index.");
        }
        if (active) {
          setManifest(parsed);
          onAvailabilityChange?.(true);
        }
      } catch {
        if (active) onAvailabilityChange?.(false);
      } finally {
        if (active) setLoadingIndex(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [onAvailabilityChange]);

  useEffect(() => {
    let active = true;
    const local = loadLocal(uid);
    setProgress(local);
    if (uid === "guest") return () => { active = false; };
    getDocs(collection(db, "users", uid, "masteryProgress"))
      .then((snapshot) => {
        if (!active) return;
        const remote: Progress = {};
        snapshot.forEach((entry) => {
          const data = entry.data();
          if (data.answers && typeof data.answers === "object") {
            remote[entry.id] = data.answers as Record<string, Attempt>;
          }
        });
        // Cloud attempts are authoritative for a signed-in account.
        const merged: Progress = { ...local, ...remote };
        setProgress(merged);
        localStorage.setItem(localKey(uid), JSON.stringify(merged));
      })
      .catch((err) => {
        console.error("Unable to retrieve SAT mastery progress:", err);
        if (active) setSaveError("Progress is saved on this device; account sync is unavailable.");
      });
    return () => { active = false; };
  }, [uid]);

  const visibleUnits = useMemo(() => {
    const query = search.toLowerCase().trim();
    return (manifest?.units || []).filter((unit) =>
      (filter === "All" || unit.subject === filter) &&
      (!query || (unit.domain + " " + unit.skill).toLowerCase().includes(query))
    );
  }, [manifest, filter, search]);

  const question = questions[currentIndex];
  const prior = selectedUnit && question ? progress[selectedUnit.id]?.[question.id] : undefined;

  const openUnit = async (unit: Unit) => {
    setSelectedUnit(unit);
    setQuestions([]);
    setLoadingPack(true);
    setError("");
    setSaveError("");
    setResponse("");
    setShowExplanation(false);
    setExpandedImage(false);
    try {
      const loaded = await fetchQuestionPack(unit.pack);
      if (!loaded.length) throw new Error("This unit has no questions.");
      setQuestions(loaded);
      const saved = progress[unit.id] || {};
      const next = loaded.findIndex((q) => !saved[q.id]);
      setCurrentIndex(next >= 0 ? next : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the unit.");
    } finally {
      setLoadingPack(false);
    }
  };

  const moveTo = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    setResponse("");
    setShowExplanation(false);
    setExpandedImage(false);
    setSaveError("");
  };

  const submitAnswer = async () => {
    if (!selectedUnit || !question || !response.trim()) return;
    const isReview = question.reviewOnly || !question.answer.trim();
    const correct = isReview ? false : isCorrectResponse(response, question.answer);
    const previous = progress[selectedUnit.id]?.[question.id];
    const attempt: Attempt = {
      response: response.trim(),
      correct: Boolean(previous?.correct) || correct,
      reviewed: true,
      attempts: (previous?.attempts || 0) + 1,
      updatedAt: new Date().toISOString()
    };
    const nextProgress = {
      ...progress,
      [selectedUnit.id]: {
        ...(progress[selectedUnit.id] || {}),
        [question.id]: attempt
      }
    };
    setProgress(nextProgress);
    setShowExplanation(true);
    setSaveError("");
    try { localStorage.setItem(localKey(uid), JSON.stringify(nextProgress)); } catch { /* storage unavailable */ }
    if (uid === "guest") return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", uid, "masteryProgress", selectedUnit.id), {
        answers: { [question.id]: attempt },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Unable to sync mastery answer:", err);
      setSaveError("Saved on this device, but cloud sync failed. Try again after reconnecting.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingIndex) {
    return <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-500 flex gap-2 items-center"><Loader2 className="animate-spin" size={16} /> Loading SAT mastery catalog...</div>;
  }

  // The old roadmap remains available until the question pack is uploaded.
  if (!manifest) return null;

  const questionCount = manifest.total;
  const totalAttempted = manifest.units.reduce((sum, unit) => sum + getCount(unit, progress).practiced, 0);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600">SAT MASTERY PATH · QUESTION BANK</div>
          <h2 className="text-xl font-black text-slate-900 mt-1">Learn by SAT Skill</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {questionCount.toLocaleString()} authentic-format questions across {manifest.units.length} skill units.
            Your answer history syncs to your student account.
          </p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 rounded-xl px-4 py-3 text-center shrink-0">
          <div className="text-lg font-black">{totalAttempted.toLocaleString()} / {questionCount.toLocaleString()}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold">Questions practiced</div>
        </div>
      </header>

      {!selectedUnit ? (
        <>
          <div className="flex gap-2 items-center flex-wrap">
            {(["All", "Math", "Reading and Writing"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={filter === option
                  ? "rounded-xl px-3 py-2 text-xs font-bold bg-indigo-600 text-white"
                  : "rounded-xl px-3 py-2 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"}
              >{option === "Reading and Writing" ? "Reading & Writing" : option}</button>
            ))}
            <input
              className="min-w-0 flex-1 basis-44 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Find a skill..."
              aria-label="Search SAT mastery units"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {visibleUnits.map((unit, index) => {
              const counts = getCount(unit, progress);
              const percent = Math.round((counts.practiced / unit.count) * 100);
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => { void openUnit(unit); }}
                  className="text-left p-4 border border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Unit {unit.id.slice(1)} · {unit.subject === "Math" ? "Math" : "R&W"}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{unit.count} questions</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">{unit.skill}</h3>
                  <div className="text-[11px] text-slate-500">{unit.domain}</div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: percent + "%" }} />
                  </div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-500">
                    <span>{counts.practiced} attempted · {counts.mastered} mastered</span>
                    <span>{percent}%</span>
                  </div>
                </button>
              );
            })}
          </div>
          {visibleUnits.length === 0 && <p className="text-sm text-slate-500">No matching SAT skills found.</p>}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => { setSelectedUnit(null); setQuestions([]); }} className="flex items-center gap-1 text-sm font-bold text-indigo-700 hover:underline">
              <ChevronLeft size={16} /> All units
            </button>
            <span className="text-xs text-slate-500 font-semibold">{selectedUnit.domain}</span>
          </div>
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-lg font-black text-slate-900">{selectedUnit.skill}</h3>
            <p className="text-xs text-slate-500">{selectedUnit.subject} · {selectedUnit.count} questions · Easy, Medium and Hard</p>
          </div>
          {loadingPack ? (
            <div className="p-8 flex items-center justify-center gap-2 text-slate-500 text-sm"><Loader2 className="animate-spin" size={18} /> Loading questions for this unit...</div>
          ) : error ? (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
              <p>{error}</p>
              <button type="button" className="mt-3 underline font-bold" onClick={() => { void openUnit(selectedUnit); }}><RefreshCw size={14} className="inline mr-1" />Retry</button>
            </div>
          ) : question ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-3 text-xs">
                <span className="text-slate-600 font-bold">Question {currentIndex + 1} of {questions.length}</span>
                <div className="flex items-center gap-2">
                  <span className={question.difficulty === "Hard" ? "text-red-700 font-bold" : question.difficulty === "Easy" ? "text-green-700 font-bold" : "text-amber-700 font-bold"}>{question.difficulty}</span>
                  {prior && <span className="text-indigo-600 font-bold"><CheckCircle2 size={13} className="inline" /> Attempted</span>}
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full rounded-full" style={{ width: (((currentIndex + 1) / questions.length) * 100) + "%" }} /></div>
              {selectedUnit.subject === "Reading and Writing" && question.prompt && question.options.length === 4 ? (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-line">{question.prompt}</div>
                  {/\b(graph|figure|chart|table|diagram|scatterplot)\b/i.test(question.prompt) && question.images.map((src, index) => (
                    <div key={index} className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <img src={src} alt={"Original question layout " + (index + 1)} className="w-full h-auto" loading="lazy" />
                    </div>
                  ))}
                  <div className="grid grid-cols-1 gap-2">
                    {question.options.map((option, i) => {
                      const letter = "ABCD"[i];
                      return (
                        <button key={letter} disabled={showExplanation} type="button" onClick={() => setResponse(letter)}
                          className={(response === letter ? "bg-indigo-50 border-indigo-500 text-indigo-900" : "bg-white border-slate-200 text-slate-800") + " text-left border-2 rounded-xl p-3 flex gap-3 disabled:cursor-default"}>
                          <span className="font-black text-indigo-600 shrink-0">{letter}.</span>
                          <span className="text-sm whitespace-pre-wrap">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-slate-500">Read the question and choices in the original PDF layout. Tap to enlarge.</div>
                  {question.images.map((src, index) => (
                    <div key={index} className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                      <img
                        src={src} alt={"SAT question illustration " + (index + 1)}
                        onClick={() => setExpandedImage(!expandedImage)}
                        className={expandedImage ? "max-w-none w-[1100px] cursor-zoom-out" : "w-full h-auto cursor-zoom-in"}
                        loading="lazy"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => setExpandedImage(!expandedImage)} className="text-xs font-bold text-indigo-700 flex items-center gap-1"><ZoomIn size={13} /> {expandedImage ? "Fit image to screen" : "Enlarge question image"}</button>
                  {question.answer.trim().length === 1 && /^[ABCD]$/i.test(question.answer.trim()) ? (
                    <div className="grid grid-cols-4 gap-2">
                      {["A","B","C","D"].map((letter) => (
                        <button key={letter} type="button" disabled={showExplanation} onClick={() => setResponse(letter)}
                          className={(response === letter ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-800 border-slate-200") + " rounded-xl py-3 font-black border-2 disabled:cursor-default"}>{letter}</button>
                      ))}
                    </div>
                  ) : (
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">{question.reviewOnly ? "Your answer (review only)" : "Student-produced response"}</span>
                      <input disabled={showExplanation} type="text" value={response} onChange={(event) => setResponse(event.target.value)}
                        placeholder="Enter your answer, e.g. 3/4 or 0.75"
                        className="block w-full mt-2 border border-slate-300 rounded-xl px-4 py-3 text-base outline-none focus:border-indigo-500 disabled:bg-slate-50"
                      />
                    </label>
                  )}
                </>
              )}
              {!showExplanation ? (
                <button type="button" disabled={!response.trim()} onClick={() => { void submitAnswer(); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-extrabold text-sm disabled:opacity-50">
                  {question.reviewOnly ? "Review answer" : "Check answer"}
                </button>
              ) : (
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                  <div className="font-extrabold text-sm text-slate-900">
                    {question.reviewOnly ? "Review with the supplied worked solution" : isCorrectResponse(response, question.answer) ? "Correct answer!" : "Let's review this question"}
                  </div>
                  {question.reviewOnly
                    ? <div className="text-xs text-amber-800">The PDF does not expose this answer as readable text, so automatic grading is disabled. Your attempt was recorded.</div>
                    : <p className="text-xs font-bold text-slate-700">Correct answer: {question.answer}</p>}
                  {question.rationaleImages.length > 0 ? (
                    <div className="space-y-2">
                      {question.rationaleImages.map((src,index) => (
                        <div key={index} className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                          <img src={src} alt={"Worked solution " + (index + 1)} className="w-full h-auto" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  ) : question.explanation ? <p className="text-sm whitespace-pre-line leading-relaxed text-slate-700">{question.explanation}</p> : null}
                  {saving && <p className="text-xs text-indigo-600"><Loader2 size={12} className="inline animate-spin" /> Syncing progress...</p>}
                  {saveError && <p className="text-xs text-amber-700">{saveError}</p>}
                  <button type="button" onClick={() => { setResponse(""); setShowExplanation(false); }} className="text-xs font-bold text-indigo-700 flex items-center gap-1"><RotateCcw size={13} /> Try this question again</button>
                </div>
              )}
              <div className="flex justify-between items-center gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => moveTo(currentIndex - 1)} disabled={currentIndex === 0} className="flex items-center gap-1 text-xs font-bold border rounded-xl px-3 py-2 disabled:opacity-40"><ChevronLeft size={16} /> Previous</button>
                <button type="button" onClick={() => moveTo(currentIndex + 1)} disabled={currentIndex + 1 === questions.length} className="flex items-center gap-1 text-xs font-bold bg-indigo-600 text-white rounded-xl px-4 py-2 disabled:opacity-40">Next <ChevronRight size={16} /></button>
              </div>
            </div>
          ) : null}
        </>
      )}
      <p className="text-[10px] text-slate-400 leading-relaxed">
        Content imported from your SAT question-bank PDF exports. Progress is measured by actual attempts; unscorable source answers remain review-only rather than receiving an invented grade.
      </p>
    </section>
  );
};

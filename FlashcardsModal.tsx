import React, { useState } from "react";
import { X, Sparkles, RotateCw, CheckCircle, ArrowRight, ArrowLeft, BookmarkCheck } from "lucide-react";

interface Flashcard {
  id: string;
  category: "vocab" | "math" | "grammar";
  front: string;
  contextOrFormula: string;
  back: string;
  exampleOrNote: string;
}

const FLASHCARDS_DATA: Flashcard[] = [
  {
    id: "f1",
    category: "vocab",
    front: "Ubiquitous",
    contextOrFormula: "Adjective (SAT Reading Craft & Structure)",
    back: "Present, appearing, or found everywhere; omnipresent.",
    exampleOrNote: "Example: 'Smartphones have become so ubiquitous that even remote regions rely on mobile banking.'"
  },
  {
    id: "f2",
    category: "vocab",
    front: "Ephemeral",
    contextOrFormula: "Adjective (SAT Reading Craft & Structure)",
    back: "Lasting for a very short time; fleeting or transitory.",
    exampleOrNote: "Example: 'Fame on social media can be ephemeral, disappearing within days.'"
  },
  {
    id: "f3",
    category: "vocab",
    front: "Pragmatic",
    contextOrFormula: "Adjective (SAT Tone & Character Analysis)",
    back: "Dealing with things sensibly and realistically; practical rather than idealistic.",
    exampleOrNote: "Example: 'The committee took a pragmatic approach, choosing the most affordable solution.'"
  },
  {
    id: "f4",
    category: "vocab",
    front: "Bolster",
    contextOrFormula: "Verb (SAT Evidence & Argumentation)",
    back: "To support, strengthen, or prop up an argument or hypothesis.",
    exampleOrNote: "Example: 'The researcher presented tree ring data to bolster her climate change model.'"
  },
  {
    id: "f5",
    category: "vocab",
    front: "Delineate",
    contextOrFormula: "Verb (SAT Informational Passages)",
    back: "To describe, portray, or outline with precision.",
    exampleOrNote: "Example: 'The author carefully delineated the four economic stages leading to the crash.'"
  },
  {
    id: "f6",
    category: "math",
    front: "Vertex of Parabola y = ax² + bx + c",
    contextOrFormula: "x-coordinate & vertex form",
    back: "x = -b / (2a)",
    exampleOrNote: "To find y, plug x back in. In vertex form y = a(x - h)² + k, the vertex is (h, k)."
  },
  {
    id: "f7",
    category: "math",
    front: "Quadratic Discriminant Δ",
    contextOrFormula: "Δ = b² - 4ac",
    back: "Determines the number and nature of roots.",
    exampleOrNote: "Δ > 0: two real roots; Δ = 0: one real double root; Δ < 0: no real solutions."
  },
  {
    id: "f8",
    category: "math",
    front: "Exponential Growth & Decay Formula",
    contextOrFormula: "Compound interest & population",
    back: "y = a(1 ± r)ᵗ  or  y = a(b)ᵗ",
    exampleOrNote: "a = initial amount, r = percent rate as decimal, b = growth factor (b > 1 for growth, 0 < b < 1 for decay)."
  },
  {
    id: "f9",
    category: "grammar",
    front: "Semicolon Rule (;)",
    contextOrFormula: "Standard English Conventions",
    back: "Connects two independent clauses without a coordinating conjunction.",
    exampleOrNote: "Independent Clause ; Independent Clause. (e.g., 'The rain stopped; the sun broke through the clouds.')"
  },
  {
    id: "f10",
    category: "grammar",
    front: "Colon Rule (:)",
    contextOrFormula: "Standard English Conventions",
    back: "Must be preceded by a complete independent clause to introduce an explanation, list, or quote.",
    exampleOrNote: "Complete sentence : explanation or elaboration. (Never place a colon after 'such as' or 'including')."
  },
  {
    id: "f11",
    category: "vocab",
    front: "Substantiate",
    contextOrFormula: "Verb (SAT Rhetorical Synthesis)",
    back: "To provide evidence to support or prove the truth of something.",
    exampleOrNote: "Example: 'Archaeologists uncovered pottery shards that substantiated the oral legend.'"
  },
  {
    id: "f12",
    category: "math",
    front: "Standard Equation of a Circle",
    contextOrFormula: "Geometry & Trigonometry in xy-Plane",
    back: "(x - h)² + (y - k)² = r²",
    exampleOrNote: "Center is at (h, k), and radius is r (always take the square root of the right-hand constant)."
  }
];

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FlashcardsModal({ isOpen, onClose }: FlashcardsModalProps) {
  const [filter, setFilter] = useState<"all" | "vocab" | "math" | "grammar">("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const filteredCards = FLASHCARDS_DATA.filter(
    card => filter === "all" || card.category === filter
  );

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const toggleMastered = (id: string) => {
    setMastered(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  High-Yield SAT Flashcards
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                  Daily Drills
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                High-frequency vocabulary, key formulas, and grammar rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Close Flashcards"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex gap-2 shrink-0 bg-white">
          {(["all", "vocab", "math", "grammar"] as const).map(f => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === f
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f === "all" ? "All Cards" : f === "vocab" ? "Vocabulary" : f === "math" ? "Math Formulas" : "Grammar Rules"}
            </button>
          ))}
        </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col items-center justify-center flex-1">
          <div className="w-full flex justify-between items-center text-xs font-bold text-slate-400 mb-3">
            <span>
              CARD {currentIndex + 1} OF {filteredCards.length}
            </span>
            <button
              onClick={() => toggleMastered(currentCard.id)}
              className={`flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                mastered[currentCard.id]
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <BookmarkCheck size={14} />
              {mastered[currentCard.id] ? "Mastered" : "Mark Mastered"}
            </button>
          </div>

          {/* Interactive Flashcard with flip */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[220px] bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/80 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] relative overflow-hidden"
          >
            <div className="absolute top-3 right-3 text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-xs">
              <RotateCw size={11} /> Click to Flip
            </div>

            {!isFlipped ? (
              <div className="space-y-3 my-auto text-center py-4">
                <span className="text-[10px] font-black tracking-wider uppercase text-purple-300 bg-purple-900/60 px-2.5 py-0.5 rounded-full border border-purple-700/50">
                  {currentCard.category.toUpperCase()}
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {currentCard.front}
                </h3>
                <p className="text-xs text-indigo-300 font-medium">
                  {currentCard.contextOrFormula}
                </p>
              </div>
            ) : (
              <div className="space-y-3 my-auto text-center py-4 animate-fade-in">
                <span className="text-[10px] font-black tracking-wider uppercase text-emerald-300 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
                  DEFINITION / FORMULA
                </span>
                <p className="text-base font-extrabold text-emerald-200">
                  {currentCard.back}
                </p>
                <p className="text-xs text-slate-300 italic max-w-md mx-auto leading-relaxed border-t border-white/10 pt-2">
                  {currentCard.exampleOrNote}
                </p>
              </div>
            )}

            <div className="text-center text-[10px] text-slate-400 font-medium">
              {isFlipped ? "Tap card to flip back to term" : "Tap card to reveal definition & strategy"}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between w-full mt-5">
            <button
              onClick={handlePrev}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} /> Previous
            </button>
            <div className="text-xs text-slate-400 font-bold">
              {Object.values(mastered).filter(Boolean).length} / {FLASHCARDS_DATA.length} Mastered
            </div>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

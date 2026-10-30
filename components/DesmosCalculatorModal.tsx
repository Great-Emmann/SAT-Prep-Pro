import React, { useState } from "react";
import { X, ExternalLink, Calculator as CalcIcon, Grid, Delete, RotateCcw } from "lucide-react";

interface DesmosCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DesmosCalculatorModal({ isOpen, onClose }: DesmosCalculatorModalProps) {
  const [activeTab, setActiveTab] = useState<"scientific" | "desmos">("scientific");
  const [calcInput, setCalcInput] = useState<string>("");
  const [calcResult, setCalcResult] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleButtonClick = (val: string) => {
    setCalcInput(prev => prev + val);
  };

  const handleClear = () => {
    setCalcInput("");
    setCalcResult("");
  };

  const handleDelete = () => {
    setCalcInput(prev => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    if (!calcInput.trim()) return;
    try {
      // Safe sanitized math evaluator
      let expr = calcInput
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/g, "Math.PI")
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/√\(/g, "Math.sqrt(")
        .replace(/\^/g, "**");

      // Validate characters allowed
      if (!/^[0-9+\-*/(). MathPIsincotaqrt*]+$/.test(expr)) {
        setCalcResult("Invalid Input");
        return;
      }

      // eslint-disable-next-line no-eval
      const res = Function(`"use strict"; return (${expr})`)();
      if (typeof res === "number" && !isNaN(res)) {
        const formatted = Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(6)).toString();
        setCalcResult(formatted);
        setHistory(prev => [calcInput + " = " + formatted, ...prev.slice(0, 7)]);
      } else {
        setCalcResult("Error");
      }
    } catch {
      setCalcResult("Syntax Error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
              <CalcIcon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  Digital SAT Calculator Suite
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Desmos™ Integrated
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Standard digital SAT in-test calculator tools
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.desmos.com/calculator"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                try {
                  window.open("https://www.desmos.com/calculator", "_blank", "noopener,noreferrer");
                } catch {
                  // allow default href
                }
              }}
              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Open full Desmos in new tab"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Desmos Web</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              title="Close Calculator"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex gap-2 shrink-0 bg-white">
          <button
            onClick={() => setActiveTab("scientific")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "scientific"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <CalcIcon size={13} /> Fast Scientific Calculator
          </button>
          <button
            onClick={() => setActiveTab("desmos")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "desmos"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Grid size={13} /> Desmos Graphing Calculator
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === "scientific" ? (
            <div className="flex flex-col md:flex-row gap-4">
              {/* Calculator Keypad */}
              <div className="flex-1 space-y-3">
                {/* Screen Display */}
                <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-inner flex flex-col justify-end min-h-[90px] text-right">
                  <div className="text-xs text-slate-400 font-mono overflow-x-auto whitespace-nowrap">
                    {calcInput || "0"}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight overflow-x-auto whitespace-nowrap mt-1">
                    {calcResult || "0"}
                  </div>
                </div>

                {/* Keypad Grid */}
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  {/* Row 1 */}
                  <button
                    onClick={() => handleButtonClick("sin(")}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    sin
                  </button>
                  <button
                    onClick={() => handleButtonClick("cos(")}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    cos
                  </button>
                  <button
                    onClick={() => handleButtonClick("tan(")}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    tan
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition-all flex items-center justify-center gap-1 font-black"
                  >
                    <RotateCcw size={12} /> C
                  </button>

                  {/* Row 2 */}
                  <button
                    onClick={() => handleButtonClick("√(")}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    √x
                  </button>
                  <button
                    onClick={() => handleButtonClick("^2")}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    x²
                  </button>
                  <button
                    onClick={() => handleButtonClick("^")}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    xʸ
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-all flex items-center justify-center gap-1 font-black"
                  >
                    <Delete size={12} /> DEL
                  </button>

                  {/* Row 3 */}
                  <button
                    onClick={() => handleButtonClick("(")}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    (
                  </button>
                  <button
                    onClick={() => handleButtonClick(")")}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    )
                  </button>
                  <button
                    onClick={() => handleButtonClick("π")}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    π
                  </button>
                  <button
                    onClick={() => handleButtonClick("÷")}
                    className="p-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-all text-sm font-black"
                  >
                    ÷
                  </button>

                  {/* Row 4 */}
                  <button
                    onClick={() => handleButtonClick("7")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    7
                  </button>
                  <button
                    onClick={() => handleButtonClick("8")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    8
                  </button>
                  <button
                    onClick={() => handleButtonClick("9")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    9
                  </button>
                  <button
                    onClick={() => handleButtonClick("×")}
                    className="p-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-all text-sm font-black"
                  >
                    ×
                  </button>

                  {/* Row 5 */}
                  <button
                    onClick={() => handleButtonClick("4")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    4
                  </button>
                  <button
                    onClick={() => handleButtonClick("5")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    5
                  </button>
                  <button
                    onClick={() => handleButtonClick("6")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    6
                  </button>
                  <button
                    onClick={() => handleButtonClick("-")}
                    className="p-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-all text-sm font-black"
                  >
                    -
                  </button>

                  {/* Row 6 */}
                  <button
                    onClick={() => handleButtonClick("1")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    1
                  </button>
                  <button
                    onClick={() => handleButtonClick("2")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    2
                  </button>
                  <button
                    onClick={() => handleButtonClick("3")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    3
                  </button>
                  <button
                    onClick={() => handleButtonClick("+")}
                    className="p-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-all text-sm font-black"
                  >
                    +
                  </button>

                  {/* Row 7 */}
                  <button
                    onClick={() => handleButtonClick("0")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black col-span-2"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleButtonClick(".")}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-lg transition-all text-sm font-black"
                  >
                    .
                  </button>
                  <button
                    onClick={handleCalculate}
                    className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all text-sm font-black shadow-sm"
                  >
                    =
                  </button>
                </div>
              </div>

              {/* History & Tips Sidebar */}
              <div className="w-full md:w-56 flex flex-col gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                    Recent Calculations
                  </p>
                  {history.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No calculations yet</p>
                  ) : (
                    <ul className="space-y-1.5 font-mono text-[11px] text-slate-700">
                      {history.map((h, i) => (
                        <li key={i} className="p-1.5 bg-white border border-slate-200/80 rounded-md">
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-950 space-y-1">
                  <p className="font-extrabold text-indigo-900">💡 DSAT Math Tip:</p>
                  <p className="text-indigo-800 leading-snug">
                    Use Desmos graphing mode for solving systems of equations and quadratic intersections instantly without algebraic factoring!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Desmos Iframe View */
            <div className="h-[480px] w-full flex flex-col rounded-xl overflow-hidden border border-slate-300">
              <iframe
                src="https://www.desmos.com/calculator"
                title="Desmos Graphing Calculator"
                className="w-full h-full border-none"
                allow="clipboard-write"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

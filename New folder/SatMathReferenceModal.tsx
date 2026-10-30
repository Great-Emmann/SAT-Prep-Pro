import React, { useState } from "react";
import { X, BookOpen, Sparkles, HelpCircle, Check } from "lucide-react";

interface SatMathReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SatMathReferenceModal({ isOpen, onClose }: SatMathReferenceModalProps) {
  const [activeCategory, setActiveCategory] = useState<"official" | "highyield">("official");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  Official Digital SAT Math Reference Sheet
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                  College Board Standard
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Provided during all Digital SAT Math modules in Bluebook™
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Close Reference Sheet"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex gap-2 shrink-0 bg-white">
          <button
            onClick={() => setActiveCategory("official")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === "official"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📐 Standard Reference Formulas (Official)
          </button>
          <button
            onClick={() => setActiveCategory("highyield")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === "highyield"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ⚡ High-Yield DSAT Cheat Sheet & Formulas
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {activeCategory === "official" ? (
            <>
              {/* Note Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2">
                <span className="text-base">ℹ️</span>
                <span>
                  <strong>Official Notice:</strong> You do not need to memorize these 12 geometric formulas for test day, but knowing how to deploy them instantly saves critical minutes.
                </span>
              </div>

              {/* 2D Geometric Formulas */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  2D Area & Circumference Formulas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Circle */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Circle</span>
                      <div className="my-2 h-16 flex items-center justify-center">
                        <svg viewBox="0 0 100 60" className="h-full">
                          <circle cx="50" cy="30" r="24" fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                          <line x1="50" y1="30" x2="74" y2="30" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="2 2" />
                          <circle cx="50" cy="30" r="2" fill="#0f172a" />
                          <text x="60" y="26" fontSize="10" fontWeight="bold" fill="#0f172a">r</text>
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-1 font-mono text-xs font-bold text-slate-900 border-t border-slate-200 pt-2">
                      <p>A = πr²</p>
                      <p>C = 2πr</p>
                    </div>
                  </div>

                  {/* Rectangle */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Rectangle</span>
                      <div className="my-2 h-16 flex items-center justify-center">
                        <svg viewBox="0 0 100 60" className="h-full">
                          <rect x="15" y="15" width="70" height="30" fill="none" stroke="#4f46e5" strokeWidth="2.5" rx="1" />
                          <text x="48" y="54" fontSize="10" fontWeight="bold" fill="#0f172a">l</text>
                          <text x="5" y="34" fontSize="10" fontWeight="bold" fill="#0f172a">w</text>
                        </svg>
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 border-t border-slate-200 pt-2">
                      <p>A = lw</p>
                    </div>
                  </div>

                  {/* Triangle */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Triangle</span>
                      <div className="my-2 h-16 flex items-center justify-center">
                        <svg viewBox="0 0 100 60" className="h-full">
                          <polygon points="20,50 80,50 50,15" fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                          <line x1="50" y1="15" x2="50" y2="50" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="2 2" />
                          <text x="48" y="58" fontSize="10" fontWeight="bold" fill="#0f172a">b</text>
                          <text x="54" y="35" fontSize="10" fontWeight="bold" fill="#0f172a">h</text>
                        </svg>
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 border-t border-slate-200 pt-2">
                      <p>A = ½bh</p>
                    </div>
                  </div>

                  {/* Pythagorean */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Pythagorean</span>
                      <div className="my-2 h-16 flex items-center justify-center">
                        <svg viewBox="0 0 100 60" className="h-full">
                          <polygon points="25,50 75,50 25,15" fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                          <rect x="25" y="42" width="8" height="8" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                          <text x="48" y="58" fontSize="10" fontWeight="bold" fill="#0f172a">b</text>
                          <text x="15" y="35" fontSize="10" fontWeight="bold" fill="#0f172a">a</text>
                          <text x="54" y="30" fontSize="10" fontWeight="bold" fill="#4f46e5">c</text>
                        </svg>
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 border-t border-slate-200 pt-2">
                      <p>c² = a² + b²</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Right Triangles */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Special Right Triangles (Crucial for Trigonometry)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 30-60-90 */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">30° - 60° - 90° Triangle</span>
                      <p className="text-[11px] text-slate-600 mt-1 font-medium">Ratio of sides: <strong>1 : √3 : 2</strong></p>
                      <ul className="text-[10px] text-slate-500 mt-2 space-y-0.5 font-mono">
                        <li>• Short leg (opp 30°) = x</li>
                        <li>• Long leg (opp 60°) = x√3</li>
                        <li>• Hypotenuse = 2x</li>
                      </ul>
                    </div>
                    <div className="w-32 h-24 shrink-0">
                      <svg viewBox="0 0 100 80" className="w-full h-full">
                        <polygon points="15,70 85,70 15,20" fill="none" stroke="#10b981" strokeWidth="2.5" />
                        <rect x="15" y="60" width="10" height="10" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                        <text x="20" y="32" fontSize="9" fontWeight="bold" fill="#0f172a">60°</text>
                        <text x="62" y="66" fontSize="9" fontWeight="bold" fill="#0f172a">30°</text>
                        <text x="5" y="48" fontSize="10" fontWeight="bold" fill="#0f172a">x</text>
                        <text x="45" y="79" fontSize="10" fontWeight="bold" fill="#0f172a">x√3</text>
                        <text x="55" y="40" fontSize="10" fontWeight="bold" fill="#10b981">2x</text>
                      </svg>
                    </div>
                  </div>

                  {/* 45-45-90 */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">45° - 45° - 90° Triangle (Isosceles)</span>
                      <p className="text-[11px] text-slate-600 mt-1 font-medium">Ratio of sides: <strong>1 : 1 : √2</strong></p>
                      <ul className="text-[10px] text-slate-500 mt-2 space-y-0.5 font-mono">
                        <li>• Leg = s</li>
                        <li>• Other Leg = s</li>
                        <li>• Hypotenuse = s√2</li>
                      </ul>
                    </div>
                    <div className="w-32 h-24 shrink-0">
                      <svg viewBox="0 0 100 80" className="w-full h-full">
                        <polygon points="20,70 75,70 20,15" fill="none" stroke="#10b981" strokeWidth="2.5" />
                        <rect x="20" y="60" width="10" height="10" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                        <text x="24" y="30" fontSize="9" fontWeight="bold" fill="#0f172a">45°</text>
                        <text x="55" y="66" fontSize="9" fontWeight="bold" fill="#0f172a">45°</text>
                        <text x="8" y="46" fontSize="10" fontWeight="bold" fill="#0f172a">s</text>
                        <text x="45" y="79" fontSize="10" fontWeight="bold" fill="#0f172a">s</text>
                        <text x="52" y="38" fontSize="10" fontWeight="bold" fill="#10b981">s√2</text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Solids Volume Formulas */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  3D Volume Formulas
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[9px] font-black uppercase text-purple-700">Rect. Prism</p>
                    <p className="font-mono text-xs font-black text-slate-900 mt-1.5">V = lwh</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[9px] font-black uppercase text-purple-700">Cylinder</p>
                    <p className="font-mono text-xs font-black text-slate-900 mt-1.5">V = πr²h</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[9px] font-black uppercase text-purple-700">Sphere</p>
                    <p className="font-mono text-xs font-black text-slate-900 mt-1.5">V = ⁴⁄₃πr³</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[9px] font-black uppercase text-purple-700">Cone</p>
                    <p className="font-mono text-xs font-black text-slate-900 mt-1.5">V = ⅓πr²h</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center col-span-2 sm:col-span-1">
                    <p className="text-[9px] font-black uppercase text-purple-700">Pyramid</p>
                    <p className="font-mono text-xs font-black text-slate-900 mt-1.5">V = ⅓lwh</p>
                  </div>
                </div>
              </div>

              {/* Degrees & Radians */}
              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-extrabold">Full Circle</p>
                  <p className="text-sm font-black text-amber-400 mt-0.5">360° = 2π radians</p>
                </div>
                <div className="border-t sm:border-t-0 sm:border-x border-slate-800 pt-2 sm:pt-0">
                  <p className="text-[10px] text-slate-400 uppercase font-extrabold">Triangle Angles</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">Sum = 180° = π rad</p>
                </div>
                <div className="border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                  <p className="text-[10px] text-slate-400 uppercase font-extrabold">Straight Line</p>
                  <p className="text-sm font-black text-indigo-400 mt-0.5">180°</p>
                </div>
              </div>
            </>
          ) : (
            /* High-Yield DSAT Formulas */
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-medium">
                ⚡ <strong>Not on the official reference sheet:</strong> These formulas appear on almost every single Digital SAT Math section and must be memorized or used in Desmos!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700">Parabola Vertex Formula</span>
                  <p className="font-mono text-xs font-black text-slate-900">x = -b / (2a)</p>
                  <p className="text-[11px] text-slate-500">For quadratic y = ax² + bx + c, the x-coordinate of the maximum/minimum is -b/(2a). Vertex form: y = a(x - h)² + k with vertex (h, k).</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700">Discriminant (Number of Solutions)</span>
                  <p className="font-mono text-xs font-black text-slate-900">Δ = b² - 4ac</p>
                  <p className="text-[11px] text-slate-500">• Δ &gt; 0: 2 distinct real solutions<br />• Δ = 0: exactly 1 real solution (tangent)<br />• Δ &lt; 0: 0 real solutions</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700">Circle in the xy-Plane</span>
                  <p className="font-mono text-xs font-black text-slate-900">(x - h)² + (y - k)² = r²</p>
                  <p className="text-[11px] text-slate-500">Center is (h, k) and radius is r. Remember to complete the square if given in general form x² + y² + Dx + Ey + F = 0.</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700">Exponential Growth & Decay</span>
                  <p className="font-mono text-xs font-black text-slate-900">y = a(1 ± r)ᵗ  or  y = a(b)ᵗ</p>
                  <p className="text-[11px] text-slate-500">a = initial value, r = percent growth rate, b = 1 + r (growth if b &gt; 1, decay if 0 &lt; b &lt; 1).</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700">Sum and Product of Roots</span>
                  <p className="font-mono text-xs font-black text-slate-900">Sum = -b / a &nbsp;|&nbsp; Product = c / a</p>
                  <p className="text-[11px] text-slate-500">Quickly finds the sum of all solutions to ax² + bx + c = 0 without solving the equation!</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700">Arc Length & Sector Area</span>
                  <p className="font-mono text-xs font-black text-slate-900">Arc = (θ / 360°) · 2πr &nbsp;|&nbsp; Area = (θ / 360°) · πr²</p>
                  <p className="text-[11px] text-slate-500">In radians: Arc length s = rθ, Sector Area A = ½r²θ.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500 font-medium">
            Official College Board SAT Reference Standards • Digital SAT Prep Pro
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

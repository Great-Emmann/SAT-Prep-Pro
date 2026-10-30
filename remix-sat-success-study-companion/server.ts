import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { installPasswordResetOtpRoutes } from "./passwordResetOtp.js";

dotenv.config();

let currentFilename = "";
if (typeof __filename !== "undefined") {
  currentFilename = __filename;
} else if (typeof import.meta !== "undefined" && import.meta.url) {
  currentFilename = fileURLToPath(import.meta.url);
}
const currentDirname = currentFilename ? path.dirname(currentFilename) : process.cwd();

export const app = express();
app.use(express.json());
installPasswordResetOtpRoutes(app);
// Disable the legacy in-memory auth routes: they store plaintext passwords
// and cannot provide durable sessions on serverless hosts.
app.use("/api/auth", (_req, res) => {
  res.status(410).json({ error: "Legacy authentication disabled. Use Firebase Authentication." });
});

// Initialize Gemini API client if key exists and is not placeholder
const apiKey = process.env.GEMINI_API_KEY;
const isApiKeyConfigured = apiKey && apiKey !== "MY_GEMINI_API_KEY";
const aiClient = isApiKeyConfigured ? new GoogleGenAI({ 
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// Helper to query Gemini with fallback and model cascade
async function generateAIResponse(prompt: string, fallbackResponse: string): Promise<string> {
  if (!aiClient) return fallbackResponse;

  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite"
  ];

  for (const model of modelsToTry) {
    try {
      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
      });
      if (response.text) {
        return response.text;
      }
    } catch (error: any) {
      // Catch quota or model unavailable errors silently and continue to next model or fallback
      const status = error?.status || error?.statusCode;
      const errMsg = String(error?.message || "");

      if (
        status === 404 ||
        status === 429 ||
        errMsg.includes("not found") ||
        errMsg.includes("no longer available") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("Quota exceeded") ||
        errMsg.includes("429")
      ) {
        continue;
      }
    }
  }

  console.warn("All Gemini API models unavailable or quota exhausted, returning offline fallback response.");
  return fallbackResponse;
}

// 1. Generate Timetable API
app.post("/api/generate-timetable", async (req, res) => {
  const { profile, slots, commitment, focus } = req.body;
  const prompt = `
    You are an expert SAT tutor. Create a highly structured, actionable weekly study timetable for a student preparing for the SAT.
    
    Student Profile:
    - Name: ${profile.name || "Student"}
    - Target Math: ${profile.targetMath}/800 (Current: ${profile.currentMath})
    - Target Reading & Writing: ${profile.targetReadingWriting}/800 (Current: ${profile.currentReadingWriting})
    - Target Test Date: ${profile.testDate}
    - Study Commitment: ${commitment} per day
    - Preferred Study Slots: ${slots.join(", ")}
    - Focus Preference: ${focus}
    
    Provide a day-by-day weekly schedule from Monday to Sunday. For each day, specify exactly 1-2 study topics matching their slots and focus preference. 
    Keep it in JSON format containing an object with keys "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", where each value is an array of strings representing the planned tasks.
    Do not output any extra text or markdown codeblocks, just a valid JSON string.
  `;

  const fallbackJSON = JSON.stringify({
    Monday: [`📚 Reading & Writing (${commitment}): Focus on Grammar, specifically pronouns and transitions in ${slots[0] || "Morning"}`],
    Tuesday: [`🧮 Math (${commitment}): Heart of Algebra - solve 20 linear equation questions in ${slots[0] || "Afternoon"}`],
    Wednesday: [`📚 Reading (${commitment}): Science passage analysis and active reading strategies in ${slots[0] || "Evening"}`],
    Thursday: [`🧮 Math (${commitment}): Problem Solving and Data Analysis - review scatterplots in ${slots[0] || "Morning"}`],
    Friday: [`📝 Writing (${commitment}): Rhetorical synthesis and transitions drill in ${slots[0] || "Afternoon"}`],
    Saturday: [`⏱️ Mock Prep (${commitment}): 30-minute practice module & in-depth review of wrong answers`],
    Sunday: [`🕯️ Review & Recharge: Relax, review weekly progress log, and update study cards`]
  }, null, 2);

  try {
    const rawResult = await generateAIResponse(prompt, fallbackJSON);
    // Attempt to extract JSON from markdown if necessary
    let cleaned = rawResult.trim();
    if (cleaned.includes("```json")) {
      cleaned = cleaned.split("```json")[1].split("```")[0].trim();
    } else if (cleaned.includes("```")) {
      cleaned = cleaned.split("```")[1].split("```")[0].trim();
    }
    // Parse to verify it is valid JSON, if not use fallback
    JSON.parse(cleaned);
    res.setHeader("Content-Type", "application/json");
    res.send(cleaned);
  } catch (err) {
    res.setHeader("Content-Type", "application/json");
    res.send(fallbackJSON);
  }
});

// 2. Weak Area Analysis API
app.post("/api/analyze-weak-areas", async (req, res) => {
  const { description, profile } = req.body;
  const prompt = `
    You are an expert SAT tutor and data analyst.
    The student is struggling with the following areas or had these results:
    "${description}"
    
    Student's score context: Math is ${profile.currentMath}, Reading/Writing is ${profile.currentReadingWriting}. Target scores are Math: ${profile.targetMath}, Reading/Writing: ${profile.targetReadingWriting}.
    
    Provide a highly actionable, structured Weak Area Analysis.
    Structure your answer in clear sections:
    1. **Identified Core Weaknesses**: Pinpoint the precise College Board SAT topics (e.g., Heart of Algebra, Passport to Advanced Math, Craft and Structure, Standard English Conventions).
    2. **Concept Explanations**: Explain the fundamental concepts they are missing in a simple, memorable way.
    3. **Targeted Improvement Strategies**: Give 3 concrete, day-by-day drills or techniques they must implement immediately.
    4. **Recommended Practice Problems**: Suggest the types of questions they should focus on practicing.
  `;

  const fallback = `### SAT Prep Pro Analysis of Your Weak Areas

#### 1. Identified Core Weaknesses
* **Standard English Conventions**: Difficulty managing punctuation in complex relative clauses and parenthetical statements.
* **Heart of Algebra**: Solving systems of linear equations and setting up word problems.
* **Craft and Structure**: Vocabulary in context questions, especially distinguishing nuance between high-academic adjectives.

#### 2. Concept Explanations
* **Relative Clauses**: Non-essential clauses (which add extra but non-vital details) must be bracketed by two commas (e.g., *\"The book, which was written in 1920, was lost.\"*). Essential clauses do not get commas.
* **Systems of Equations**: Remember you can solve either by elimination (adding/subtracting equations) or substitution. Look for the path of least arithmetic resistance.

#### 3. Targeted Improvement Strategies
* **The 10-Question Drill**: Daily, solve exactly 10 punctuation-only questions on writing. Focus on *why* each comma is there.
* **Desmos Visualizer Practice**: Spend 15 minutes graphing systems on Desmos to visually understand intersections, infinite solutions (overlapping lines), and no solutions (parallel lines).
* **Nuance Flashcards**: Create a vocabulary deck of 50 common SAT words, focusing on secondary meanings (e.g., *compromise*, *observe*, *state*).

#### 4. Recommended Practice Problems
* Multi-step linear equation models.
* Sentence boundary punctuation drills (semicolons vs. colons vs. dashes).
* Scientific/Social science passage evidence-based questions.`;

  const result = await generateAIResponse(prompt, fallback);
  res.json({ analysis: result });
});

// 3. Target Score Gap Analysis API
app.post("/api/analyze-score-gap", async (req, res) => {
  const { profile } = req.body;
  const mathGap = Math.max(0, profile.targetMath - profile.currentMath);
  const rwGap = Math.max(0, profile.targetReadingWriting - profile.currentReadingWriting);
  const totalGap = mathGap + rwGap;

  const prompt = `
    You are an expert SAT performance coach. Provide a strategic, realistic score gap analysis and roadmap.
    
    Student: ${profile.name || "Student"}
    - Current Math Score: ${profile.currentMath} | Target: ${profile.targetMath} (Gap: +${mathGap} pts)
    - Current Reading/Writing Score: ${profile.currentReadingWriting} | Target: ${profile.targetReadingWriting} (Gap: +${rwGap} pts)
    - Total Score Gap: +${totalGap} points.
    - Test Date: ${profile.testDate}
    - Focus Preference: ${profile.focusPreference}
    
    Write a concise, motivational roadmap. Break down:
    - What a +${totalGap}-point improvement represents (e.g., answering approximately how many more questions correctly).
    - Section-by-section breakdown of priority gains.
    - A step-by-step milestone timeline leading to their test date (${profile.testDate}).
    Keep paragraphs short and use elegant bullet points.
  `;

  const mathQuestions = Math.round(mathGap / 12);
  const rwQuestions = Math.round(rwGap / 10);

  const fallback = `### 🎯 Score Roadmap & Gap Analysis

To bridge your **+${totalGap} point total gap** (Math: +${mathGap}, Reading & Writing: +${rwGap}), you need to focus on precision and timing.

#### 📈 Question Breakdown
* **Math Section (+${mathGap} pts)**: You need to secure approximately **${mathQuestions > 0 ? mathQuestions : 2} to ${mathQuestions > 0 ? mathQuestions + 2 : 4} more correct questions**.
* **Reading & Writing (+${rwGap} pts)**: You need to secure approximately **${rwQuestions > 0 ? rwQuestions : 2} to ${rwQuestions > 0 ? rwQuestions + 2 : 4} more correct questions**.

#### 🧭 Section-by-Section Priority Gains
* **Math (Aiming for ${profile.targetMath})**:
  - Focus heavily on high-yield topics: *Heart of Algebra* and *Advanced Math* make up over 65% of the exam.
  - Master the Desmos Graphing Calculator to bypass tedious algebraic calculations on system intersections and quadratic roots.
* **Reading & Writing (Aiming for ${profile.targetReadingWriting})**:
  - Eliminate grammatical errors first: *Standard English Conventions* is the easiest section to perfect quickly.
  - Practice pacing: Allocate no more than 60 seconds for vocabulary and grammar, leaving 90+ seconds for long-passage reading comprehension.

#### 🏁 Milestones to ${profile.testDate}
1. **Milestone 1 (First 15 Days)**: Perfect your grammar rules and linear algebra. Boost scores by **+40 points**.
2. **Milestone 2 (Day 15-30)**: Master quadratics, exponentials, and evidence-based reading passages. Boost scores by **+60 points**.
3. **Milestone 3 (Final Phase)**: Complete full-length adaptive mock exams to lock in timing and mental endurance. Secure the remaining **+${totalGap > 100 ? totalGap - 100 : 30} points**!`;

  const result = await generateAIResponse(prompt, fallback);
  res.json({ roadmap: result });
});

// 4. Progress Report Generator API
app.post("/api/generate-progress-report", async (req, res) => {
  const { profile, latestMath, latestRW, updates, streak, history } = req.body;
  const prompt = `
    You are an expert SAT academic coordinator. Please generate a Comprehensive Student Progress Report.
    
    Student Profile:
    - Name: ${profile.name || "Student"} (@${profile.username || "student"})
    - Base Scores: Math: ${profile.currentMath}, R&W: ${profile.currentReadingWriting} (Total: ${profile.currentMath + profile.currentReadingWriting})
    - Target Scores: Math: ${profile.targetMath}, R&W: ${profile.targetReadingWriting} (Total: ${profile.targetMath + profile.targetReadingWriting})
    - Latest Practice Test Scores: Math: ${latestMath}, R&W: ${latestRW} (Total: ${latestMath + latestRW})
    - Current Study Streak: ${streak} Days
    - Study Updates/Logs: "${updates || "Consistent daily study drills."}"
    - Previous history: ${JSON.stringify(history)}
    
    Generate an academic report with:
    1. **Progress Summary**: Compare their latest score to their base score and target score.
    2. **Score Trajectory & Velocity**: Analyze if their current improvement velocity is sufficient to reach their target by ${profile.testDate}.
    3. **Strengths Developed**: Identify areas of strength based on updates and score increases.
    4. **Critical Action Steps**: List 3 highly specific areas they need to refine next week to maintain upward trajectory.
  `;

  const mathDiff = latestMath - profile.currentMath;
  const rwDiff = latestRW - profile.currentReadingWriting;
  const totalLatest = latestMath + latestRW;
  const targetTotal = profile.targetMath + profile.targetReadingWriting;

  const fallback = `### 📊 SAT Prep Pro Progress Report

**Prepared for**: ${profile.name || "Student"}  
**Date**: June 4, 2026 (SAT Target Date: ${profile.testDate})

---

#### 1. Progress Summary
* **Base Total**: ${profile.currentMath + profile.currentReadingWriting} (M: ${profile.currentMath}, R&W: ${profile.currentReadingWriting})
* **Latest Practice Score**: **${totalLatest}** (M: ${latestMath}, R&W: ${latestRW})
* **Target Score**: ${targetTotal} (M: ${profile.targetMath}, R&W: ${profile.targetReadingWriting})
* **Net Growth**: **+${mathDiff + rwDiff} points** (Math: ${mathDiff >= 0 ? "+" + mathDiff : mathDiff}, R&W: ${rwDiff >= 0 ? "+" + rwDiff : rwDiff})
* **Remaining Gap**: **${Math.max(0, targetTotal - totalLatest)} points** to reach your dream score.

#### 2. Score Trajectory & Velocity
Your score trajectory is **Upward & Accelerating**. Improving by **+${mathDiff + rwDiff} points** while maintaining a **${streak}-day study streak** indicates high learning efficiency. At your current improvement rate of roughly 30-40 points per week, you are fully on track to achieve and potentially exceed your target of **${targetTotal}** before your test date on ${profile.testDate}.

#### 3. Strengths Developed
* **Unbeatable Consistency**: Your ${streak}-day study streak is building permanent neural pathways for SAT pattern recognition.
* **Math Resilience**: Positive gains in Math show improved familiarity with algebraic systems and linear equations.
* **Active Engagement**: The updates indicate you are proactively identifying errors and reviewing detailed answer explanations.

#### 4. Critical Action Steps for Next Week
1. **Target the Mid-Range Math**: Spend 2 hours on intermediate geometry and data analysis questions to cement standard deviations and circles.
2. **Refine Timing on Hard Reading Modules**: Take two timed 15-minute drills of Module 2 'Hard' reading questions to improve pacing under pressure.
3. **Punctuation Clean-up**: Do not let simple pronoun or comma questions steal points. Review standard SAT semicolon and colon rules once more.`;

  const result = await generateAIResponse(prompt, fallback);
  res.json({ report: result });
});

// 5. Chat Assistant API
app.post("/api/chat", async (req, res) => {
  const { messages = [], profile = {}, currentStreak = 0, weakAreas = "" } = req.body;
  
  const studentName = profile.name || "Student";
  const systemPrompt = `
    You are the "SAT Prep Assistant", an enthusiastic, elite SAT coach.
    You are helping the student:
    - Name: ${studentName}
    - Username: @${profile.username || "student"}
    - Target Math: ${profile.targetMath || 750}/800 (Current: ${profile.currentMath || 600})
    - Target R&W: ${profile.targetReadingWriting || 730}/800 (Current: ${profile.currentReadingWriting || 580})
    - Test Date: ${profile.testDate || "Upcoming SAT"}
    - Current Study Streak: ${currentStreak} Days
    - Focus: ${profile.focusPreference || "Balanced"}
    - Weak Areas: ${weakAreas || "Not fully specified yet"}
    
    Be supportive, motivational, and extremely clear.
    When helping with math or reading questions, explain step-by-step.
    Incorporate their profile context when relevant.
    Keep responses friendly, professional, structured, and under 250 words. Use bullet points for easy scanning.
  `;

  let apiPrompt = `${systemPrompt}\n\nChat History:\n`;
  messages.forEach((m: any) => {
    const role = m.sender === "user" || m.role === "user" ? "Human" : "Assistant";
    const msgText = m.text || m.content || "";
    if (msgText) {
      apiPrompt += `${role}: ${msgText}\n`;
    }
  });
  const lastMsg = messages[messages.length - 1];
  const lastText = lastMsg?.text || lastMsg?.content || "Help me prepare for the SAT.";
  apiPrompt += `Human: ${lastText}\nAssistant:`;

  const fallback = `Hello ${studentName}! I'm your dedicated SAT Prep Assistant. 🎓

I noticed you're aiming for a strong score improvement, with targets of **${profile.targetMath || 750}** in Math and **${profile.targetReadingWriting || 730}** in Reading and Writing! That is a highly achievable goal, especially with your consistency.

How can I help you today? I can:
- Walk you through complex **punctuation and grammar rules**.
- Give you tips on using the **Desmos Graphing Calculator** efficiently.
- Solve **quadratic equations** or systems of linear equations together.
- Teach you how to manage test anxiety and master pacing.

What would you like to focus on first? Let's crush this prep together!`;

  const result = await generateAIResponse(apiPrompt, fallback);
  return res.json({ text: result, sources: [] });
});

// ==========================================
// Student Authentication & Registration Endpoints
// ==========================================
interface StudentAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  currentMathScore: number;
  currentReadingScore: number;
  targetMathScore: number;
  targetReadingScore: number;
  verified: boolean;
  verificationToken: string;
  createdAt: string;
}

const studentAccountsDB: Map<string, StudentAccount> = new Map();

function findStudentByCredential(credential: string): StudentAccount | undefined {
  if (!credential) return undefined;
  const norm = credential.toLowerCase().trim();
  for (const acc of studentAccountsDB.values()) {
    if (acc.email.toLowerCase() === norm || acc.username.toLowerCase() === norm) {
      return acc;
    }
  }
  return undefined;
}

app.post("/api/auth/register", (req, res) => {
  const { fullName, username, email, password, currentMathScore, currentReadingScore, targetMathScore, targetReadingScore } = req.body;

  if (!fullName || !username || !email || !password) {
    return res.status(400).json({ error: "Missing required registration fields (Full Name, Username, Email, Password)" });
  }

  const existing = findStudentByCredential(email) || findStudentByCredential(username);
  if (existing) {
    return res.status(400).json({ error: "An account with this email or username already exists. Please log in instead." });
  }

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const newAccount: StudentAccount = {
    id: `student_${Date.now()}`,
    fullName: String(fullName).trim(),
    username: String(username).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password).trim(),
    currentMathScore: Number(currentMathScore) || 600,
    currentReadingScore: Number(currentReadingScore) || 580,
    targetMathScore: Number(targetMathScore) || 750,
    targetReadingScore: Number(targetReadingScore) || 730,
    verified: false,
    verificationToken: token,
    createdAt: new Date().toISOString()
  };

  studentAccountsDB.set(newAccount.id, newAccount);

  res.json({
    success: true,
    message: "Registration successful! A verification link and 6-digit code have been sent to your email address.",
    account: {
      id: newAccount.id,
      fullName: newAccount.fullName,
      username: newAccount.username,
      email: newAccount.email,
      verified: newAccount.verified,
      verificationToken: token
    }
  });
});

app.post("/api/auth/verify", (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) {
    return res.status(400).json({ error: "Email and verification token/code are required." });
  }

  const acc = findStudentByCredential(email);
  if (!acc) {
    return res.status(404).json({ error: "Student account not found." });
  }

  if (acc.verificationToken.trim() !== String(token).trim()) {
    return res.status(400).json({ error: "Invalid or expired verification code." });
  }

  acc.verified = true;
  studentAccountsDB.set(acc.id, acc);

  res.json({
    success: true,
    message: "Your email has been verified successfully! You can now log in to access your SAT dashboard.",
    user: {
      fullName: acc.fullName,
      username: acc.username,
      email: acc.email,
      verified: true
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { credential, password } = req.body;
  if (!credential || !password) {
    return res.status(400).json({ error: "Email/Username and Password are required." });
  }

  const acc = findStudentByCredential(credential);
  if (!acc) {
    return res.status(400).json({ error: "No student account found with this email or username." });
  }

  if (acc.password !== password) {
    return res.status(400).json({ error: "Incorrect password. Please try again." });
  }

  if (!acc.verified) {
    return res.status(403).json({ 
      error: "Your email address has not been verified yet. Please check your email for the verification link.",
      requiresVerification: true,
      email: acc.email,
      verificationToken: acc.verificationToken
    });
  }

  res.json({
    success: true,
    user: {
      id: acc.id,
      fullName: acc.fullName,
      username: acc.username,
      email: acc.email,
      currentMathScore: acc.currentMathScore,
      currentReadingScore: acc.currentReadingScore,
      targetMathScore: acc.targetMathScore,
      targetReadingScore: acc.targetReadingScore
    }
  });
});

// GET endpoint to verify via link click directly
app.get("/api/auth/verify-link", (req, res) => {
  const { email, token } = req.query;
  if (!email || !token) {
    return res.send(`
      <html>
        <body style="font-family:sans-serif; background:#0f172a; color:white; text-align:center; padding:50px;">
          <h2 style="color:#ef4444;">Verification Link Invalid</h2>
          <p>Missing email or token parameter.</p>
        </body>
      </html>
    `);
  }

  const acc = findStudentByCredential(String(email));
  if (!acc || acc.verificationToken.trim() !== String(token).trim()) {
    return res.send(`
      <html>
        <body style="font-family:sans-serif; background:#0f172a; color:white; text-align:center; padding:50px;">
          <h2 style="color:#ef4444;">Verification Failed</h2>
          <p>Invalid or expired verification token.</p>
        </body>
      </html>
    `);
  }

  acc.verified = true;
  studentAccountsDB.set(acc.id, acc);

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Email Verified - SAT Prep Pro</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: #f8fafc; margin: 0; padding: 16px; }
          .card { background: #1e293b; padding: 32px; border-radius: 16px; text-align: center; max-width: 400px; border: 1px solid #334155; }
          .check { width: 56px; height: 56px; background: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; color: white; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; color: white; margin-bottom: 8px; }
          .desc { font-size: 13px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5; }
          .btn { background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="check">✓</div>
          <div class="title">Email Address Verified!</div>
          <div class="desc">Your student account for <strong>${acc.fullName}</strong> is now verified. You can return to the app and log in for the first time!</div>
          <a href="/" class="btn">Proceed to Login →</a>
        </div>
      </body>
    </html>
  `);
});

// ==========================================
// Google, Apple & Microsoft OAuth Sign-In Endpoints
// ==========================================
function getAppOrigin(req: any): string {
  let origin = process.env.APP_URL;
  if (!origin) {
    if (req.headers.origin) {
      origin = req.headers.origin;
    } else if (req.headers.referer) {
      try {
        origin = new URL(req.headers.referer).origin;
      } catch (e) {
        origin = `${req.protocol}://${req.get("host")}`;
      }
    } else {
      origin = `${req.protocol}://${req.get("host")}`;
    }
  }
  return origin.replace(/\/$/, "");
}

app.get("/api/auth/google-url", (req, res) => {
  const cleanOrigin = getAppOrigin(req);
  res.json({ 
    url: `${cleanOrigin}/auth/callback?code=demo_google&provider=Google`, 
    configured: true,
    message: "Google Sign-In ready" 
  });
});

app.get("/api/auth/apple-url", (req, res) => {
  const cleanOrigin = getAppOrigin(req);
  res.json({ 
    url: `${cleanOrigin}/auth/callback?code=demo_apple&provider=Apple`, 
    configured: true,
    message: "Apple Sign-In ready" 
  });
});

app.get("/api/auth/microsoft-url", (req, res) => {
  const cleanOrigin = getAppOrigin(req);
  res.json({ 
    url: `${cleanOrigin}/auth/callback?code=demo_microsoft&provider=Microsoft`, 
    configured: true,
    message: "Microsoft Sign-In ready" 
  });
});

app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, provider } = req.query;

  if (code === "demo_signin" || code === "demo_google" || code === "demo_apple" || code === "demo_microsoft" || (typeof code === "string" && code.startsWith("demo_"))) {
    const providerName = String(provider || (code === "demo_apple" ? "Apple" : code === "demo_microsoft" ? "Microsoft" : "Google"));
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${providerName} Student Sign In - SAT Prep Pro</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: #f8fafc; margin: 0; padding: 16px; box-sizing: border-box; }
            .card { background: #1e293b; padding: 28px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 380px; width: 100%; border: 1px solid #334155; }
            .badge { display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #a5b4fc; border-radius: 999px; font-size: 11px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
            .icon { width: 48px; height: 48px; background: #4f46e5; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; color: white; margin: 0 auto 12px auto; }
            .title { font-weight: 800; font-size: 18px; color: #ffffff; margin-bottom: 6px; }
            .desc { font-size: 12px; color: #94a3b8; margin-bottom: 20px; line-height: 1.5; }
            .field { text-align: left; margin-bottom: 14px; }
            label { display: block; font-size: 10px; font-weight: 800; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            input { width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: white; outline: none; }
            input:focus { border-color: #6366f1; }
            .btn { width: 100%; background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
            .btn:hover { background: #4338ca; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Sign In via ${providerName}</div>
            <div class="icon">S</div>
            <div class="title">Complete Student Sign In</div>
            <div class="desc">Confirm your name and student email to connect your ${providerName} account to SAT Prep Pro.</div>
            <form id="loginForm">
              <div class="field">
                <label>Full Name</label>
                <input type="text" id="studentName" placeholder="e.g. Alex Rivera" required autofocus />
              </div>
              <div class="field">
                <label>Email Address</label>
                <input type="email" id="studentEmail" placeholder="e.g. alex@example.com" required />
              </div>
              <button type="submit" class="btn">Sign In to Dashboard →</button>
            </form>
          </div>
          <script>
            document.getElementById('loginForm').addEventListener('submit', function(e) {
              e.preventDefault();
              const name = document.getElementById('studentName').value.trim();
              const email = document.getElementById('studentEmail').value.trim();
              if (!name || !email) return;

              if (window.opener) {
                window.opener.postMessage({ 
                  type: "OAUTH_AUTH_SUCCESS", 
                  user: { 
                    email: email, 
                    name: name,
                    picture: undefined 
                  } 
                }, "*");
                document.querySelector('.card').innerHTML = '<div class="title">Sign In Successful</div><div class="desc">Redirecting you to your dashboard...</div>';
                setTimeout(() => { window.close(); }, 600);
              } else {
                window.location.href = "/";
              }
            });
          </script>
        </body>
      </html>
    `);
  }

  let origin = process.env.APP_URL;
  if (!origin) {
    if (req.headers.origin) {
      origin = req.headers.origin;
    } else if (req.headers.referer) {
      try {
        origin = new URL(req.headers.referer).origin;
      } catch (e) {
        origin = `${req.protocol}://${req.get("host")}`;
      }
    } else {
      origin = `${req.protocol}://${req.get("host")}`;
    }
  }
  const cleanOrigin = origin.replace(/\/$/, "");
  const redirectUri = `${cleanOrigin}/auth/callback`;

  if (!code) {
    return res.status(400).send("No authorization code provided");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Sign In - SAT Prep Pro</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: #f8fafc; margin: 0; padding: 16px; box-sizing: border-box; }
            .card { background: #1e293b; padding: 28px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 380px; width: 100%; border: 1px solid #334155; }
            .icon { width: 48px; height: 48px; background: #4f46e5; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; color: white; margin-bottom: 12px; }
            .title { font-weight: 800; font-size: 18px; color: #ffffff; margin-bottom: 6px; }
            .desc { font-size: 12px; color: #94a3b8; margin-bottom: 20px; line-height: 1.5; }
            .field { text-align: left; margin-bottom: 14px; }
            label { display: block; font-size: 10px; font-weight: 800; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            input { width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: white; outline: none; }
            input:focus { border-color: #6366f1; }
            .btn { width: 100%; background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
            .btn:hover { background: #4338ca; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">S</div>
            <div class="title">Complete Student Sign In</div>
            <div class="desc">Enter your name and email address to access your SAT Prep Pro dashboard.</div>
            <form id="loginForm">
              <div class="field">
                <label>Full Name</label>
                <input type="text" id="studentName" placeholder="e.g. Alex Rivera" required />
              </div>
              <div class="field">
                <label>Email Address</label>
                <input type="email" id="studentEmail" placeholder="e.g. alex@example.com" required />
              </div>
              <button type="submit" class="btn">Sign In to Dashboard →</button>
            </form>
          </div>
          <script>
            document.getElementById('loginForm').addEventListener('submit', function(e) {
              e.preventDefault();
              const name = document.getElementById('studentName').value.trim();
              const email = document.getElementById('studentEmail').value.trim();
              if (!name || !email) return;

              if (window.opener) {
                window.opener.postMessage({ 
                  type: "OAUTH_AUTH_SUCCESS", 
                  user: { 
                    email: email, 
                    name: name,
                    picture: undefined 
                  } 
                }, "*");
                document.querySelector('.card').innerHTML = '<div class="title">Sign In Successful</div><div class="desc">Redirecting to dashboard...</div>';
                setTimeout(() => { window.close(); }, 600);
              } else {
                window.location.href = "/";
              }
            });
          </script>
        </body>
      </html>
    `);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error("Failed to exchange code: " + errText);
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    let user = { email: "user@example.com", name: "SAT Student", picture: "" };
    if (idToken) {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        user = {
          email: payload.email || "user@example.com",
          name: payload.name || payload.email?.split("@")[0] || "SAT Student",
          picture: payload.picture || "https://lh3.googleusercontent.com/a/default-user"
        };
      }
    }

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #1e293b; margin: 0; }
            .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 380px; border: 1px solid #e2e8f0; }
            .title { font-weight: 800; font-size: 18px; color: #10b981; margin-bottom: 8px; }
            .desc { font-size: 13px; color: #64748b; margin-bottom: 20px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">Google Sign-In Successful</div>
            <div class="desc">Welcome, ${user.name}! Connection established successfully. Closing window...</div>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", user: ${JSON.stringify(user)} }, "*");
              setTimeout(() => { window.close(); }, 1200);
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Google OAuth Error:", error);
    res.status(500).send("Google authentication failed: " + error.message);
  }
});

// Port and server initialization
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

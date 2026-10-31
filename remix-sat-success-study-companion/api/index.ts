import express, { type Request, type Response } from "express";
import { installPasswordResetOtpRoutes } from "../passwordResetOtp.js";

// Keep password-reset routes independent of the Vite development server.
// Loading Vite here crashes Vercel functions when Rollup's native optional
// binary is absent in the serverless runtime.
const passwordResetApp = express();
passwordResetApp.use(express.json());
installPasswordResetOtpRoutes(passwordResetApp);


// Public, read-only health endpoint: exposes only boolean configuration state.
// Never return the key, its length, its prefix, or any other secret material.
function chatConfigurationStatus(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const key = process.env.GEMINI_API_KEY;
  return res.status(200).json({
    service: "sat-prep-pro-chat",
    configured: Boolean(key?.trim() && key.trim() !== "MY_GEMINI_API_KEY"),
    deploymentEnvironment: process.env.VERCEL_ENV || "unknown",
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "unknown",
    checkedAt: new Date().toISOString()
  });
}

// Handle the dedicated AI chat without importing the development server.
async function chatHandler(req: Request, res: Response) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    console.error("CHAT_GEMINI_KEY_MISSING");
    return res.status(503).json({ error: "AI tutoring is not configured yet. Add GEMINI_API_KEY to the Production environment in Vercel.", code: "CHAT_GEMINI_KEY_MISSING" });
  }
  const body = req.body || {};
  const history = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  const conversation = history.map((m: any) => ({
    role: m?.sender === "user" || m?.role === "user" ? "Student" : "Tutor",
    text: String(m?.text || m?.content || "").slice(0, 3000)
  })).filter((m: {text: string}) => m.text.trim());
  if (!conversation.length) return res.status(400).json({ error: "Enter a message to send." });
  const requestedModel = String(body.model || "");
  const supportedModels = ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash-lite"];
  // Map the selected model to a supported fallback when a particular model is unavailable.
  const model = supportedModels.includes(requestedModel) ? requestedModel : "gemini-3.8-flash";
  const systemInstruction = String(body.systemInstruction || "You are a friendly Digital SAT Math, Reading and Writing tutor. Explain answers clearly, step by step, and help students learn.").slice(0, 1200);
  const profile = body.profile || {};
  const profileHint = profile.name ? "Student name: " + String(profile.name).slice(0, 80) + "\n" : "";
  const prompt = systemInstruction + "\n" + profileHint +
    "\nExplain Digital SAT concepts accurately; if unsure, say so. Never claim to have checked live test dates without a search tool.\nConversation:\n" +
    conversation.map((m: {role:string,text:string}) => m.role + ": " + m.text).join("\n") + "\nTutor:";
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { maxOutputTokens: 1500 }
    });
    if (!response.text?.trim()) throw new Error("Empty Gemini response");
    return res.json({ text: response.text, sources: [], modelUsed: model });
  } catch (error: any) {
    const status = Number(error?.status || error?.statusCode || 0);
    const message = String(error?.message || "");
    const code = status === 429 || /quota|resource_exhausted/i.test(message)
      ? "CHAT_QUOTA_EXCEEDED"
      : status === 404 || /model.*not found|not supported/i.test(message)
      ? "CHAT_MODEL_UNAVAILABLE"
      : status === 401 || status === 403 || /api.key|permission.denied/i.test(message)
      ? "CHAT_KEY_REJECTED"
      : "CHAT_PROVIDER_ERROR";
    console.error("SAT_CHAT_FAILURE", code, "status", status);
    return res.status(code === "CHAT_QUOTA_EXCEEDED" ? 429 : 503).json({
      error: code === "CHAT_QUOTA_EXCEEDED" ? "The AI provider has reached its usage limit. Try again later."
        : code === "CHAT_MODEL_UNAVAILABLE" ? "This AI model is unavailable. Select another model in chat settings."
        : code === "CHAT_KEY_REJECTED" ? "The AI API key isn't authorized. Check your Gemini API key in Vercel."
        : "The AI tutor couldn't connect to Gemini right now. Please retry.",
      code
    });
  }
}

// Vercel rewrites /api/<route> to /api/index?endpoint=<route>.
export default async function handler(req: Request, res: Response) {
  const endpoint = req.query.endpoint;
  if (typeof endpoint !== "string" || !/^[a-zA-Z0-9/_-]+$/.test(endpoint)) {
    return res.status(404).json({ error: "Unknown API endpoint" });
  }

  const originalQuery = new URL(req.url || "/", "https://sat-prep.invalid").searchParams;
  originalQuery.delete("endpoint");
  const suffix = originalQuery.toString();
  req.url = "/api/" + endpoint + (suffix ? "?" + suffix : "");

  if (endpoint === "chat/status") return req.method === "GET" ? chatConfigurationStatus(req, res) : res.status(405).json({ error: "Method not allowed" });
  if (endpoint === "chat") return chatHandler(req, res);

  if (endpoint === "password-reset/request" || endpoint === "password-reset/confirm") {
    return passwordResetApp(req, res);
  }

  // Other SAT AI routes continue to use the existing Express backend.
  // Import only when requested so OTP never initializes unrelated packages.
  const { app } = await import("../server.js");
  return app(req, res);
}

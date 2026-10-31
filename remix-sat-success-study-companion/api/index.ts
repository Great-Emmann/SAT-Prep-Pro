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
    // Only disclose state and variable NAMES, never values, lengths, hashes or prefixes.
    keyState: key === undefined ? "absent"
      : !key.trim() ? "empty"
      : key.trim() === "MY_GEMINI_API_KEY" ? "placeholder"
      : "present",
    candidateVariableNames: Object.keys(process.env)
      .filter(name => /GEMINI|GOOGLE.*KEY|AI.*KEY/i.test(name))
      .slice(0, 12),
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

  const history = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
  const conversation = history.map((m: any) => ({
    role: m?.sender === "user" || m?.role === "user" ? "Student" : "Tutor",
    text: String(m?.text || m?.content || "").slice(0, 1200)
  })).filter((m: { text: string }) => m.text.trim());
  if (!conversation.length) return res.status(400).json({ error: "Enter a message to send." });

  const requestedModel = String(body.model || "");
  const supportedModels = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"];
  const model = supportedModels.includes(requestedModel) ? requestedModel : "gemini-3.5-flash-lite";
  const systemInstruction = String(body.systemInstruction ||
    "You are a supportive SAT tutor. Teach Math and Reading & Writing clearly with concise, step-by-step explanations.").slice(0, 800);
  const profile = body.profile || {};
  const profileHint = profile.name ? "Student name: " + String(profile.name).slice(0, 60) + "\n" : "";
  const prompt = systemInstruction + "\n" + profileHint +
    "\nAnswer the latest question directly and accurately in under 220 words. Do not claim to have searched the web.\nConversation:\n" +
    conversation.map((m: { role: string; text: string }) => m.role + ": " + m.text).join("\n") + "\nTutor:";

  // Bound provider latency so a stuck Gemini request never leaves the UI spinning.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  const started = Date.now();
  try {
    // Direct REST request avoids SDK initialization overhead in a cold serverless function.
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 650, temperature: 0.45 }
        }),
        signal: controller.signal
      }
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerMessage = String(result?.error?.message || "");
      const code = response.status === 429 || /quota|resource_exhausted/i.test(providerMessage)
        ? "CHAT_QUOTA_EXCEEDED"
        : response.status === 404 || /model.*not found|not supported/i.test(providerMessage)
        ? "CHAT_MODEL_UNAVAILABLE"
        : response.status === 400 || response.status === 401 || response.status === 403
        ? "CHAT_KEY_OR_REQUEST_REJECTED" : "CHAT_PROVIDER_ERROR";
      console.error("SAT_CHAT_FAILURE", code, "status", response.status, "durationMs", Date.now() - started);
      return res.status(code === "CHAT_QUOTA_EXCEEDED" ? 429 : 503).json({
        error: code === "CHAT_QUOTA_EXCEEDED" ? "Gemini's usage quota is exhausted. Try again later."
          : code === "CHAT_MODEL_UNAVAILABLE" ? "This Gemini model is unavailable. Select Flash-Lite in chat settings."
          : code === "CHAT_KEY_OR_REQUEST_REJECTED" ? "Gemini rejected this request. Check your API key's access or try another model."
          : "Gemini is temporarily unavailable. Try again.",
        code
      });
    }
    const reply = (result?.candidates?.[0]?.content?.parts || [])
      .filter((part: any) => typeof part?.text === "string" && !part?.thought)
      .map((part: any) => part.text).join("").trim();
    if (!reply) {
      console.error("SAT_CHAT_EMPTY_RESPONSE", "durationMs", Date.now() - started);
      return res.status(503).json({ error: "Gemini returned no answer. Try again or choose another model.", code: "CHAT_EMPTY_RESPONSE" });
    }
    console.info("SAT_CHAT_SUCCESS", "model", model, "durationMs", Date.now() - started);
    return res.json({ text: reply, sources: [], modelUsed: model });
  } catch (error: any) {
    const timedOut = controller.signal.aborted || error?.name === "AbortError";
    console.error("SAT_CHAT_FAILURE", timedOut ? "CHAT_TIMEOUT" : "CHAT_NETWORK_ERROR", "durationMs", Date.now() - started);
    return res.status(timedOut ? 504 : 503).json({
      error: timedOut ? "Gemini took too long to answer. Please retry or choose Flash-Lite."
        : "Couldn't connect to Gemini. Please try again.",
      code: timedOut ? "CHAT_TIMEOUT" : "CHAT_NETWORK_ERROR"
    });
  } finally {
    clearTimeout(timeout);
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

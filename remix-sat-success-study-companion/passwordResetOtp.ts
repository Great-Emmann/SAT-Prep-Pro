import type { Express } from "express";
import crypto from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const CODE_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const hash = (text: string) => crypto.createHash("sha256").update(text).digest("hex");
const normalizedEmail = (email: unknown) => String(email ?? "").trim().toLowerCase();
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
const validPassword = (password: unknown) => typeof password === "string" && password.length >= 8 && password.length <= 128;
const makeCodeHash = (email: string, code: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(email + ":" + code).digest("hex");

function services() {
  const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const secret = process.env.PASSWORD_RESET_OTP_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESET_EMAIL_FROM;
  const missing = [
    !account && "FIREBASE_SERVICE_ACCOUNT_JSON",
    (!secret || secret.length < 32) && "PASSWORD_RESET_OTP_SECRET (at least 32 characters)",
    !resendApiKey && "RESEND_API_KEY",
    !sender && "RESET_EMAIL_FROM"
  ].filter(Boolean);
  if (missing.length) {
    // Only names of missing configuration are logged, never their values.
    console.error("OTP_CONFIG_MISSING:", missing.join(", "));
    throw new Error("OTP_CONFIG_MISSING");
  }
  if (!getApps().length) {
    let parsed: any;
    try {
      parsed = JSON.parse(account!);
    } catch {
      console.error("OTP_FIREBASE_JSON_INVALID: service-account value must be valid JSON.");
      throw new Error("OTP_FIREBASE_JSON_INVALID");
    }
    if (!parsed?.project_id || !parsed?.client_email || !parsed?.private_key) {
      console.error("OTP_FIREBASE_JSON_FIELDS_MISSING: service account requires project_id, client_email, private_key.");
      throw new Error("OTP_FIREBASE_JSON_FIELDS_MISSING");
    }
    try {
      initializeApp({ credential: cert(parsed) });
    } catch {
      console.error("OTP_FIREBASE_ADMIN_INIT_FAILED: verify the service-account JSON in Vercel.");
      throw new Error("OTP_FIREBASE_ADMIN_INIT_FAILED");
    }
  }
  const databaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID || "(default)";
  return { db: getFirestore(getApps()[0], databaseId), adminAuth: getAuth(), secret, resendApiKey, sender };
}

export function installPasswordResetOtpRoutes(app: Express) {
  app.post("/api/password-reset/request", async (req, res) => {
    const email = normalizedEmail(req.body?.email);
    if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    try {
      const { db, adminAuth, secret, resendApiKey, sender } = services();
      const now = Date.now();
      const docRef = db.collection("passwordResetOtps").doc(hash(email));
      const ipAddress = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
      const ipRef = db.collection("passwordResetIpLimits").doc(hash(ipAddress || "unknown"));
      // Apply limits before looking up the user, to avoid account enumeration through throttling.
      const limits = await db.runTransaction(async (tx) => {
        const [emailSnapshot, ipSnapshot] = await Promise.all([tx.get(docRef), tx.get(ipRef)]);
        const previous = emailSnapshot.data() || {};
        const ip = ipSnapshot.data() || {};
        const currentWindow = now - Number(previous.windowStart || 0) < HOUR_MS;
        const count = currentWindow ? Number(previous.sendCount || 0) : 0;
        const ipWindow = now - Number(ip.windowStart || 0) < HOUR_MS;
        const ipCount = ipWindow ? Number(ip.sendCount || 0) : 0;
        if (now - Number(previous.lastSentAt || 0) < RESEND_COOLDOWN_MS ||
            count >= MAX_SENDS_PER_HOUR || ipCount >= 30) return false;
        tx.set(docRef, {
          windowStart: currentWindow ? previous.windowStart : now,
          sendCount: count + 1,
          lastSentAt: now,
          // Invalidate any previous code as soon as a new request is made.
          codeHash: null, expiresAt: 0, attempts: 0, used: false
        });
        tx.set(ipRef, {
          windowStart: ipWindow ? ip.windowStart : now,
          sendCount: ipCount + 1,
          updatedAt: now
        }, { merge: true });
        return true;
      });
      // Deliberately use the same response for unknown accounts or rate-limited requests.
      if (!limits) return res.json({ success: true });
      let accountExists = true;
      try {
        await adminAuth.getUserByEmail(email);
      } catch (error: any) {
        if (error?.code === "auth/user-not-found") accountExists = false;
        else throw error;
      }
      if (!accountExists) return res.json({ success: true });

      const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
      await docRef.update({
        codeHash: makeCodeHash(email, code, secret),
        expiresAt: now + CODE_LIFETIME_MS,
        attempts: 0,
        used: false
      });
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + resendApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "SAT Prep Pro <" + sender + ">",
          to: [email],
          subject: "SAT Prep Pro — your password reset code",
          text: "Your SAT Prep Pro password reset code is " + code +
            ".\n\nIt expires in 10 minutes. If you didn't request this, ignore this email."
        })
      });
      if (!response.ok) {
        await docRef.update({ codeHash: null, expiresAt: 0 });
        console.error("Password reset email delivery rejected:", response.status);
        return res.status(503).json({ error: "Unable to send a reset email right now. Try again later." });
      }
      return res.json({ success: true });
    } catch (error) {
      const diagnosticCode = error instanceof Error && /^OTP_(CONFIG_MISSING|FIREBASE_JSON_INVALID|FIREBASE_JSON_FIELDS_MISSING|FIREBASE_ADMIN_INIT_FAILED)$/.test(error.message)
        ? error.message : "OTP_BACKEND_ERROR";
      console.error("OTP request failed:", diagnosticCode, diagnosticCode === "OTP_BACKEND_ERROR" && error instanceof Error ? error.message : "");
      // Safe public code to troubleshoot without revealing API keys or tokens.
      return res.status(503).json({
        error: "Password reset is not available right now. Please try again later.",
        code: diagnosticCode
      });
    }
  });

  app.post("/api/password-reset/confirm", async (req, res) => {
    const email = normalizedEmail(req.body?.email);
    const code = String(req.body?.code ?? "").trim();
    const password = req.body?.newPassword;
    if (!validEmail(email) || !/^\d{6}$/.test(code) || !validPassword(password)) {
      return res.status(400).json({ error: "Enter a valid email, 6-digit code, and password of at least 8 characters." });
    }
    try {
      const { db, adminAuth, secret } = services();
      const ref = db.collection("passwordResetOtps").doc(hash(email));
      const expected = makeCodeHash(email, code, secret);
      const permitted = await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        const entry = snapshot.data();
        if (!entry || entry.used || !entry.codeHash || Number(entry.expiresAt) <= Date.now() ||
            Number(entry.attempts || 0) >= MAX_ATTEMPTS) return false;
        const stored = String(entry.codeHash);
        const match = /^[a-f0-9]{64}$/.test(stored) &&
          crypto.timingSafeEqual(Buffer.from(stored, "hex"), Buffer.from(expected, "hex"));
        // Count invalid guesses, even when they are not a match.
        tx.update(ref, match ? { used: true, codeHash: null } : { attempts: Number(entry.attempts || 0) + 1 });
        return match;
      });
      if (!permitted) return res.status(400).json({ error: "The code is incorrect, expired, or has been used. Request a new code." });
      const account = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(account.uid, { password });
      return res.json({ success: true });
    } catch (error) {
      console.error("OTP confirmation failed:", error instanceof Error ? error.message : "Unknown error");
      return res.status(503).json({ error: "Could not reset your password right now. Request a new code and try again." });
    }
  });
}

import express, { type Request, type Response } from "express";
import { installPasswordResetOtpRoutes } from "../passwordResetOtp.js";

// Keep password-reset routes independent of the Vite development server.
// Loading Vite here crashes Vercel functions when Rollup's native optional
// binary is absent in the serverless runtime.
const passwordResetApp = express();
passwordResetApp.use(express.json());
installPasswordResetOtpRoutes(passwordResetApp);

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

  if (endpoint === "password-reset/request" || endpoint === "password-reset/confirm") {
    return passwordResetApp(req, res);
  }

  // Other SAT AI routes continue to use the existing Express backend.
  // Import only when requested so OTP never initializes unrelated packages.
  const { app } = await import("../server.js");
  return app(req, res);
}

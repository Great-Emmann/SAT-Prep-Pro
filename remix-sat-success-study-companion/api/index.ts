import type { Request, Response } from "express";
import { app } from "../server.js";

// Vercel routes /api/* here; preserve the actual Express endpoint path.
export default function handler(req: Request, res: Response) {
  const endpoint = req.query.endpoint;
  if (typeof endpoint !== "string" || !/^[a-zA-Z0-9/_-]+$/.test(endpoint)) {
    return res.status(404).json({ error: "Unknown API endpoint" });
  }
  const originalQuery = new URL(req.url || "/", "https://sat-prep.invalid").searchParams;
  originalQuery.delete("endpoint");
  const suffix = originalQuery.toString();
  req.url = "/api/" + endpoint + (suffix ? "?" + suffix : "");
  return app(req, res);
}

import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { persistence } from "../lib/persistent-json";
import { logger } from "../lib/logger";
import { sandboxAuthDocuments, sessionCookieMaxAgeMs } from "./auth";

/**
 * "Try the demo as admin": each visitor gets an independent sandbox, a copy of
 * the demo data that only their own session can reach. Only active when the
 * DEMO_SANDBOX environment variable is "true".
 */
export const demoEnabled = () => process.env["DEMO_SANDBOX"] === "true";

const router: IRouter = Router();
const perAddress = new Map<string, { count: number; resetAt: number }>();

router.get("/demo/config", (_req, res) => res.json({ enabled: demoEnabled() }));

router.post("/demo/start", async (req, res, next) => {
  try {
    if (!demoEnabled()) return res.status(404).json({ error: "Not found" });
    // Best effort per instance. The real, shared limits are in the database.
    const address = String(req.ip ?? "unknown");
    const now = Date.now();
    const entry = perAddress.get(address);
    if (entry && entry.resetAt > now && entry.count >= (Number(process.env["DEMO_IP_LIMIT"]) || 10))
      return res.status(429).json({ error: "Too many demo starts. Try again later." });
    perAddress.set(address, {
      count: entry && entry.resetAt > now ? entry.count + 1 : 1,
      resetAt: entry && entry.resetAt > now ? entry.resetAt : now + 60 * 60 * 1000,
    });
    if (perAddress.size > 1000) perAddress.clear();

    const id = randomBytes(16).toString("hex");
    const token = `sbx_${id}.${randomBytes(32).toString("hex")}`;
    const result = await persistence.createSandbox(id, sandboxAuthDocuments(token));
    if (!result.ok) {
      logger.warn({ reason: result.reason }, "Demo sandbox not created");
      return res.status(result.reason === "full" ? 503 : 429).json({
        error: "The demo is busy right now. Please try again in a few minutes.",
      });
    }
    res.cookie("pharmacy_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.secure,
      maxAge: sessionCookieMaxAgeMs,
    });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;

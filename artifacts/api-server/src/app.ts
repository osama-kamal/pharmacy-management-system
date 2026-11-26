import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { transactional } from "./lib/transaction";
import { logger } from "./lib/logger";
import cookieParser from "cookie-parser";

const app: Express = express();
app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()",
  );
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'",
    );
  }
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      const isLocalDevelopment =
        process.env.NODE_ENV !== "production" &&
        Boolean(origin && /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin));
      if (!origin || configuredOrigins.includes(origin) || isLocalDevelopment)
        return callback(null, true);
      return callback(new Error("Origin is not allowed"));
    },
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

app.use("/api", transactional(router));

if (process.env.NODE_ENV === "production") {
  const publicDirectory = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "pharmacy-erp",
    "dist",
    "public",
  );
  if (existsSync(publicDirectory)) {
    app.use(express.static(publicDirectory, { index: false, maxAge: "1h" }));
    app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) =>
      res.sendFile(resolve(publicDirectory, "index.html")),
    );
  }
}

app.use("/api", (_req, res) =>
  res.status(404).json({ error: "API endpoint not found" }),
);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ err: error }, "Unhandled request error");
    res.status(500).json({ error: "Internal server error" });
  },
);

export default app;

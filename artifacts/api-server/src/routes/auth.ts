import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createPersistentJson } from "../lib/persistent-json";

type UserProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  licenseNumber: string;
  verified: boolean;
};

type SessionRecord = {
  userId?: number;
  email: string;
  role?: UserRole;
  expiresAt: number;
};

type UserRole = "Owner" | "Manager" | "Pharmacist" | "Cashier" | "Inventory" | "Accountant";

type AppUser = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: "Active" | "Inactive";
  createdAt: string;
};

const sessionDurationMs = 1000 * 60 * 60 * 12;
const maxSessions = 50;
const adminEmail = process.env["ADMIN_EMAIL"] ?? "admin@pharmacy.local";
const adminPassword = process.env["ADMIN_PASSWORD"] ?? "pharmacy123";
const defaultProfile: UserProfile = {
  name: "Budiono Siregar",
  email: adminEmail,
  phone: "",
  address: "",
  role: "Pharmacy Owner",
  licenseNumber: "",
  verified: false,
};
const profileStore = createPersistentJson<UserProfile>(
  "profile.json",
  defaultProfile,
);
const sessionStore = createPersistentJson<Record<string, SessionRecord>>(
  "sessions.json",
  {},
);

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;
  const supplied = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");
  return supplied.length === stored.length && timingSafeEqual(supplied, stored);
}

if (process.env["TURSO_DATABASE_URL"] && !process.env["ADMIN_PASSWORD"]) {
  throw new Error(
    "ADMIN_PASSWORD must be set when a hosted database is configured.",
  );
}

// Used only when the database has no users yet (first start).
const usersStore = createPersistentJson<AppUser[]>("users.json", [
  {
    id: 1,
    name: profileStore.data.name,
    email: adminEmail.toLowerCase(),
    passwordHash: hashPassword(adminPassword),
    role: "Owner",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
]);

/**
 * Documents for a brand new demo sandbox. The sandbox has its own demo admin
 * with a random password nobody knows (visitors get in through a session the
 * server creates), so nothing here relates to the owner's real login.
 */
export function sandboxAuthDocuments(token: string) {
  const email = "demo@pharmacy.local";
  const users: AppUser[] = [
    {
      id: 1,
      name: defaultProfile.name,
      email,
      passwordHash: hashPassword(randomBytes(32).toString("hex")),
      role: "Owner",
      status: "Active",
      createdAt: new Date().toISOString(),
    },
  ];
  const sessions: Record<string, SessionRecord> = {
    [token]: {
      userId: 1,
      email,
      role: "Owner",
      expiresAt: Date.now() + sessionDurationMs,
    },
  };
  // Built from the built-in defaults only, never from the owner's live data.
  const profile = { ...defaultProfile, email };
  return {
    "users.json": JSON.stringify(users),
    "sessions.json": JSON.stringify(sessions),
    "profile.json": JSON.stringify(profile),
  };
}
export const sessionCookieMaxAgeMs = sessionDurationMs;

const publicProfile = (user: AppUser): UserProfile => ({
  ...profileStore.data,
  name: user.name,
  email: user.email,
  role: user.role,
});

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function sessionToken(req: Request) {
  return req.cookies?.pharmacy_session as string | undefined;
}

function activeSession(req: Request) {
  const token = sessionToken(req);
  if (!token) return undefined;
  // Own properties only: a cookie such as "constructor" must never match.
  if (!Object.hasOwn(sessionStore.data, token)) return undefined;
  const session = sessionStore.data[token];
  if (!session) return undefined;
  if (session.expiresAt <= Date.now()) {
    const next = { ...sessionStore.data };
    delete next[token];
    sessionStore.save(next);
    return undefined;
  }
  if (!session.role || !session.userId) {
    const user = usersStore.data.find(
      (item) => item.email.toLowerCase() === session.email.toLowerCase(),
    );
    if (user) {
      const enriched = { ...session, userId: user.id, role: user.role };
      sessionStore.save({ ...sessionStore.data, [token]: enriched });
      return enriched;
    }
  }
  return session;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = activeSession(req);
  if (!session)
    return res.status(401).json({ error: "Authentication required" });
  res.locals.user = session;
  return next();
}

function requireRoles(...roles: UserRole[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const role = res.locals.user?.role as UserRole | undefined;
    if (!role || !roles.includes(role))
      return res.status(403).json({ error: "Insufficient permissions" });
    return next();
  };
}

const router: IRouter = Router();

router.post("/auth/login", (req, res) => {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password ?? "");
  const attemptKey = req.ip ?? "unknown";
  const attempt = loginAttempts.get(attemptKey);
  if (attempt && attempt.resetAt > Date.now() && attempt.count >= 10)
    return res.status(429).json({ error: "Too many sign-in attempts. Try again later." });
  const user = usersStore.data.find((item) => item.email.toLowerCase() === email);
  if (!user || user.status !== "Active" || !verifyPassword(password, user.passwordHash)) {
    loginAttempts.set(attemptKey, {
      count: attempt && attempt.resetAt > Date.now() ? attempt.count + 1 : 1,
      resetAt: Date.now() + 1000 * 60 * 15,
    });
    return res.status(401).json({ error: "Invalid email or password" });
  }
  loginAttempts.delete(attemptKey);
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  // Keep the sessions document bounded: drop expired ones and keep the newest.
  const live = Object.entries(sessionStore.data)
    .filter(([, session]) => session.expiresAt > now)
    .sort((a, b) => b[1].expiresAt - a[1].expiresAt)
    .slice(0, maxSessions - 1);
  const sessionPrefix = req.cookies?.pharmacy_session?.match?.(
    /^sbx_[a-f0-9]{32}\./,
  )?.[0];
  // A sign-in inside a demo sandbox keeps the sandbox prefix so the request
  // keeps working on that sandbox's own data.
  const sessionId = (sessionPrefix ?? "") + token;
  sessionStore.save({
    ...Object.fromEntries(live),
    [sessionId]: {
      userId: user.id,
      email,
      role: user.role,
      expiresAt: now + sessionDurationMs,
    },
  });
  res.cookie("pharmacy_session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
    maxAge: sessionDurationMs,
  });
  return res.json({ user: publicProfile(user) });
});

router.get("/auth/me", (req, res) => {
  const session = activeSession(req);
  if (!session) {
    res.clearCookie("pharmacy_session");
    return res.json({ user: null });
  }
  const user = usersStore.data.find(
    (item) =>
      item.id === session.userId ||
      item.email.toLowerCase() === session.email.toLowerCase(),
  );
  if (!user || user.status !== "Active") {
    res.clearCookie("pharmacy_session");
    return res.json({ user: null });
  }
  return res.json({ user: publicProfile(user) });
});

router.post("/auth/logout", (req, res) => {
  const token = sessionToken(req);
  if (token && Object.hasOwn(sessionStore.data, token)) {
    const next = { ...sessionStore.data };
    delete next[token];
    sessionStore.save(next);
  }
  res.clearCookie("pharmacy_session");
  return res.status(204).send();
});

router.get(
  "/users",
  requireAuth,
  requireRoles("Owner", "Manager"),
  (_req, res) =>
    res.json(usersStore.data.map(({ passwordHash: _passwordHash, ...user }) => user)),
);

router.post(
  "/users",
  requireAuth,
  requireRoles("Owner", "Manager"),
  (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const allowedRoles: UserRole[] = [
      "Owner",
      "Manager",
      "Pharmacist",
      "Cashier",
      "Inventory",
      "Accountant",
    ];
    const role = req.body?.role as UserRole;
    if (!name || !email || password.length < 8 || !allowedRoles.includes(role))
      return res.status(400).json({
        error: "Name, valid role, email and an 8-character password are required",
      });
    if (usersStore.data.some((item) => item.email.toLowerCase() === email))
      return res.status(409).json({ error: "Email already exists" });
    const user: AppUser = {
      id: usersStore.data.reduce((max, item) => Math.max(max, item.id), 0) + 1,
      name,
      email,
      passwordHash: hashPassword(password),
      role,
      status: "Active",
      createdAt: new Date().toISOString(),
    };
    usersStore.save([user, ...usersStore.data]);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return res.status(201).json(safeUser);
  },
);

router.patch(
  "/users/:id",
  requireAuth,
  requireRoles("Owner", "Manager"),
  (req, res) => {
    const id = Number(req.params.id);
    const users = [...usersStore.data];
    const user = users.find((item) => item.id === id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (typeof req.body?.name === "string" && req.body.name.trim())
      user.name = req.body.name.trim();
    if (
      ["Owner", "Manager", "Pharmacist", "Cashier", "Inventory", "Accountant"].includes(
        req.body?.role,
      )
    )
      user.role = req.body.role;
    if (req.body?.status === "Active" || req.body?.status === "Inactive")
      user.status = req.body.status;
    if (typeof req.body?.password === "string" && req.body.password.length >= 8)
      user.passwordHash = hashPassword(req.body.password);
    usersStore.save(users);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return res.json(safeUser);
  },
);

router.delete(
  "/users/:id",
  requireAuth,
  requireRoles("Owner"),
  (req, res) => {
    const id = Number(req.params.id);
    if (res.locals.user?.userId === id)
      return res.status(400).json({ error: "You cannot delete your own account" });
    const users = usersStore.data.filter((item) => item.id !== id);
    if (users.length === usersStore.data.length)
      return res.status(404).json({ error: "User not found" });
    usersStore.save(users);
    return res.status(204).send();
  },
);

router.post("/auth/change-password", requireAuth, (req, res) => {
  const currentPassword = String(req.body?.currentPassword ?? "");
  const newPassword = String(req.body?.newPassword ?? "");
  if (newPassword.length < 8)
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  const users = [...usersStore.data];
  const user = users.find(
    (item) =>
      item.id === res.locals.user?.userId ||
      item.email.toLowerCase() === String(res.locals.user?.email).toLowerCase(),
  );
  if (!user || !verifyPassword(currentPassword, user.passwordHash))
    return res.status(400).json({ error: "Current password is incorrect" });
  user.passwordHash = hashPassword(newPassword);
  usersStore.save(users);
  return res.status(204).send();
});

router.get("/profile", requireAuth, (_req, res) => res.json(profileStore.data));
router.patch("/profile", requireAuth, (req, res) => {
  const allowed = ["name", "phone", "address", "licenseNumber"] as const;
  const next = { ...profileStore.data };
  for (const key of allowed)
    if (typeof req.body?.[key] === "string") next[key] = req.body[key].trim();
  next.verified = Boolean(
    next.name && next.phone && next.address && next.licenseNumber,
  );
  profileStore.save(next);

  const users = [...usersStore.data];
  const user = users.find(
    (item) =>
      item.id === res.locals.user?.userId ||
      item.email.toLowerCase() === String(res.locals.user?.email).toLowerCase(),
  );
  if (user && next.name) {
    user.name = next.name;
    usersStore.save(users);
    return res.json(publicProfile(user));
  }
  return res.json(next);
});

export default router;

import type { NextFunction, Request, RequestHandler, Response } from "express";
import { logger } from "./logger";
import { persistence } from "./persistent-json";

const MAX_ATTEMPTS = 6;

/**
 * Runs the wrapped router as one transaction:
 *
 * 1. Requests in this process run one at a time, so the in-memory state the
 *    route handlers use is never shared between two overlapping requests.
 * 2. The latest committed data is loaded from the database before the handler.
 * 3. The response is held back. Only after the changed documents were written
 *    (all or nothing, checked against the version that was loaded) is it sent.
 * 4. If another process changed the same document in the meantime, the write is
 *    refused, the data is reloaded and the handler runs again on fresh data.
 *    Nothing from a refused attempt is ever sent or stored.
 * 5. If the write fails, the client gets an error, never a false success.
 */
export function transactional(inner: RequestHandler): RequestHandler {
  let queue: Promise<unknown> = Promise.resolve();

  return (req: Request, res: Response, next: NextFunction) => {
    const run = queue.then(() => handle(inner, req, res, next));
    queue = run.catch(() => undefined);
  };
}

type Outcome =
  | { kind: "ended"; args: unknown[] }
  | { kind: "next"; error?: unknown };

function runOnce(inner: RequestHandler, req: Request, res: Response) {
  return new Promise<Outcome>((resolve) => {
    const originalEnd = res.end;
    let settled = false;
    const finish = (outcome: Outcome) => {
      if (settled) return;
      settled = true;
      res.end = originalEnd;
      resolve(outcome);
    };
    // Capture the end of the response instead of sending it.
    (res as any).end = (...args: unknown[]) => {
      finish({ kind: "ended", args });
      return res;
    };
    try {
      inner(req, res, (error?: unknown) => finish({ kind: "next", error }));
    } catch (error) {
      finish({ kind: "next", error });
    }
  });
}

async function handle(
  inner: RequestHandler,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const originalEnd = res.end;
  const startUrl = req.url;
  const startBaseUrl = req.baseUrl;
  const startParams = req.params;
  const startLocals = { ...res.locals };
  const startHeaders = new Map(
    res.getHeaderNames().map((name) => [name, res.getHeader(name)]),
  );

  const reset = () => {
    req.url = startUrl;
    req.baseUrl = startBaseUrl;
    req.params = startParams;
    for (const key of Object.keys(res.locals)) delete res.locals[key];
    Object.assign(res.locals, startLocals);
    for (const name of res.getHeaderNames()) {
      if (!startHeaders.has(name)) res.removeHeader(name);
    }
    for (const [name, value] of startHeaders) {
      if (value !== undefined) res.setHeader(name, value);
    }
    res.statusCode = 200;
    res.end = originalEnd;
  };

  const fail = (status: number, message: string) => {
    reset();
    res.status(status).json({ error: message });
  };

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      await persistence.hydrate();
      const outcome = await runOnce(inner, req, res);

      if (outcome.kind === "next") {
        // Not handled here (404 fall-through) or an error: nothing is saved.
        reset();
        return next(outcome.error);
      }

      if (!persistence.hasChanges()) {
        res.end = originalEnd;
        return (res.end as (...args: unknown[]) => unknown)(...outcome.args);
      }

      const result = await persistence.commit();
      if (result.ok) {
        res.end = originalEnd;
        return (res.end as (...args: unknown[]) => unknown)(...outcome.args);
      }

      logger.warn(
        { conflictKey: result.conflictKey, attempt },
        "Write conflict, retrying on fresh data",
      );
      reset();
      // Small random pause so competing writers stop colliding in lockstep.
      await new Promise((resolve) =>
        setTimeout(resolve, 15 * attempt + Math.random() * 60),
      );
    }
    return fail(409, "The data changed while saving. Please try again.");
  } catch (error) {
    logger.error({ err: error }, "Storage error");
    return fail(500, "The data could not be saved. Nothing was changed.");
  }
}

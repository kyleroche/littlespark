import { createStore } from "../server/store.js";
import {
  readCookie,
  sessionCookie,
  rateKey,
  normalizeName,
} from "../server/auth-utils.js";
function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Vary", "Cookie");
  res.end(JSON.stringify(data));
}
async function body(req) {
  if (req.body) {
    const raw =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > 8192) throw Error("Request too large.");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw Error("Invalid JSON object.");
    return parsed;
  }
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 8192) throw Error("Request too large.");
  }
  const parsed = raw ? JSON.parse(raw) : {};
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw Error("Invalid JSON object.");
  return parsed;
}
const uuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export default async function handler(req, res) {
  const origin = process.env.APP_ORIGIN || "https://littlespark.tech";
  const allowed = new Set([
    origin,
    "https://little-sparks-delta.vercel.app",
    ...(process.env.NODE_ENV !== "production"
      ? ["http://127.0.0.1:5173", "http://localhost:5173"]
      : []),
  ]);
  const secure = process.env.NODE_ENV === "production";
  try {
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return send(res, 405, { error: "Method not allowed." });
    }
    if (req.method === "POST" && !allowed.has(req.headers.origin))
      return send(res, 403, { error: "Request origin not allowed." });
    if (!process.env.AUTH_SECRET || !process.env.DATABASE_URL)
      return send(res, 503, {
        error: "Accounts are being configured. Local progress still works.",
      });
    const store = createStore(),
      url = new URL(req.url, "https://local.invalid"),
      action = url.searchParams.get("action") || "me",
      token = readCookie(req.headers.cookie),
      session = await store.session(token);
    const input = req.method === "POST" ? await body(req) : {};
    const ip = String(
      req.headers["x-vercel-forwarded-for"] ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        "unknown",
    )
      .split(",")[0]
      .trim();
    if (
      req.method === "POST" &&
      !(await store.limit(
        rateKey(ip, "all", process.env.AUTH_SECRET),
        120,
        5 * 60e3,
      ))
    )
      return send(res, 429, {
        error: "Too many requests. Try again in five minutes.",
      });
    if (action === "me" && req.method === "GET") {
      if (!session) return send(res, 200, { user: null });
      if (session.role === "parent")
        return send(res, 200, {
          user: { role: "parent", id: session.id, email: session.email },
          kids: await store.children(session.id),
        });
      return send(res, 200, {
        user: {
          role: "kid",
          id: session.id,
          name: session.name,
          avatar: session.avatar,
        },
        progress: await store.progress(session.id),
      });
    }
    if (action === "request-parent-link" && req.method === "POST") {
      if (
        typeof input.email !== "string" ||
        input.email.length > 254 ||
        !/^\S+@[^\s@]+\.[^\s@]+$/.test(input.email)
      )
        return send(res, 400, { error: "Enter a valid email address." });
      const email = input.email.trim().toLowerCase();
      if (
        !(await store.limit(
          rateKey(ip, "parent-email", process.env.AUTH_SECRET),
          5,
          15 * 60e3,
        )) ||
        !(await store.limit(
          rateKey(email, "email-address", process.env.AUTH_SECRET),
          3,
          15 * 60e3,
        ))
      )
        return send(res, 429, {
          error: "Please wait before requesting another email.",
        });
      if (!process.env.RESEND_API_KEY)
        return send(res, 503, { error: "Email sign-in is not ready yet." });
      const magic = await store.parentLink(email),
        link = `${origin}/parent-login/${magic}`;
      const sent = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:
            process.env.AUTH_FROM_EMAIL ||
            "Little Spark <login@auth.littlespark.tech>",
          to: [email],
          subject: "Sign in to Little Spark",
          text: `Sign in to Little Spark:\n\n${link}\n\nThis link works once and expires in five minutes. If you did not request it, ignore this email.`,
        }),
      });
      if (!sent.ok) {
        console.error("Parent email could not be sent:", sent.status);
        return send(res, 503, {
          error: "Email delivery is not ready. Please try again later.",
        });
      }
      return send(res, 200, {
        ok: true,
        message: "Check your email. The link expires in five minutes.",
      });
    }
    if (
      ["consume-parent-link", "consume-kid-link"].includes(action) &&
      req.method === "POST"
    ) {
      if (
        !(await store.limit(
          rateKey(ip, "login-attempt", process.env.AUTH_SECRET),
          20,
          5 * 60e3,
        ))
      )
        return send(res, 429, {
          error: "Too many login attempts. Try again in five minutes.",
        });
      const value = typeof input.token === "string" ? input.token : "";
      const valid =
        action === "consume-parent-link"
          ? /^[A-Za-z0-9_-]{43}$/.test(value)
          : /^[a-z]+-[a-z]+-[a-z2-9]{6}$/.test(value);
      const login = valid
        ? await (action === "consume-parent-link"
            ? store.consumeParent(value)
            : store.consumeChild(value))
        : null;
      if (!login)
        return send(res, 401, {
          error:
            "This link has expired or was already used. Request a new link.",
        });
      if (token) await store.logout(token);
      res.setHeader(
        "Set-Cookie",
        sessionCookie(login.token, {
          secure,
          maxAge: login.user.role === "parent" ? 30 * 86400 : 7 * 86400,
        }),
      );
      return send(res, 200, { user: login.user });
    }
    if (action === "logout" && req.method === "POST") {
      await store.logout(token);
      res.setHeader("Set-Cookie", sessionCookie("", { secure, maxAge: 0 }));
      return send(res, 200, { ok: true });
    }
    if (!session) return send(res, 401, { error: "Sign in to continue." });
    if (
      req.method === "POST" &&
      [
        "save-progress",
        "add-child",
        "kid-link",
        "update-child",
        "revoke-child",
      ].includes(action) &&
      input.profileId !== session.id
    )
      return send(res, 409, {
        code: "SESSION_CHANGED",
        error:
          "The signed-in profile changed in another tab. Reload before continuing.",
      });
    if (action === "save-progress" && req.method === "POST") {
      if (session.role !== "kid")
        return send(res, 403, {
          error: "Choose a child profile to save lesson progress.",
        });
      const saved = await store.saveProgress(
        session.id,
        input.state,
        Number.isInteger(input.generation) && input.generation >= 0
          ? input.generation
          : 0,
        input.reset === true,
      );
      return saved
        ? send(res, 200, { progress: saved })
        : send(res, 409, {
            code: "PROGRESS_RESET",
            error:
              "Progress was reset on another device. Reload before continuing.",
          });
    }
    if (session.role !== "parent")
      return send(res, 403, { error: "This action needs a parent account." });
    if (action === "add-child" && req.method === "POST")
      return send(res, 201, {
        kid: await store.addChild(
          session.id,
          normalizeName(input.name),
          input.avatar,
        ),
      });
    if (
      ["kid-link", "update-child", "revoke-child"].includes(action) &&
      req.method === "POST"
    ) {
      if (!uuid(input.id)) return send(res, 400, { error: "Invalid profile." });
      if (
        !(await store.limit(
          rateKey(session.id, action, process.env.AUTH_SECRET),
          30,
          5 * 60e3,
        ))
      )
        return send(res, 429, { error: "Please wait before trying again." });
      const result =
        action === "kid-link"
          ? await store.childLink(session.id, input.id)
          : action === "update-child"
            ? await store.updateChild(
                session.id,
                input.id,
                input.name,
                input.avatar,
              )
            : await store.revokeChild(session.id, input.id);
      if (!result) return send(res, 404, { error: "Profile not found." });
      return send(
        res,
        200,
        action === "kid-link"
          ? { ...result, url: `${origin}/login/${result.code}` }
          : { ok: true, kid: result },
      );
    }
    return send(res, 404, { error: "Not found." });
  } catch (error) {
    console.error("Family API error:", error.name);
    const expected =
      /nickname|profiles|Invalid progress|Request too large|JSON/.test(
        error.message,
      );
    return send(res, expected ? 400 : 500, {
      error: expected
        ? error.message
        : "Could not complete this request. Please try again.",
    });
  }
}

import { createStore } from "./store.js";
import { readCookie } from "./auth-utils.js";
export const labPath = (pathname) => /^\/learn(?:\/|$)/.test(pathname);
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "X-Robots-Tag": "noindex",
};
export async function checkLabAccess(
  request,
  lookup = (token) => createStore().session(token),
) {
  if (!labPath(new URL(request.url).pathname)) return null;
  if (!["GET", "HEAD"].includes(request.method))
    return new Response("Method not allowed.", {
      status: 405,
      headers: { ...headers, Allow: "GET, HEAD" },
    });
  const token = readCookie(request.headers.get("cookie"));
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    try {
      const session = await lookup(token);
      if (session && ["parent", "kid"].includes(session.role)) return null;
    } catch {
      return new Response(
        "We could not check your sign-in. Please reload to try again.",
        { status: 503, headers },
      );
    }
  }
  return new Response(null, {
    status: 302,
    headers: { ...headers, Location: "/signin/" },
  });
}

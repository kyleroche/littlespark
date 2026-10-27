import { next } from "@vercel/functions";
import { checkLabAccess } from "./server/lab-access.js";
export const config = { runtime: "nodejs", matcher: ["/learn/:path*"] };
export default async function middleware(request) {
  const blocked = await checkLabAccess(request);
  if (blocked) return blocked;
  const response = next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}

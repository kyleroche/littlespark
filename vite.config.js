import { defineConfig, loadEnv } from "vite";
import { checkLabAccess } from "./server/lab-access.js";
export default defineConfig(({ mode }) => ({
  build: {
    rollupOptions: {
      input: {
        home: "index.html",
        howto: "how-to/index.html",
        learn: "learn/index.html",
        makey: "learn/makey-makey/index.html",
        signin: "signin/index.html",
      },
    },
  },
  plugins: [
    {
      name: "local-family-api",
      configureServer(server) {
        Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
        server.middlewares.use(async (req, res, next) => {
          const request = new Request(
            new URL(req.url, "http://127.0.0.1:5173"),
            {
              method: req.method,
              headers: { cookie: req.headers.cookie || "" },
            },
          );
          const blocked = await checkLabAccess(request);
          if (blocked) {
            res.statusCode = blocked.status;
            for (const [key, value] of blocked.headers)
              res.setHeader(key, value);
            return res.end(await blocked.text());
          }
          if (/^\/(login|parent-login)\/[^/?]+\/?(?:\?.*)?$/.test(req.url))
            req.url = "/signin/index.html";
          next();
        });
        server.middlewares.use("/api/family", async (req, res) => {
          try {
            const { default: handler } = await import("./api/family.js");
            req.url = "/api/family" + req.url;
            await handler(req, res);
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Local API could not start." }));
          }
        });
      },
    },
  ],
}));

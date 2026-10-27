import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => ({
  plugins: [
    {
      name: "local-family-api",
      configureServer(server) {
        Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
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

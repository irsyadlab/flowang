import { serve } from "bun";
import { existsSync } from "fs";
import path from "path";
import index from "./index.html";

const isProd = process.env.NODE_ENV === "production";

// In production, static files are served from dist/.
// In development, they are served directly from public/.
const staticRoot = isProd
  ? path.join(import.meta.dir, "..", "dist")
  : path.join(import.meta.dir, "..", "public");

function serveStatic(filePath: string): Response | null {
  const full = path.join(staticRoot, filePath);
  if (!existsSync(full)) return null;

  const ext = path.extname(full);
  const mimeTypes: Record<string, string> = {
    ".json": "application/json",
    ".js":   "application/javascript",
    ".txt":  "text/plain",
    ".png":  "image/png",
    ".svg":  "image/svg+xml",
    ".ico":  "image/x-icon",
    ".webp": "image/webp",
  };
  const contentType = mimeTypes[ext] ?? "application/octet-stream";

  return new Response(Bun.file(full), {
    headers: { "Content-Type": contentType },
  });
}

const server = serve({
  routes: {
    "/sw.js":          () => serveStatic("sw.js") ?? new Response("Not found", { status: 404 }),
    "/env.js":         () => {
      // In dev, generate env.js on-the-fly from current process.env
      const envVarNames = [
        'BUN_PUBLIC_WEBRTC_SIGNALING_URL',
        'BUN_PUBLIC_GOOGLE_CLIENT_ID',
        'BUN_PUBLIC_GOOGLE_API_KEY',
        'BUN_PUBLIC_STUN_URL',
        'BUN_PUBLIC_TURN_URL',
        'BUN_PUBLIC_TURN_USERNAME',
        'BUN_PUBLIC_TURN_CREDENTIAL',
      ];
      const envObj: Record<string, string> = {};
      for (const key of envVarNames) {
        const val = process.env[key];
        if (val) envObj[key] = val;
      }
      return new Response(`window.__ENV__=${JSON.stringify(envObj)};`, {
        headers: { "Content-Type": "application/javascript" },
      });
    },
    "/manifest.json":  () => serveStatic("manifest.json") ?? new Response("Not found", { status: 404 }),
    "/robots.txt":     () => serveStatic("robots.txt") ?? new Response("Not found", { status: 404 }),
    "/icons/:file":    (req) => {
      const file = req.params.file;
      return serveStatic(`icons/${file}`) ?? new Response("Not found", { status: 404 });
    },
    "/screenshots/:file": (req) => {
      const file = req.params.file;
      return serveStatic(`screenshots/${file}`) ?? new Response("Not found", { status: 404 });
    },
    // Serve index.html for all unmatched routes (SPA fallback)
    "/*": index,
  },

  port: process.env.APP_PORT || 3000,
  hostname: process.env.APP_HOST || 'localhost',

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

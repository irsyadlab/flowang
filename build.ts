#!/usr/bin/env bun
import { build, type BuildConfig } from "bun";
import plugin from "bun-plugin-tailwind";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import path from "path";

// Print help text if requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🏗️  Bun Build Script

Usage: bun run build.ts [options]

Common Options:
  --outdir <path>          Output directory (default: "dist")
  --minify                 Enable minification (or --minify.whitespace, --minify.syntax, etc)
  --source-map <type>      Sourcemap type: none|linked|inline|external
  --target <target>        Build target: browser|bun|node
  --format <format>        Output format: esm|cjs|iife
  --splitting              Enable code splitting
  --packages <type>        Package handling: bundle|external
  --public-path <path>     Public path for assets
  --env <mode>             Environment handling: inline|disable|prefix*
  --conditions <list>      Package.json export conditions (comma separated)
  --external <list>        External packages (comma separated)
  --banner <text>          Add banner text to output
  --footer <text>          Add footer text to output
  --define <obj>           Define global constants (e.g. --define.VERSION=1.0.0)
  --help, -h               Show this help message

Example:
  bun run build.ts --outdir=dist --minify --source-map=linked --external=react,react-dom
`);
  process.exit(0);
}

// Helper function to convert kebab-case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

// Helper function to parse a value into appropriate type
const parseValue = (value: string): any => {
  // Handle true/false strings
  if (value === "true") return true;
  if (value === "false") return false;

  // Handle numbers
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d*\.\d+$/.test(value)) return parseFloat(value);

  // Handle arrays (comma-separated)
  if (value.includes(",")) return value.split(",").map((v) => v.trim());

  // Default to string
  return value;
};

// Magical argument parser that converts CLI args to BuildConfig
function parseArgs(): Partial<BuildConfig> {
  const config: Record<string, any> = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) continue;

    // Handle --no-* flags
    if (arg.startsWith("--no-")) {
      const key = toCamelCase(arg.slice(5));
      config[key] = false;
      continue;
    }

    // Handle --flag (boolean true)
    if (
      !arg.includes("=") &&
      (i === args.length - 1 || args[i + 1].startsWith("--"))
    ) {
      const key = toCamelCase(arg.slice(2));
      config[key] = true;
      continue;
    }

    // Handle --key=value or --key value
    let key: string;
    let value: string;

    if (arg.includes("=")) {
      [key, value] = arg.slice(2).split("=", 2);
    } else {
      key = arg.slice(2);
      value = args[++i];
    }

    // Convert kebab-case key to camelCase
    key = toCamelCase(key);

    // Handle nested properties (e.g. --minify.whitespace)
    if (key.includes(".")) {
      const [parentKey, childKey] = key.split(".");
      config[parentKey] = config[parentKey] || {};
      config[parentKey][childKey] = parseValue(value);
    } else {
      config[key] = parseValue(value);
    }
  }

  return config as Partial<BuildConfig>;
}

// Helper function to format file sizes
const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

console.log("\n🚀 Starting build process...\n");

// Parse CLI arguments with our magical parser
const cliConfig = parseArgs();
const outdir = cliConfig.outdir || path.join(process.cwd(), "dist");

if (existsSync(outdir)) {
  console.log(`🗑️ Cleaning previous build at ${outdir}`);
  await rm(outdir, { recursive: true, force: true });
}

const start = performance.now();

// Copy PWA static files (sw.js, manifest.json, icons/) to outdir
const staticFiles = [
  { src: path.join("public", "sw.js"), dest: path.join(outdir, "sw.js") },
  {
    src: path.join("public", "manifest.json"),
    dest: path.join(outdir, "manifest.json"),
  },
  {
    src: path.join("public", "robots.txt"),
    dest: path.join(outdir, "robots.txt"),
  },
];

const iconsDir = path.join("public", "icons");
if (existsSync(iconsDir)) {
  const { readdir, copyFile, mkdir } = await import("fs/promises");
  const outIconsDir = path.join(outdir, "icons");
  await mkdir(outIconsDir, { recursive: true });
  const iconFiles = await readdir(iconsDir);
  for (const file of iconFiles) {
    staticFiles.push({
      src: path.join(iconsDir, file),
      dest: path.join(outIconsDir, file),
    });
  }
}

const screenshotsDir = path.join("public", "screenshots");
if (existsSync(screenshotsDir)) {
  const { readdir } = await import("fs/promises");
  const outScreenshotsDir = path.join(outdir, "screenshots");
  const screenshotFiles = await readdir(screenshotsDir);
  for (const file of screenshotFiles) {
    staticFiles.push({
      src: path.join(screenshotsDir, file),
      dest: path.join(outScreenshotsDir, file),
    });
  }
}

// Copy .well-known/ for TWA Digital Asset Links verification
const wellKnownDir = path.join("public", ".well-known");
if (existsSync(wellKnownDir)) {
  const { readdir } = await import("fs/promises");
  const outWellKnownDir = path.join(outdir, ".well-known");
  const wellKnownFiles = await readdir(wellKnownDir);
  for (const file of wellKnownFiles) {
    staticFiles.push({
      src: path.join(wellKnownDir, file),
      dest: path.join(outWellKnownDir, file),
    });
  }
}

const { copyFile: copy, mkdir } = await import("fs/promises");
for (const { src, dest } of staticFiles) {
  if (existsSync(src)) {
    await mkdir(path.dirname(dest), { recursive: true });
    await copy(src, dest);
  }
}

// Scan for all HTML files in the project
const entrypoints = [...new Bun.Glob("**.html").scanSync("src")]
  .map((a) => path.resolve("src", a))
  .filter((dir) => !dir.includes("node_modules"));
console.log(
  `📄 Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process\n`,
);

// Build all the HTML files
const envDefines: Record<string, string> = {};
const envKeys = [
  "BUN_PUBLIC_WEBRTC_SIGNALING_URL",
  "BUN_PUBLIC_GOOGLE_CLIENT_ID",
  "BUN_PUBLIC_GOOGLE_API_KEY",
  "BUN_PUBLIC_STUN_URL",
  "BUN_PUBLIC_TURN_URL_1",
  "BUN_PUBLIC_TURN_URL_2",
  "BUN_PUBLIC_TURN_USERNAME",
  "BUN_PUBLIC_TURN_CREDENTIAL",
];
for (const key of envKeys) {
  const val = process.env[key];
  envDefines[`process.env.${key}`] = JSON.stringify(val ?? "");
}

const result = await build({
  entrypoints,
  outdir,
  plugins: [plugin],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  // Route di-code-split lewat dynamic import (lihat src/routes/index.tsx).
  // Tanpa splitting, semua dynamic import ditarik balik ke satu bundle dan
  // pemecahannya jadi tidak berefek apa pun.
  splitting: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    ...envDefines,
  },
  ...cliConfig, // Merge in any CLI-provided options
});

// Print the results
const end = performance.now();

const outputTable = result.outputs.map((output) => ({
  File: path.relative(process.cwd(), output.path),
  Type: output.kind,
  Size: formatFileSize(output.size),
}));

console.table(outputTable);

// Generate env.js for static deployments (Caddy/nginx).
// This file is loaded before the app bundle and injects env vars into window.__ENV__
// so they are available at runtime without needing a Bun server.
const envJs = path.join(outdir, "env.js");
const envVarNames = [
  "BUN_PUBLIC_WEBRTC_SIGNALING_URL",
  "BUN_PUBLIC_GOOGLE_CLIENT_ID",
  "BUN_PUBLIC_GOOGLE_API_KEY",
  "BUN_PUBLIC_STUN_URL",
  "BUN_PUBLIC_TURN_URL_1",
  "BUN_PUBLIC_TURN_URL_2",
  "BUN_PUBLIC_TURN_USERNAME",
  "BUN_PUBLIC_TURN_CREDENTIAL",
];
const envObj: Record<string, string> = {};
for (const key of envVarNames) {
  const val = process.env[key];
  if (val) envObj[key] = val;
}
await Bun.write(envJs, `window.__ENV__=${JSON.stringify(envObj)};`);
console.log(
  `🔑 env.js generated with ${Object.keys(envObj).length} variable(s)`,
);

const htmlPath = path.join(outdir, "index.html");
let html = await Bun.file(htmlPath).text();

// Koreksi src entry di index.html.
//
// Bug Bun (tercek di 1.3.14): dengan `splitting: true`, Bun menulis src chunk
// yang SALAH ke index.html — sebuah chunk bersama, bukan entry aplikasi —
// padahal `result.outputs` melaporkan entry-point yang benar. Akibatnya bundle
// produksi memuat modul acak, React tidak pernah mount, dan yang terlihat user
// hanyalah splash screen yang menggantung selamanya.
//
// Perbaikannya memakai metadata Bun sendiri sebagai sumber kebenaran. Kalau
// suatu saat bug-nya diperbaiki, blok ini jadi no-op (src sudah benar).
const jsEntry = result.outputs.find(
  (o) => o.kind === "entry-point" && o.path.endsWith(".js"),
);
if (jsEntry) {
  const entryName = path.basename(jsEntry.path);
  const currentSrc = html.match(
    /<script type="module"[^>]*src="\.\/([^"]+\.js)"/,
  )?.[1];

  if (currentSrc && currentSrc !== entryName) {
    html = html.replace(
      /(<script type="module"[^>]*src=")\.\/[^"]+\.js(")/,
      `$1./${entryName}$2`,
    );
    console.log(
      `\n🔧 index.html entry dikoreksi: ${currentSrc} → ${entryName}`,
    );
  }
} else {
  console.warn(
    "\n⚠️  Tidak menemukan entry-point JS di output build — index.html tidak dikoreksi",
  );
}

// Jadikan seluruh path aset di index.html absolut terhadap root.
//
// Bun meng-emit path relatif (`./chunk-abc.js`). Untuk SPA dengan fallback ke
// index.html, itu rusak pada setiap route yang lebih dari satu level: membuka
// `/wallets/new` membuat browser me-resolve `./chunk-abc.js` menjadi
// `/wallets/chunk-abc.js`, fallback mengembalikan index.html, dan module script
// gagal di-parse — React tidak pernah mount dan user melihat splash kosong.
//
// Hanya terlihat lewat hard refresh, bookmark, atau tautan langsung; navigasi
// di dalam SPA tidak pernah memuat ulang dokumen, jadi selama ini tak kentara.
const relativeAssetRefs = html.match(/(?:src|href)="\.\/[^"]+"/g) ?? [];
if (relativeAssetRefs.length > 0) {
  html = html.replace(/((?:src|href)=")\.\//g, "$1/");
  console.log(
    `🔗 ${relativeAssetRefs.length} path aset di index.html dijadikan absolut`,
  );
}

// Inject <script src="/env.js"> into dist/index.html before the app bundle
html = html.replace(
  '<script type="module"',
  '<script src="/env.js"></script>\n  <script type="module"',
);
await Bun.write(htmlPath, html);
const { readFile, writeFile } = await import("fs/promises");
const distHtml = await readFile(path.join(outdir, "index.html"), "utf-8");

// Extract hashed paths for both icon sizes.
// Path di index.html sudah dijadikan absolut di atas, jadi pola `./` tidak lagi
// dipakai — `\/?` mempertahankan kecocokan untuk kedua bentuk.
const icon192Match = distHtml.match(/href="\.?\/([^"]*icon-192[^"]*\.png)"/);
const icon512Match = distHtml.match(/href="\.?\/([^"]*icon-512[^"]*\.png)"/);
const icon192MaskableMatch = distHtml.match(
  /href="\.?\/([^"]*icon-192-maskable[^"]*\.png)"/,
);
const icon512MaskableMatch = distHtml.match(
  /href="\.?\/([^"]*icon-512-maskable[^"]*\.png)"/,
);

const manifestPath = path.join(outdir, "manifest.json");
if (existsSync(manifestPath) && (icon192Match || icon512Match)) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
  manifest.icons = [
    icon192Match && {
      src: `/${icon192Match[1]}`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    icon192MaskableMatch && {
      src: `/${icon192MaskableMatch[1]}`,
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    icon512Match && {
      src: `/${icon512Match[1]}`,
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    icon512MaskableMatch && {
      src: `/${icon512MaskableMatch[1]}`,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ].filter(Boolean);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📱 manifest.json updated with hashed icon paths`);
}

// Post-process: inject hashed asset URLs into sw.js PRECACHE_URLS
// so the service worker pre-caches the full app shell on install.
const swPath = path.join(outdir, "sw.js");
if (existsSync(swPath)) {
  // Collect all cacheable assets from the build output
  const cacheableAssets = result.outputs
    .filter((o) => ["entry-point", "asset", "chunk"].includes(o.kind))
    .map((o) => `/${path.relative(outdir, o.path)}`)
    .filter((p) => !p.endsWith(".map")); // skip sourcemaps

  // Always include root and manifest
  const precacheUrls = ["/", "/manifest.json", ...cacheableAssets].filter(
    (v, i, a) => a.indexOf(v) === i,
  ); // dedupe

  let swContent = await readFile(swPath, "utf-8");
  swContent = swContent.replace(
    /const PRECACHE_URLS = \[[\s\S]*?\];/,
    `const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};`,
  );

  // Cache name harus berubah setiap kali isi build berubah.
  //
  // Strategi asset adalah cache-first dengan nama file ber-hash, dan handler
  // `activate` hanya menghapus cache yang namanya != CACHE_NAME. Dengan nama
  // yang tetap, kondisi itu tidak pernah terpenuhi sehingga chunk dari deploy
  // lama menumpuk selamanya di perangkat user. Sejak route di-split jumlah
  // chunk per deploy jauh lebih banyak, jadi ini bukan lagi masalah sepele.
  //
  // Hash diturunkan dari daftar URL ber-hash itu sendiri: berubah kalau dan
  // hanya kalau ada output yang berubah, jadi rebuild tanpa perubahan tidak
  // membuang cache user secara sia-sia.
  const buildHash = Bun.hash(precacheUrls.join("\n")).toString(36).slice(0, 10);
  swContent = swContent.replace(
    /const CACHE_NAME = '[^']*';/,
    `const CACHE_NAME = 'flowang-${buildHash}';`,
  );

  await writeFile(swPath, swContent);
  console.log(
    `📦 sw.js updated with ${precacheUrls.length} pre-cached URLs (cache: flowang-${buildHash})`,
  );
}

const buildTime = (end - start).toFixed(2);
console.log(`\n✅ Build completed in ${buildTime}ms\n`);

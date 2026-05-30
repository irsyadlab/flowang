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
  return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
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
  if (value.includes(",")) return value.split(",").map(v => v.trim());

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
    if (!arg.includes("=") && (i === args.length - 1 || args[i + 1].startsWith("--"))) {
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
  { src: path.join("src", "sw.js"), dest: path.join(outdir, "sw.js") },
  { src: path.join("src", "manifest.json"), dest: path.join(outdir, "manifest.json") },
];

const iconsDir = path.join("src", "icons");
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

const { copyFile: copy, mkdir } = await import("fs/promises");
for (const { src, dest } of staticFiles) {
  if (existsSync(src)) {
    await mkdir(path.dirname(dest), { recursive: true });
    await copy(src, dest);
  }
}

// Scan for all HTML files in the project
const entrypoints = [...new Bun.Glob("**.html").scanSync("src")]
  .map(a => path.resolve("src", a))
  .filter(dir => !dir.includes("node_modules"));
console.log(`📄 Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process\n`);

// Build all the HTML files
const result = await build({
  entrypoints,
  outdir,
  plugins: [plugin],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  ...cliConfig, // Merge in any CLI-provided options
});

// Print the results
const end = performance.now();

const outputTable = result.outputs.map(output => ({
  "File": path.relative(process.cwd(), output.path),
  "Type": output.kind,
  "Size": formatFileSize(output.size),
}));

console.table(outputTable);

// Post-process: update manifest.json icon paths to match Bun's hashed filenames
const { readFile, writeFile } = await import("fs/promises");
const distHtml = await readFile(path.join(outdir, "index.html"), "utf-8");

// Extract hashed paths for both icon sizes
const icon192Match = distHtml.match(/href="\.\/([^"]*icon-192[^"]*\.png)"/);
const icon512Match = distHtml.match(/href="\.\/([^"]*icon-512[^"]*\.png)"/);

const manifestPath = path.join(outdir, "manifest.json");
if (existsSync(manifestPath) && (icon192Match || icon512Match)) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
  manifest.icons = [
    icon192Match && {
      src: `/${icon192Match[1]}`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable",
    },
    icon512Match && {
      src: `/${icon512Match[1]}`,
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
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
    .filter((o) => ['entry-point', 'asset', 'chunk'].includes(o.kind))
    .map((o) => `/${path.relative(outdir, o.path)}`)
    .filter((p) => !p.endsWith('.map')); // skip sourcemaps

  // Always include root and manifest
  const precacheUrls = ['/', '/manifest.json', ...cacheableAssets]
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe

  let swContent = await readFile(swPath, "utf-8");
  swContent = swContent.replace(
    /const PRECACHE_URLS = \[[\s\S]*?\];/,
    `const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};`
  );
  await writeFile(swPath, swContent);
  console.log(`📦 sw.js updated with ${precacheUrls.length} pre-cached URLs`);
}

const buildTime = (end - start).toFixed(2);
console.log(`\n✅ Build completed in ${buildTime}ms\n`);

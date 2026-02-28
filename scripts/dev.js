import { watch } from "node:fs";
import { join } from "node:path";

const ROOT = import.meta.dir.replace(/\/scripts$/, "");
const PORT = Number.parseInt(process.env.PORT || "3000", 10);

async function build() {
  const start = performance.now();
  const proc = Bun.spawn(["bun", "run", "scripts/build.js"], {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
  });
  await proc.exited;
  if (proc.exitCode !== 0) console.error("Build failed");
  else console.log(`Rebuilt in ${(performance.now() - start).toFixed(0)}ms`);
}

await build();

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
};

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = join(ROOT, "dist", pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      const ext = pathname.substring(pathname.lastIndexOf("."));
      return new Response(file, {
        headers: { "Content-Type": MIME[ext] || "application/octet-stream" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Dev server → http://localhost:${PORT}`);

const WATCH_DIRS = ["modules", "."];
const WATCH_EXTS = [".js", ".css", ".html", ".svg"];

for (const dir of WATCH_DIRS) {
  watch(join(ROOT, dir), { recursive: false }, async (_event, filename) => {
    if (!filename || !WATCH_EXTS.some((ext) => filename.endsWith(ext))) return;
    console.log(`\nChanged: ${filename}`);
    await build();
  });
}

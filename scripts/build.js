import { copyFileSync, cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = import.meta.dir.replace(/\/scripts$/, "");
const DIST = join(ROOT, "dist");

mkdirSync(DIST, { recursive: true });

const result = await Bun.build({
  entrypoints: [join(ROOT, "modules/main.js")],
  outdir: DIST,
  target: "browser",
  format: "esm",
  splitting: true,
  minify: true,
  naming: "[dir]/[name]-[hash].[ext]",
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const entryOutput = result.outputs.find((o) => o.kind === "entry-point");
const entryName = entryOutput.path.split("/").pop();

// Copy static assets
copyFileSync(join(ROOT, "style.css"), join(DIST, "style.css"));
copyFileSync(join(ROOT, "favicon.svg"), join(DIST, "favicon.svg"));

// Copy brotli WASM file next to the JS chunks
cpSync(
  join(ROOT, "node_modules/brotli-wasm/pkg.web/brotli_wasm_bg.wasm"),
  join(DIST, "brotli_wasm_bg.wasm"),
);

// Generate index.html from template with correct script path
const html = await Bun.file(join(ROOT, "index.html")).text();
const outputHtml = html.replace('src="modules/main.js"', `src="${entryName}"`);
await Bun.write(join(DIST, "index.html"), outputHtml);

console.log("Build complete → dist/");
for (const output of result.outputs) {
  const name = output.path.split("/").pop();
  const kb = (output.size / 1024).toFixed(1);
  console.log(`  ${name}  (${kb} KB)`);
}

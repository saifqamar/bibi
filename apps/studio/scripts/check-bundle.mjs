// Fails if the writer entry statically imports admin code (admin must stay a lazy chunk).
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../dist/.vite/manifest.json", import.meta.url)));
const entry = manifest["index.html"];
const adminKey = Object.keys(manifest).find((key) => key.includes("src/admin/AdminApp"));

if (!adminKey) throw new Error("Admin chunk not found in manifest");

const seen = new Set();
function staticDeps(key) {
  if (seen.has(key)) return;
  seen.add(key);
  for (const dep of manifest[key]?.imports ?? []) staticDeps(dep);
}
staticDeps("index.html");

if (seen.has(adminKey)) {
  console.error("Admin code is part of the writer bundle");
  process.exit(1);
}
if (!(entry.dynamicImports ?? []).includes(adminKey)) {
  console.error("Admin area is not loaded lazily");
  process.exit(1);
}
console.log(`OK: admin is a separate lazy chunk (${manifest[adminKey].file})`);

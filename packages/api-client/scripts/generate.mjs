// Generates src/openapi.json and src/schema.d.ts from the FastAPI app.
// `--check` fails if the committed files are out of date (used in CI).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(here, "..");
const backend = resolve(pkg, "../../backend");
const check = process.argv.includes("--check");
const python = process.env.PYTHON ?? "python";

const outDir = check ? mkdtempSync(join(tmpdir(), "bibi-api-")) : join(pkg, "src");
const specPath = join(outDir, "openapi.json");
execFileSync(python, ["-m", "app.export_openapi", specPath], { cwd: backend, stdio: "inherit" });

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const ast = await openapiTS(spec);
const header = "// Generated from the backend OpenAPI schema. Do not edit; run `pnpm api-client:generate`.\n";
const types = header + astToString(ast);
writeFileSync(join(outDir, "schema.d.ts"), types);

if (check) {
  const stale = ["openapi.json", "schema.d.ts"].filter(
    (name) => readFileSync(join(outDir, name), "utf8") !== readFileSync(join(pkg, "src", name), "utf8"),
  );
  if (stale.length) {
    console.error(`API client is out of date (${stale.join(", ")}). Run: pnpm api-client:generate`);
    process.exit(1);
  }
  console.log("API client is up to date.");
}

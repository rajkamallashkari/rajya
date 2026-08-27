import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const cases = [
  { file: "eslint-plugin-rajya/fixtures/raw-button.tsx", rule: "rajya/no-raw-button" },
  { file: "eslint-plugin-rajya/fixtures/hex.ts", rule: "rajya/no-hardcoded-hex" },
  { file: "eslint-plugin-rajya/fixtures/z-literal.tsx", rule: "rajya/no-z-index-literal" },
  { file: "eslint-plugin-rajya/fixtures/bare-string.tsx", rule: "rajya/no-user-facing-string" },
  { file: "eslint-plugin-rajya/fixtures/whole-store.ts", rule: "rajya/no-whole-store-zustand" },
];

let failed = false;

for (const item of cases) {
  const result = spawnSync("npx", ["eslint", "--no-ignore", item.file], {
    cwd: root,
    encoding: "utf8",
  });
  const output = `${result.stdout}\n${result.stderr}`;
  const hit = result.status !== 0 && output.includes(item.rule);
  if (!hit) {
    failed = true;
    process.stderr.write(`expected ${item.rule} to fail on ${item.file}\n${output}\n`);
  }
}

if (failed) {
  process.exit(1);
}

process.stdout.write("lint rules proven\n");

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const probe = path.join(root, "src/__gate_probe__.ts");

const source = `export function gateProbe(flag: boolean): number {
  if (flag) {
    return 1;
  }
  return 0;
}
`;

fs.writeFileSync(probe, source);

try {
  const result = spawnSync("npx", ["vitest", "run", "--coverage"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "true" },
  });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0) {
    process.stderr.write(`coverage gate did not fail:\n${output}\n`);
    process.exit(1);
  }
  process.stdout.write("coverage gate proven\n");
} finally {
  fs.rmSync(probe, { force: true });
}

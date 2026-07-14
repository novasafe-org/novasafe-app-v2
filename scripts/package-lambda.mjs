#!/usr/bin/env node
/**
 * Package NovaSafe App for AWS Lambda (zip, no ECR).
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const parseArgs = () => {
  const args = process.argv.slice(2);
  let output = join(repoRoot, "dist/lambda.zip");

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--output") {
      output = resolve(args[++i]);
    }
  }

  return { output };
};

const run = (command, options = {}) => {
  console.log(`[lambda-package] $ ${command}`);
  execSync(command, { stdio: "inherit", ...options });
};

const assertPackage = (packageDir) => {
  const required = [
    join(packageDir, "dist/runtimes/lambda.mjs"),
    join(packageDir, "dist/server/server.js"),
    join(packageDir, "dist/client"),
    join(packageDir, "package.json"),
  ];

  for (const filePath of required) {
    if (!existsSync(filePath)) {
      console.error(`::error::Lambda package missing: ${filePath}`);
      process.exit(1);
    }
  }

  if (existsSync(join(packageDir, "node_modules"))) {
    console.error("::error::Lambda package must not include node_modules");
    process.exit(1);
  }
};

const { output } = parseArgs();
const stageDir = mkdtempSync(join(tmpdir(), "novasafe-app-lambda-"));
const packageDir = join(stageDir, "package");

try {
  run("pnpm build", { cwd: repoRoot });

  mkdirSync(join(packageDir, "dist/runtimes"), { recursive: true });
  cpSync(join(repoRoot, "dist/client"), join(packageDir, "dist/client"), { recursive: true });
  cpSync(join(repoRoot, "dist/server"), join(packageDir, "dist/server"), { recursive: true });
  cpSync(join(repoRoot, "bin/lambda.mjs"), join(packageDir, "dist/runtimes/lambda.mjs"));
  writeFileSync(join(packageDir, "package.json"), JSON.stringify({ type: "module" }, null, 2));

  assertPackage(packageDir);

  mkdirSync(dirname(output), { recursive: true });
  rmSync(output, { force: true });
  run(`cd "${packageDir}" && zip -qr "${output}" .`);

  const zipSize = statSync(output).size;
  if (zipSize > 50 * 1024 * 1024) {
    console.error(`::error::Lambda zip is ${(zipSize / 1024 / 1024).toFixed(2)} MB — limit is 50 MB`);
    process.exit(1);
  }

  console.log(`[lambda-package] app → ${output} (${(zipSize / 1024 / 1024).toFixed(2)} MB)`);
} finally {
  rmSync(stageDir, { recursive: true, force: true });
}

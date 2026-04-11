import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// lib/ -> src/ -> api/ -> apps/ -> ai-interview/  (4 hops = project root)
const projectRoot = path.resolve(__dirname, "..", "..", "..", "..");

function parseEnvValue(rawValue) {
  const trimmed = String(rawValue || "").trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function applyEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = parseEnvValue(trimmed.slice(separatorIndex + 1));
    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = value;
  }

  return true;
}

export function loadInterviewAppEnv() {
  const candidatePaths = [
    path.join(projectRoot, ".env")
  ];

  for (const candidatePath of candidatePaths) {
    if (applyEnvFile(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

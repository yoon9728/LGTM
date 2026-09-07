import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const children = [
  ["apps/api", "node_modules/tsx/dist/cli.mjs", "watch", "src/index.ts"],
  ["apps/web", "node_modules/next/dist/bin/next", "dev", "--port", "4173"],
].map(([directory, executable, ...args]) => spawn(process.execPath, [executable, ...args], {
  cwd: resolve(root, directory), stdio: "inherit", windowsHide: true,
}));

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
    } else child.kill("SIGTERM");
  }
  process.exitCode = code;
}
for (const child of children) {
  child.on("error", () => stop(1));
  child.on("exit", (code) => stop(code ?? 0));
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

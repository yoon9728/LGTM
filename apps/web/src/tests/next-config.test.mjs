import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { test } from "vitest";
import ts from "typescript";

const configPath = new URL("../../next.config.ts", import.meta.url);
const code = ts.transpileModule(readFileSync(configPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadConfig(env) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(code, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env, cwd: () => fileURLToPath(new URL("../../", import.meta.url)) },
  }, { filename: fileURLToPath(configPath) });
  return loadedModule.exports.default;
}

test("Vercel leaves packaging to its adapter instead of requiring standalone traces", () => {
  const config = loadConfig({ VERCEL: "1", NEXT_ADAPTER_PATH: "platform-adapter" });
  assert.equal(config.output, undefined);
});

test("Vercel also uses native packaging when its adapter flag is absent", () => {
  assert.equal(loadConfig({ VERCEL: "1" }).output, undefined);
});

test("local and Docker builds keep the standalone output required by the Dockerfile", () => {
  for (const env of [{}, { VERCEL: "" }, { VERCEL: "0" }]) {
    assert.equal(loadConfig(env).output, "standalone");
  }
});

test("both packaging modes preserve security headers and the configured API origin", async () => {
  for (const VERCEL of ["1", "0"]) {
    const config = loadConfig({ VERCEL, NEXT_PUBLIC_API_URL: "https://api.example.test" });
    const [rule] = await config.headers();
    assert.equal(rule.source, "/(.*)");
    assert.equal(rule.headers.find(({ key }) => key === "X-Frame-Options").value, "DENY");
    assert.match(rule.headers.find(({ key }) => key === "Content-Security-Policy").value,
      /connect-src 'self' https:\/\/api\.example\.test/);
  }
});
